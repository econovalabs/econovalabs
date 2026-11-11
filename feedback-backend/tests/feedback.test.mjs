import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import worker from '../dist/server/index.js';
const origin='https://econovalabs.github.io';
const backend='https://feedback.example';
const adminHeaders={'oai-authenticated-user-id':'verified-user-1','oai-authenticated-user-email':'sherin122491@gmail.com'};
function database(){
  const sqlite=new DatabaseSync(':memory:');
  for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(file=>file.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
  return {sqlite,prepare(sql){let args=[];return {bind(...values){args=values;return this;},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};},async run(){return sqlite.prepare(sql).run(...args);}};}};
}
const valid={name:'Visitor Example',email:'visitor@example.com',rating:4,comments:'A removable water tank would be useful.',consent:true,website:''};
function submit(env,data=valid,headers={}){return worker.fetch(new Request(backend+'/api/feedback',{method:'POST',headers:{'Content-Type':'application/json',origin,...headers},body:JSON.stringify(data)}),env);}
function admin(env,path='/api/admin/feedback',headers=adminHeaders){return worker.fetch(new Request(backend+path,{headers}),env);}
test('accepts feedback, persists required details, and returns only a receipt',async()=>{
  const DB=database();const env={DB};const result=await submit(env);assert.equal(result.status,201);const receipt=await result.json();assert.ok(receipt.id);assert.equal(receipt.email,undefined);
  const list=await (await admin(env)).json();assert.equal(list.total,1);assert.equal(list.average,4);assert.equal(list.items[0].email,valid.email);assert.equal(list.items[0].comments,valid.comments);assert.equal(list.breakdown[0].count,1);
  assert.equal((await admin(env)).headers.get('cache-control'),'no-store');DB.sqlite.close();
});
test('dashboard and export reject anonymous and other signed-in accounts',async()=>{
  const DB=database();const env={DB};await submit(env);
  for(const path of ['/api/admin/feedback','/api/admin/export']){assert.equal((await admin(env,path,{})).status,401);assert.equal((await admin(env,path,{'oai-authenticated-user-id':'other','oai-authenticated-user-email':'other@example.com'})).status,403);}
  const signIn=await worker.fetch(new Request(backend+'/admin'),env);assert.ok((await signIn.text()).includes('/signin-with-chatgpt?return_to=%2Fadmin'));
  const wrong=await worker.fetch(new Request(backend+'/admin',{headers:{'oai-authenticated-user-id':'other','oai-authenticated-user-email':'other@example.com'}}),env);assert.equal(wrong.status,403);DB.sqlite.close();
});
test('rejects missing details, invalid ratings, oversized inputs and missing consent',async()=>{
  const DB=database();const env={DB};
  for(const value of [{...valid,name:''},{...valid,email:'invalid'},{...valid,rating:0},{...valid,rating:6},{...valid,rating:1.5},{...valid,comments:'hi'},{...valid,comments:'x'.repeat(2001)},{...valid,consent:false},{...valid,website:'bot'}])assert.equal((await submit(env,value)).status,400);
  assert.equal((await submit(env,{...valid,comments:'x'.repeat(9000)})).status,413);assert.equal((await (await admin(env)).json()).total,0);DB.sqlite.close();
});
test('only permits approved website origins and required request format',async()=>{
  const DB=database();const env={DB};assert.equal((await submit(env,valid,{origin:'https://unrelated.example'})).status,403);
  const preflight=await worker.fetch(new Request(backend+'/api/feedback',{method:'OPTIONS',headers:{origin}}),env);assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
  const denied=await worker.fetch(new Request(backend+'/api/feedback',{method:'OPTIONS',headers:{origin:'https://unrelated.example'}}),env);assert.equal(denied.status,403);
  assert.equal((await submit(env,valid,{'Content-Type':'text/plain'})).status,415);assert.equal((await admin(env,'/api/feedback',{})).status,405);DB.sqlite.close();
});
test('limits repeated submissions without storing raw IP or email in limit keys',async()=>{
  const DB=database();const env={DB};for(let n=0;n<3;n++)assert.equal((await submit(env)).status,201);assert.equal((await submit(env)).status,429);
  const keys=DB.sqlite.prepare('SELECT key FROM submission_limits').all();assert.ok(keys.every(item=>!item.key.includes(valid.email)));DB.sqlite.close();
});
test('search, rating filters, pagination, and CSV export keep records accurate',async()=>{
  const DB=database();const env={DB};
  for(let i=0;i<27;i++)assert.equal((await submit(env,{...valid,name:i===0?'=SUM(1+1)':'Visitor '+i,email:'visitor'+i+'@example.com',rating:i===0?1:5,comments:i===0?'@dangerous formula':'Suggestion number '+i})).status,201);
  const first=await (await admin(env)).json();assert.equal(first.total,27);assert.equal(first.items.length,25);
  const second=await (await admin(env,'/api/admin/feedback?page=2')).json();assert.equal(second.items.length,2);assert.ok(second.items.every(item=>!first.items.some(other=>item.id===other.id)));
  const filtered=await (await admin(env,'/api/admin/feedback?rating=1')).json();assert.equal(filtered.total,1);assert.equal(filtered.average,1);
  const search=await (await admin(env,'/api/admin/feedback?search=visitor26%40example.com')).json();assert.equal(search.total,1);
  const injection=await (await admin(env,'/api/admin/feedback?search='+encodeURIComponent("' OR 1=1 --"))).json();assert.equal(injection.total,0);
  const csv=await (await admin(env,'/api/admin/export?rating=1')).text();assert.ok(csv.includes("'=SUM(1+1)"));assert.ok(csv.includes("'@dangerous formula"));DB.sqlite.close();
});
test('fails safely without a database and does not show private records in errors',async()=>{
  const result=await submit({});assert.equal(result.status,503);assert.ok(!(await result.text()).includes(valid.email));
});
