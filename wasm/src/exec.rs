use crate::{
    common::*,
    io::{Input, Output},
};
use cambridge_asm::{
    exec::{ExecInst, Executor as CAsmExecutor, PasmError, Status as ExecStatus},
    inst::InstSet,
    make_io,
    parse::{jit, DefaultSet},
};

#[repr(u8)]
#[derive(Clone, Copy)]
#[wasm_bindgen]
pub enum Status {
    Complete = 0,
    Continue = 1,
    Error = 2,
}

impl From<&ExecStatus> for Status {
    fn from(value: &ExecStatus) -> Self {
        match value {
            ExecStatus::Complete => Self::Complete,
            ExecStatus::Continue => Self::Continue,
            ExecStatus::Error(_) => Self::Error,
        }
    }
}

#[wasm_bindgen]
pub struct Feedback {
    pub status: Status,
    error: Option<PasmError>,
}

#[wasm_bindgen]
impl Feedback {
    pub fn handle(&self) {
        let _ = self.error;

        todo!()
    }
}

#[wasm_bindgen(typescript_custom_section)]
const T_OutputCb: &'static str = r#"
export type OutputCb = (arg0: Uint8Array) => void
"#;

#[wasm_bindgen(typescript_custom_section)]
const T_ErrorCb: &'static str = r#"
export type ErrorCb = (arg0: string) => void
"#;

#[wasm_bindgen(typescript_custom_section)]
const T_Source: &'static str = r#"
export type Source = Map<BigInt, string>
"#;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = "OutputCb")]
    pub type OutputCb;

    #[wasm_bindgen(typescript_type = "ErrorCb")]
    pub type ErrorCb;

    #[wasm_bindgen(typescript_type = "Source")]
    pub type Source;
}

#[wasm_bindgen]
pub struct Executor {
    inner: CAsmExecutor,
    error_cb: js_sys::Function,
}

#[wasm_bindgen]
impl Executor {
    #[wasm_bindgen(constructor)]
    pub fn new(input: js_sys::Uint8Array, error_cb: ErrorCb, output_cb: OutputCb, prog: &str) -> Self {
        console_error_panic_hook::set_once();

        Self {
            inner: jit::<DefaultSet>(
                prog,
                make_io!(Input::new(input), Output::new(output_cb.unchecked_into())),
            )
            .unwrap(),
            error_cb: error_cb.unchecked_into(),
        }
    }

    pub fn source(&self) -> Source {
        let ret = js_sys::Map::new();

        for (idx, ExecInst { func, op }) in &self.inner.prog {
            ret.set(
                &js_sys::BigInt::from(*idx),
                &js_sys::JsString::from(format!(
                    "{} {op}",
                    DefaultSet::from_func_ptr(*func).unwrap()
                )),
            );
        }

        ret.unchecked_into()
    }

    #[wasm_bindgen(getter)]
    pub fn pc(&self) -> usize {
        self.inner.ctx.mar
    }

    pub fn step(&mut self) -> Feedback {
        let stat = self.inner.step::<DefaultSet>();

        let ret_stat = Status::from(&stat);

        let (status, error) = if let Status::Error = ret_stat {
            (
                ret_stat,
                match stat {
                    ExecStatus::Error(e) => Some(e),
                    _ => unreachable!(),
                },
            )
        } else {
            (ret_stat, None)
        };

        Feedback { status, error }
    }

    fn call_error_cb(&self, err: PasmError) {
        self.error_cb
            .call1(&JsValue::null(), &js_sys::JsString::from(err.to_string()))
            .unwrap();
    }

    pub fn exec(&mut self) {
        use ExecStatus::*;

        let err = loop {
            match self.inner.step::<DefaultSet>() {
                Complete => break None,
                Continue => continue,
                Error(e) => break Some(e),
            }
        };

        if let Some(e) = err {
            self.call_error_cb(e);
        }
    }

    pub fn handle_err(&mut self, Feedback { error, .. }: Feedback) {
        if let Some(e) = error {
            self.call_error_cb(e);
        }
    }
}
