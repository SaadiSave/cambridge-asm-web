import init,{exec}from"./cambridge_asm_web.js";{const e=(...e)=>{let s="";for(const o of e)s+=`${o}`;return s},s=console.error.bind(console);console.error=(...o)=>{postMessage({check:2,message:e(o)}),s(...o)}}onmessage=async e=>{await init();let s=e.data;if(0!==s.check)throw new Error(`Invalid message from main: ${e}`);{const e=s.input,o=e=>{postMessage({check:4,bytes:e})};postMessage({check:3,time:performance.now()});try{exec(e,o,s.prog)}finally{postMessage({check:3,time:performance.now()}),postMessage({check:1})}}};