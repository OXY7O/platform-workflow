import assert from "node:assert/strict"; import fs from "node:fs"; import test from "node:test";
import {generateCompatibilityMatrix} from "../lib/generate-compatibility-matrix.js";
const fixture=()=>JSON.parse(fs.readFileSync("tests/fixtures/compatibility/php-laravel.json","utf8"));
test("generates required lanes deterministically without canonical artifact",()=>{
 const ids=generateCompatibilityMatrix(fixture(),{includePreview:false}).include.map(x=>x.laneId);
 assert.deepEqual(ids,["laravel-12-php-8.2","laravel-12-php-8.3","laravel-12-php-8.4","laravel-12-php-8.5","laravel-13-php-8.4","laravel-13-php-8.5"]);
});
test("preview is opt-in and non-blocking",()=>{const lane=generateCompatibilityMatrix(fixture(),{includePreview:true}).include.find(x=>x.phpVersion==="8.6");assert.equal(lane?.blocking,false);});
test("rejects duplicate lane identifiers",()=>{const value=fixture();value.lanes.push({...value.lanes[1]});assert.throws(()=>generateCompatibilityMatrix(value,{includePreview:false}),/duplicate/i);});
test("rejects a missing or nonblocking required lane",()=>{const value=fixture();value.lanes=value.lanes.filter(x=>x.laneId!=="laravel-12-php-8.2");assert.throws(()=>generateCompatibilityMatrix(value,{includePreview:false}),/required lane/i);const other=fixture();other.lanes.find(x=>x.laneId==="laravel-12-php-8.2").blocking=false;assert.throws(()=>generateCompatibilityMatrix(other,{includePreview:false}),/must be blocking/i);});
test("rejects a blocking preview lane",()=>{const value=fixture();value.lanes.find(x=>x.lifecycle==="preview").blocking=true;assert.throws(()=>generateCompatibilityMatrix(value,{includePreview:true}),/preview.*non-blocking/i);});
