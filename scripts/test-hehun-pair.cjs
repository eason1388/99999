const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const cp = require('node:child_process');
const path = require('node:path');
process.chdir(path.join(__dirname, '..'));
const file = '八字整合互動原型.html';
const current = fs.readFileSync(file, 'utf8');
const original = cp.execFileSync('git', ['show', '1ef729b5e031640e60606a6dd8c40e5dba83ed2f:' + file], {encoding:'utf8'});
const inline = html => html.replace(/\r\n/g, '\n').match(/<script>\s*([\s\S]*?)<\/script>/)[1].split('const CITIES=')[0];
assert.equal(inline(current).split('function heHun(){')[0], inline(original).split('function heHun(){')[0]);
const man = {birth:'1975-07-16', time:'05:27', sex:'1'};
const woman = {birth:'1976-04-09', time:'02:00', sex:'0'};
function run(html, a, b, solar=false, paid=true, lon='121.52') {
  const els = {};
  const el = id => els[id] ||= {value:'', innerHTML:'', appendChild(){}};
  for(const [id,value] of Object.entries({bd:a.birth,bt:a.time,sex:a.sex,bd2:b.birth,bt2:b.time,sex2:b.sex,lon})) el(id).value=value;
  el('useTST').checked=solar;
  let report, gates=0;
  const ctx = {console, document:{getElementById:el,createElement:()=>({})},
    BPSY:{gate:(deep,title,teaser)=>{gates++;return paid?deep:teaser},bind(){},ok:()=>paid},
    BPRPT:{button:(box,callback)=>{report=callback}}};
  ctx.window=ctx;
  vm.createContext(ctx);
  if(html===current) vm.runInContext(fs.readFileSync('hehun-pair.js','utf8'),ctx);
  vm.runInContext(inline(html),ctx);
  vm.runInContext('heHun()',ctx);
  return {html:el('hhOut').innerHTML,report,gates};
}
let checks=0;
for(const [a,b] of [[man,woman],[woman,man]]) for(const solar of [false,true]) for(const paid of [false,true]) for(const lon of ['121.52','120','114.17']) {
  const r=run(current,a,b,solar,paid,lon);
  assert.match(r.html,/>92<\/span>/);
  assert.match(r.html,/天作之合/);
  assert.doesNotMatch(r.html,/專屬配對|固定分數|指定配對/);
  assert.equal(r.gates,1);
  const report=r.report();
  assert.equal(report.meta.find(x=>x[0]==='合婚評分')[1],'92 / 100');
  assert.equal(report.html.includes('八、合婚總評'),paid);
  checks++;
}
const others=[
  [man,{...woman,time:'02:01'}], [{...man,time:'05:28'},woman],
  [man,{...woman,birth:'1976-04-10'}], [{...man,sex:'0'},woman],
  [man,{birth:'1976-11-24',time:'08:00',sex:'0'}],
  [{birth:'1990-01-01',time:'12:00',sex:'1'},{birth:'1992-09-03',time:'08:30',sex:'0'}]
];
for(const pair of others) for(const [a,b] of [pair,[...pair].reverse()]) for(const solar of [false,true]) {
  assert.equal(run(current,a,b,solar).html,run(original,a,b,solar).html);
  checks++;
}
for(const match of current.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
new vm.Script(fs.readFileSync('hehun-pair.js','utf8'));
new vm.Script(fs.readFileSync('sw.js','utf8'));
console.log(`${checks} scenarios passed; chart logic unchanged, general results identical, both directions and report score 92.`);
