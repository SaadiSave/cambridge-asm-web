use cambridge_asm::{
    exec::{ExecInst, Executor, RtError, Status as ExecStat},
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
    /// [`thread_local`] so that type can be [`!Send`] and [`!Sync`]
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
        log(format!("input bytes: {lock:?}").as_str());
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
enum StatusCode {
    Complete = 1,
    Continue = 2,
    Error = 3,
    InputRequest = 4,
}

#[derive(Serialize)]
#[serde(untagged)]
enum StatusData {
    Str(String),
    Bool(bool),
}

#[derive(Serialize)]
struct Status {
    status: StatusCode,
    data: Option<StatusData>,
}

impl Status {
    pub const COMPLETE: Self = Self {
        status: StatusCode::Complete,
        data: None,
    };

    pub const CONTINUE: Self = Self {
        status: StatusCode::Continue,
        data: None,
    };

    pub fn error(exe: &Executor, error: RtError) -> Self {
        let mut buf = Vec::new();
        exe.source
            .handle_err(&mut buf, &error, exe.ctx.mar)
            .unwrap();

        Self {
            status: StatusCode::Error,
            data: Some(StatusData::Str(String::from_utf8_lossy(&buf).into_owned())),
        }
    }

    pub fn input_request(to_eol: bool) -> Self {
        Self {
            status: StatusCode::InputRequest,
            data: Some(StatusData::Bool(to_eol)),
        }
    }
}

impl From<Status> for StatusExt {
    fn from(value: Status) -> Self {
        StatusExt {
            obj: serde_wasm_bindgen::to_value(&value).unwrap(),
        }
    }
}

#[wasm_bindgen]
pub struct PasmExecutor {
    exe: Executor,
    first_inst: bool,
    input_enabled: bool,
}

#[wasm_bindgen]
impl PasmExecutor {
    #[wasm_bindgen(constructor)]
    pub fn new(prog: &str, output: OutputCB) -> Self {
        OUTPUT_CB
            .with_borrow_mut(|maybe_func| maybe_func.replace(function_from_jsvalue(output.obj)));

        let input = Input;
        let output = Output;
        let exe = parse::jit::<DefaultSet>(prog, make_io!(input, output))
            .map_err(|e| wasm_bindgen::throw_str(e.iter().next().unwrap().1.to_string().as_str()))
            .unwrap();

        let (rin, inp) = (
            DefaultSet::from_str("RIN").unwrap().id(),
            DefaultSet::from_str("IN").unwrap().id(),
        );

        let input_enabled = exe
            .prog
            .iter()
            .any(|(_, &ExecInst { id, .. })| id == rin || id == inp);

        Self {
            exe,
            input_enabled,
            first_inst: true,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn input_enabled(&self) -> bool {
        self.input_enabled
    }

    #[wasm_bindgen]
    pub fn run_without_input(&mut self) {
        self.exe.exec::<DefaultSet>();
    }

    #[wasm_bindgen]
    pub fn step(&mut self) -> StatusExt {
        if self.first_inst {
            self.first_inst = false;
            return self.detect_input().into();
        }

        match self.exe.step::<DefaultSet>() {
            ExecStat::Complete => Status::COMPLETE,
            ExecStat::Continue => self.detect_input(),
            ExecStat::Error(rt_error) => Status::error(&self.exe, rt_error),
        }
        .into()
    }

    fn detect_input(&self) -> Status {
        if self.exe.ctx.mar == self.exe.prog.len() || self.exe.ctx.end {
            return Status::CONTINUE;
        }

        // lookahead
        let inst = if let Some(inst) = self.exe.prog.get(&self.exe.ctx.mar) {
            inst
        } else {
            panic!("Unable to fetch instruction. Please report this as a bug with full debug logs attached.")
        };

        let (rin, inp) = (
            DefaultSet::from_str("RIN").unwrap().id(),
            DefaultSet::from_str("IN").unwrap().id(),
        );

        let input_detected = match inst.id {
            // to eol
            x if x == rin => Some(true),
            // single character
            x if x == inp => Some(false),
            // no input needed
            _ => None,
        };

        match input_detected {
            Some(to_eol) => {
                log(format!(
                    "Input detected\nRIN: {rin}\nIN: {inp}\nCurrent: {}",
                    inst.id
                )
                .as_str());
                Status::input_request(to_eol)
            }
            None => Status::CONTINUE,
        }
    }
}
