use cambridge_asm::{
    exec::{Executor, Status},
    inst::InstSet,
    make_io,
    parse::{self, DefaultSet},
};
use js_sys::{Function, Uint8Array};
use serde::Serialize;
use serde_repr::Serialize_repr;
use std::{
    cell::RefCell,
    io::{self, Read, Write},
    str::FromStr,
    sync::Mutex,
};
use wasm_bindgen::prelude::*;

static INPUT_BUFFER: Mutex<Vec<u8>> = const { Mutex::new(Vec::new()) };

thread_local! {
    static OUTPUT_CB: RefCell<Option<Function>> = const { RefCell::new(None) };
}

#[wasm_bindgen]
pub fn set_input_buffer(input: Uint8Array) {
    let mut buf = INPUT_BUFFER.lock().unwrap();

    buf.fill(0);

    let input = input.to_vec();
    buf.resize(input.len(), 0);

    buf.as_mut_slice().write_all(&input).unwrap();
}

#[wasm_bindgen(typescript_custom_section)]
const OUTPUT_CB: &'static str = r#"export type OutputCB = (buf: Uint8Array) => void;"#;

#[wasm_bindgen(typescript_custom_section)]
const STATUS: &'static str = r#"export const COMPLETE = 1;
export const CONTINUE = 2;
export const ERROR = 3;
export const INPUT_REQUEST = 4;
type Stat<C, D = undefined> = { status: C, data: D };
export type Status = Stat<typeof COMPLETE> | Stat<typeof CONTINUE> | Stat<typeof ERROR, string> | Stat<typeof INPUT_REQUEST, boolean>"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "OutputCB")]
    pub type OutputCB;

    #[wasm_bindgen(typescript_type = "Status")]
    pub type StatusExt;

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

fn function_from_jsvalue(obj: JsValue) -> Function {
    obj.dyn_into().unwrap()
}

struct Input;

impl Read for Input {
    fn read(&mut self, mut buf: &mut [u8]) -> io::Result<usize> {
        let lock = INPUT_BUFFER.lock().unwrap();
        log(format!("{lock:?}").as_str());
        let written = buf.write(lock.as_slice())?;
        Ok(written)
    }

    fn read_exact(&mut self, buf: &mut [u8]) -> io::Result<()> {
        use io::{
            Error,
            ErrorKind::{Other, UnexpectedEof},
        };
        use std::cmp::Ordering;

        match self.read(buf)?.cmp(&buf.len()) {
            Ordering::Less => Err(Error::new(UnexpectedEof, "Insufficient input")),
            Ordering::Equal => Ok(()),
            Ordering::Greater => Err(Error::new(Other, "This shouldn't happen")),
        }
    }
}

struct Output;

impl Write for Output {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        OUTPUT_CB
            .with_borrow(|maybe_func| {
                maybe_func
                    .as_ref()
                    .map(|f| f.call1(&JsValue::null(), &Uint8Array::from(buf)))
                    .unwrap()
            })
            .unwrap();

        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

#[wasm_bindgen]
pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[derive(Serialize_repr)]
#[repr(u8)]
enum StatInt {
    Complete = 1,
    Continue = 2,
    Error = 3,
    InputRequest = 4,
}

#[derive(Serialize)]
#[serde(untagged)]
enum DataInt {
    Str(String),
    Bool(bool),
}

#[derive(Serialize)]
struct Stat {
    status: StatInt,
    data: Option<DataInt>,
}

impl Stat {
    pub fn new(status: StatInt, data: Option<DataInt>) -> Self {
        Self { status, data }
    }
}

impl From<Stat> for StatusExt {
    fn from(value: Stat) -> Self {
        StatusExt {
            obj: serde_wasm_bindgen::to_value(&value).unwrap(),
        }
    }
}

#[wasm_bindgen]
pub struct PasmExecutor {
    exe: Executor,
    first_inst: bool,
}

#[wasm_bindgen]
impl PasmExecutor {
    #[wasm_bindgen(constructor)]
    pub fn new(prog: &str, output: OutputCB) -> Self {
        OUTPUT_CB
            .with_borrow_mut(|maybe_func| maybe_func.replace(function_from_jsvalue(output.obj)));

        let input = Input;
        let output = Output;
        Self {
            exe: parse::jit::<DefaultSet>(prog, make_io!(input, output)).unwrap(),
            first_inst: true,
        }
    }

    #[wasm_bindgen]
    pub fn step(&mut self) -> StatusExt {
        if self.first_inst {
            self.first_inst = false;
            return self.detect_input_to_status().into();
        }

        match self.exe.step::<DefaultSet>() {
            Status::Complete => Stat::new(StatInt::Complete, None),
            Status::Continue => self.detect_input_to_status(),
            Status::Error(rt_error) => {
                let mut buf = Vec::new();
                self.exe
                    .source
                    .handle_err(&mut buf, &rt_error, self.exe.ctx.mar)
                    .unwrap();
                Stat::new(
                    StatInt::Error,
                    Some(DataInt::Str(String::from_utf8_lossy(&buf).into_owned())),
                )
            }
        }
        .into()
    }

    fn detect_input(&self) -> Option<bool> {
        if self.exe.ctx.mar == self.exe.prog.len() || self.exe.ctx.end {
            return None;
        }

        let inst = if let Some(inst) = self.exe.prog.get(&self.exe.ctx.mar) {
            inst
        } else {
            panic!("Unable to fetch instruction. Please report this as a bug with full debug logs attached.")
        };

        let (rin, inp) = (
            DefaultSet::from_str("RIN").unwrap().id(),
            DefaultSet::from_str("IN").unwrap().id(),
        );

        log(format!("{rin} {inp} {}", inst.id).as_str());

        match inst.id {
            x if x == rin => Some(true),
            x if x == inp => Some(false),
            _ => None,
        }
    }

    fn detect_input_to_status(&self) -> Stat {
        match self.detect_input() {
            Some(to_newline) => Stat::new(StatInt::InputRequest, Some(DataInt::Bool(to_newline))),
            None => Stat::new(StatInt::Continue, None),
        }
    }
}
