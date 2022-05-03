let wasm;const heap=new Array(32).fill(void 0);function getObject(e){return heap[e]}heap.push(void 0,null,!0,!1);let heap_next=heap.length;function dropObject(e){e<36||(heap[e]=heap_next,heap_next=e)}function takeObject(e){const t=getObject(e);return dropObject(e),t}function debugString(e){const t=typeof e;if("number"==t||"boolean"==t||null==e)return`${e}`;if("string"==t)return`"${e}"`;if("symbol"==t){const t=e.description;return null==t?"Symbol":`Symbol(${t})`}if("function"==t){const t=e.name;return"string"==typeof t&&t.length>0?`Function(${t})`:"Function"}if(Array.isArray(e)){const t=e.length;let n="[";t>0&&(n+=debugString(e[0]));for(let r=1;r<t;r++)n+=", "+debugString(e[r]);return n+="]",n}const n=/\[object ([^\]]+)\]/.exec(toString.call(e));let r;if(!(n.length>1))return toString.call(e);if(r=n[1],"Object"==r)try{return"Object("+JSON.stringify(e)+")"}catch(e){return"Object"}return e instanceof Error?`${e.name}: ${e.message}\n${e.stack}`:r}let WASM_VECTOR_LEN=0,cachegetUint8Memory0=null;function getUint8Memory0(){return null!==cachegetUint8Memory0&&cachegetUint8Memory0.buffer===wasm.memory.buffer||(cachegetUint8Memory0=new Uint8Array(wasm.memory.buffer)),cachegetUint8Memory0}const cachedTextEncoder=new TextEncoder("utf-8"),encodeString="function"==typeof cachedTextEncoder.encodeInto?function(e,t){return cachedTextEncoder.encodeInto(e,t)}:function(e,t){const n=cachedTextEncoder.encode(e);return t.set(n),{read:e.length,written:n.length}};function passStringToWasm0(e,t,n){if(void 0===n){const n=cachedTextEncoder.encode(e),r=t(n.length);return getUint8Memory0().subarray(r,r+n.length).set(n),WASM_VECTOR_LEN=n.length,r}let r=e.length,a=t(r);const c=getUint8Memory0();let o=0;for(;o<r;o++){const t=e.charCodeAt(o);if(t>127)break;c[a+o]=t}if(o!==r){0!==o&&(e=e.slice(o)),a=n(a,r,r=o+3*e.length);const t=getUint8Memory0().subarray(a+o,a+r);o+=encodeString(e,t).written}return WASM_VECTOR_LEN=o,a}let cachegetInt32Memory0=null;function getInt32Memory0(){return null!==cachegetInt32Memory0&&cachegetInt32Memory0.buffer===wasm.memory.buffer||(cachegetInt32Memory0=new Int32Array(wasm.memory.buffer)),cachegetInt32Memory0}const cachedTextDecoder=new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0});function getStringFromWasm0(e,t){return cachedTextDecoder.decode(getUint8Memory0().subarray(e,e+t))}function addHeapObject(e){heap_next===heap.length&&heap.push(heap.length+1);const t=heap_next;return heap_next=heap[t],heap[t]=e,t}cachedTextDecoder.decode();export function exec(e,t,n){const r=passStringToWasm0(e,wasm.__wbindgen_malloc,wasm.__wbindgen_realloc),a=WASM_VECTOR_LEN,c=passStringToWasm0(n,wasm.__wbindgen_malloc,wasm.__wbindgen_realloc),o=WASM_VECTOR_LEN;wasm.exec(r,a,addHeapObject(t),c,o)}function handleError(e,t){try{return e.apply(this,t)}catch(e){wasm.__wbindgen_exn_store(addHeapObject(e))}}async function load(e,t){if("function"==typeof Response&&e instanceof Response){if("function"==typeof WebAssembly.instantiateStreaming)try{return await WebAssembly.instantiateStreaming(e,t)}catch(t){if("application/wasm"==e.headers.get("Content-Type"))throw t;console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",t)}const n=await e.arrayBuffer();return await WebAssembly.instantiate(n,t)}{const n=await WebAssembly.instantiate(e,t);return n instanceof WebAssembly.Instance?{instance:n,module:e}:n}}async function init(e){void 0===e&&(e=new URL("cambridge_asm_web_bg.wasm",import.meta.url));const t={wbg:{}};t.wbg.__wbindgen_object_drop_ref=function(e){takeObject(e)},t.wbg.__wbg_new_693216e109162396=function(){return addHeapObject(new Error)},t.wbg.__wbg_stack_0ddaca5d1abfb52f=function(e,t){const n=passStringToWasm0(getObject(t).stack,wasm.__wbindgen_malloc,wasm.__wbindgen_realloc),r=WASM_VECTOR_LEN;getInt32Memory0()[e/4+1]=r,getInt32Memory0()[e/4+0]=n},t.wbg.__wbg_error_09919627ac0992f5=function(e,t){try{console.error(getStringFromWasm0(e,t))}finally{wasm.__wbindgen_free(e,t)}},t.wbg.__wbg_call_3ed288a247f13ea5=function(){return handleError((function(e,t,n){return addHeapObject(getObject(e).call(getObject(t),getObject(n)))}),arguments)},t.wbg.__wbg_buffer_7af23f65f6c64548=function(e){return addHeapObject(getObject(e).buffer)},t.wbg.__wbg_newwithbyteoffsetandlength_ce1e75f0ce5f7974=function(e,t,n){return addHeapObject(new Uint8Array(getObject(e),t>>>0,n>>>0))},t.wbg.__wbg_new_cc9018bd6f283b6f=function(e){return addHeapObject(new Uint8Array(getObject(e)))},t.wbg.__wbindgen_debug_string=function(e,t){const n=passStringToWasm0(debugString(getObject(t)),wasm.__wbindgen_malloc,wasm.__wbindgen_realloc),r=WASM_VECTOR_LEN;getInt32Memory0()[e/4+1]=r,getInt32Memory0()[e/4+0]=n},t.wbg.__wbindgen_throw=function(e,t){throw new Error(getStringFromWasm0(e,t))},t.wbg.__wbindgen_memory=function(){return addHeapObject(wasm.memory)},("string"==typeof e||"function"==typeof Request&&e instanceof Request||"function"==typeof URL&&e instanceof URL)&&(e=fetch(e));const{instance:n,module:r}=await load(await e,t);return wasm=n.exports,init.__wbindgen_wasm_module=r,wasm}export default init;
