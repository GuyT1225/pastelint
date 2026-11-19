import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const source=readFileSync(new URL("../js/utils.js",import.meta.url),"utf8");
function setup({modern,legacy=true,secure=true}={}){
  const calls=[];const temp={style:{},setAttribute(){},select(){calls.push("select");},remove(){calls.push("remove");}};
  const context=vm.createContext({navigator:{clipboard:modern?{writeText:modern}:undefined},window:{isSecureContext:secure},document:{activeElement:{focus(){calls.push("focus");}},createElement(){return temp;},body:{appendChild(){calls.push("append");}},execCommand(){calls.push("copy");if(legacy instanceof Error)throw legacy;return legacy;}}});
  vm.runInContext(source,context);
  return {copy:text=>vm.runInContext("PasteLintUtils",context).copyToClipboard(text),calls,temp};
}
test("modern clipboard success avoids fallback",async()=>{const s=setup({modern:async text=>assert.equal(text,"exact text")});assert.equal(await s.copy("exact text"),true);assert.deepEqual(s.calls,[]);});
test("rejected modern API falls back with exact text",async()=>{const s=setup({modern:async()=>{throw Error("denied");}});assert.equal(await s.copy(" line\n"),true);assert.equal(s.temp.value," line\n");assert.deepEqual(s.calls,["append","select","copy","remove","focus"]);});
test("legacy false and throws are failures with cleanup",async()=>{for(const legacy of [false,undefined,new Error("denied")]){const s=setup({legacy:legacy===undefined?null:legacy});assert.equal(await s.copy("text"),false);assert.deepEqual(s.calls,["append","select","copy","remove","focus"]);}});
test("insecure context uses legacy and empty text does not copy",async()=>{const s=setup({secure:false,modern:async()=>{throw Error("must not call");}});assert.equal(await s.copy(""),false);assert.deepEqual(s.calls,[]);assert.equal(await s.copy("text"),true);});
test("three tool handlers await shared copy result",()=>{for(const [file,fn] of [["script.js","copyOutput"],["second-draft.js","copySecondDraftOutput"],["ssml-builder.js","copyText"]]){const content=readFileSync(new URL("../js/"+file,import.meta.url),"utf8");assert.ok(content.includes("async function "+fn+"("));assert.ok(content.includes("await PasteLintUtils.copyToClipboard("));assert.ok(!content.includes('document.execCommand("copy")'));}});
