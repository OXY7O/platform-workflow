import fs from "node:fs"; import AjvModule from "ajv/dist/2020.js";
import type {CompatibilityInput} from "./contracts/types.js"; import {validateCompatibilityContract} from "./validate-compatibility-contract.js";
const schema=JSON.parse(fs.readFileSync(new URL("../contracts/compatibility-catalogue.schema.json",import.meta.url),"utf8"));
const validate=new AjvModule.default({allErrors:true,strict:true}).compile(schema);
export interface MatrixOptions {includePreview:boolean} export interface CompatibilityMatrix {include:CompatibilityInput[]}
const required=new Set(["laravel-12-php-8.2","laravel-12-php-8.3","laravel-12-php-8.4","laravel-12-php-8.5","laravel-13-php-8.4","laravel-13-php-8.5"]);
const versionParts=(version:string)=>version.split(".").map(Number);
export function generateCompatibilityMatrix(catalogue:unknown,options:MatrixOptions):CompatibilityMatrix{
 if(!validate(catalogue)) throw new Error(`Compatibility catalogue invalid: ${JSON.stringify(validate.errors)}`);
 const lanes=(catalogue as {lanes:Array<Record<string,unknown>>}).lanes; const ids=new Set<string>();
 for(const lane of lanes){const id=String(lane.laneId);if(ids.has(id))throw new Error(`Duplicate laneId: ${id}`);ids.add(id);}
 for(const id of required){const lane=lanes.find(x=>x.laneId===id);if(!lane)throw new Error(`Required lane missing: ${id}`);if(!lane.blocking)throw new Error(`Required lane must be blocking: ${id}`);}
 for(const lane of lanes){if(lane.lifecycle==="preview"&&lane.blocking)throw new Error(`Preview lane must be non-blocking: ${lane.laneId}`);}
 const include=lanes.filter(x=>x.eligible&&x.executionMode==="compatibility-only"&&x.lifecycle!=="legacy-eol"&&(options.includePreview||x.lifecycle!=="preview"))
  .map((entry)=>{const lane=Object.fromEntries(Object.entries(entry).filter(([key])=>key!=="eligible"));return validateCompatibilityContract({schemaVersion:"1.0",profileKey:"php-laravel",...lane});})
  .sort((a,b)=>{const [am,an]=versionParts(a.phpVersion);const [bm,bn]=versionParts(b.phpVersion);return a.frameworkMajor-b.frameworkMajor||am-bm||an-bn||a.laneId.localeCompare(b.laneId);});
 return {include};
}
