use crate::common::*;
use js_sys::{Function, Uint8Array};
use std::io::{self, Read, Write};

#[repr(transparent)]
pub struct Input(Vec<u8>);

impl Input {
    pub fn new(s: Uint8Array) -> Self {
        Self(s.to_vec())
    }
}

impl Read for Input {
    fn read(&mut self, mut buf: &mut [u8]) -> io::Result<usize> {
        use io::{Error, ErrorKind::UnexpectedEof};

        if self.0.is_empty() {
            Err(Error::new(UnexpectedEof, "Input is empty"))
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

#[repr(transparent)]
pub struct Output(Function);

impl Output {
    pub fn new(f: Function) -> Self {
        Self(f)
    }

    pub fn call(&self, buf: &[u8]) {
        self.0
            .call1(&JsValue::null(), &Uint8Array::from(buf))
            .unwrap();
    }
}

impl Write for Output {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.call(buf);
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}
