use std::io::{self, Read, Write};
use wasm_bindgen::prelude::*;

fn set_panic_hook() {
    console_error_panic_hook::set_once()
}

#[wasm_bindgen]
#[repr(transparent)]
pub struct Input(Vec<u8>);

#[wasm_bindgen]
impl Input {
    #[wasm_bindgen(constructor)]
    pub fn new(s: String) -> Self {
        Self(s.into_bytes())
    }
}

impl Read for Input {
    fn read(&mut self, mut buf: &mut [u8]) -> io::Result<usize> {
        use io::{Error, ErrorKind::UnexpectedEof};

        if self.0.is_empty() {
            Err(Error::new(UnexpectedEof, "Insufficient input"))
        } else {
            let written = buf.write(&self.0)?;
            self.0.drain(0..written);
            Ok(written)
        }
    }

    fn read_exact(&mut self, buf: &mut [u8]) -> io::Result<()> {
        use io::{
            Error,
            ErrorKind::{Other, UnexpectedEof},
        };
        use std::cmp::Ordering;

        let bytes_written = self.read(buf)?;

        match bytes_written.cmp(&buf.len()) {
            Ordering::Less => Err(Error::new(UnexpectedEof, "Insufficient input")),
            Ordering::Equal => Ok(()),
            Ordering::Greater => Err(Error::new(Other, "I don't know what happened")),
        }
    }
}

#[wasm_bindgen]
#[repr(transparent)]
pub struct Output(js_sys::Function);

#[wasm_bindgen]
impl Output {
    #[wasm_bindgen(constructor)]
    pub fn new(func: js_sys::Function) -> Self {
        Self(func)
    }
}

impl Write for Output {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.0
            .call1(&JsValue::null(), &js_sys::Uint8Array::from(buf))
            .unwrap();
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

#[wasm_bindgen]
pub fn exec(read: Input, write: Output, input: &str) {
    use cambridge_asm::{
        make_io,
        parse::{get_fn_ext, parse},
    };

    set_panic_hook();

    let mut exec = parse(input, get_fn_ext, make_io!(read, write));

    exec.exec();
}
