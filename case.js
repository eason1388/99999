/*═══════════════════════════════════════════════════════════
  抱朴隨緣堂・案件狀態層(一案到底)

  目的:輸入一次坐向與屋主資料,全部模組共用。
  資料沿用客戶案件簿的 localStorage(fsc_cases),
  另存一個「目前案件」的 id(fsc_active)。

  模組用法:
    <script src="case.js"></script>
    BPCASE.apply(function(c){        // 有指定案件時才會被呼叫
      sitSel.value = c.sit;
      perSel.value = c.per;
      render();
    });

  欄位:
    name 姓名   phone 電話   addr 地址   type 類別
    sit  坐山(24山)   per 元運 1-9
    by   屋主出生年(西元)   bm bd bh 月/日/時(選填)   sex 1男 0女
    sp   配偶出生年(選填)
    date 勘察日   note 備註
═══════════════════════════════════════════════════════════*/
(function(g){
'use strict';
var KEY='fsc_cases', ACT='fsc_active';

function list(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
function saveAll(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){return false}}
function activeId(){try{return localStorage.getItem(ACT)||''}catch(e){return''}}
function get(){
  var id=activeId(); if(!id)return null;
  return list().find(function(c){return String(c.id)===String(id)})||null;
}
function setActive(id){
  try{ id?localStorage.setItem(ACT,String(id)):localStorage.removeItem(ACT); }catch(e){}
  fire();
}
function clear(){ setActive(''); }
function update(patch){
  var c=get(); if(!c)return false;
  var a=list().map(function(x){return String(x.id)===String(c.id)?Object.assign({},x,patch):x});
  saveAll(a); fire(); return true;
}

var subs=[];
function on(fn){subs.push(fn)}
function fire(){
  var c=get();
  subs.forEach(function(f){try{f(c)}catch(e){}});
  paint();
}
/** 有案件才執行;並在切換案件時重跑 */
function apply(fn){
  function run(){var c=get(); if(c){try{fn(c)}catch(e){}}}
  on(run);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);
  else run();
}

/*── 自動帶入:各模組的輸入元件命名一致,故可通用處理 ──
  #sit 坐山 / #per #period 元運 / #by 屋主生年 / #sex 性別
  #bd 出生日 / #bt 出生時 / #y1 #y2 擇日雙方生年
  只填「使用者尚未自己改過」的欄位,改過就不覆蓋。 */
var TOUCH='data-bp-touched';
function markTouched(el){
  if(el.__bpw)return; el.__bpw=1;
  el.addEventListener('input',function(){if(!el.__bpFilling)el.setAttribute(TOUCH,'1')});
  el.addEventListener('change',function(){if(!el.__bpFilling)el.setAttribute(TOUCH,'1')});
}
function put(id,val,force){
  if(val===''||val==null)return false;
  var el=document.getElementById(id); if(!el)return false;
  markTouched(el);
  if(!force&&el.getAttribute(TOUCH))return false;
  if(String(el.value)===String(val))return false;
  el.__bpFilling=1; el.value=val; el.__bpFilling=0;
  el.dispatchEvent(new Event('change',{bubbles:true}));
  el.dispatchEvent(new Event('input',{bubbles:true}));
  return true;
}
/* 有些模組(飛星)用一排籤按鈕而非下拉,需改用點選 */
function clickChip(boxId,text,force){
  var box=document.getElementById(boxId); if(!box||text==null||text==='')return false;
  if(!box.__bpw){ box.__bpw=1;
    box.addEventListener('click',function(){if(!box.__bpFilling)box.__bpTouched=1},true); }
  if(!force&&box.__bpTouched)return false;
  var t=String(text).trim();
  var b=Array.prototype.slice.call(box.querySelectorAll('button'))
        .filter(function(x){return x.textContent.trim()===t})[0];
  if(!b||b.classList.contains('on'))return false;
  box.__bpFilling=1; b.click(); box.__bpFilling=0;
  return true;
}
function autofill(c,force){
  if(!c)return 0;
  var n=0;
  // 飛星八宅:#periods 是 1運…9運、#mts 是二十四山
  n+=clickChip('periods',(c.per||'')+'運',force)?1:0;
  n+=clickChip('mts',c.sit,force)?1:0;
  n+=put('sit',c.sit,force)?1:0;
  n+=put('per',c.per,force)?1:0;
  n+=put('period',c.per,force)?1:0;
  if(c.by){ n+=put('by',c.by,force)?1:0; n+=put('y1',c.by,force)?1:0; }
  if(c.sp) n+=put('y2',c.sp,force)?1:0;
  if(c.sex===0||c.sex===1) n+=put('sex',c.sex,force)?1:0;
  if(c.birth) n+=put('bd',c.birth,force)?1:0;
  if(c.btime) n+=put('bt',c.btime,force)?1:0;
  return n;
}

/* 診斷:把帶入結果留在本機,供另一頁讀取
   (有些頁面不會回報「載入完成」,無法直接在該頁檢查)*/
function diag(){
  try{
    var o={page:decodeURIComponent(location.pathname.split('/').pop()),t:new Date().toISOString().slice(11,19),
           bar:!!document.getElementById('bpcase'),v:{}};
    ['sit','per','period','by','sex','bd','bt','y1','y2'].forEach(function(id){
      var e=document.getElementById(id); if(e)o.v[id]=e.value;});
    ['periods','mts'].forEach(function(id){
      var b=document.getElementById(id); if(b){var on=b.querySelector('.on');o.v[id]=on?on.textContent:'(未選)';}});
    var a=[];try{a=JSON.parse(localStorage.getItem('bpcase_diag')||'[]')}catch(e){}
    a=a.filter(function(x){return x.page!==o.page}); a.push(o);
    localStorage.setItem('bpcase_diag',JSON.stringify(a.slice(-20)));
  }catch(e){}
}

/* ── 樣式 ── */
function css(){
  if(document.getElementById('bpcase-css'))return;
  var s=document.createElement('style'); s.id='bpcase-css';
  s.textContent=
  /* 注意:不可用負邊界。部分模組的 body 是 flex 置中容器,
     負邊界會把內容寬度撐歪,導致畫布算出負半徑而在動畫迴圈裡持續拋錯。*/
  '#bpcase{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:8px;'+
    'width:100%;max-width:100%;box-sizing:border-box;flex:none;align-self:stretch;'+
    'padding:7px 12px;margin:0 0 10px;font-size:13px;'+
    'background:linear-gradient(90deg,rgba(201,169,106,.22),rgba(201,169,106,.10));'+
    'border-bottom:1px solid rgba(201,169,106,.4);backdrop-filter:blur(6px);'+
    '-webkit-backdrop-filter:blur(6px);color:#E8DCC8}'+
  '#bpcase .ic{color:#E0C285;font-family:"Noto Serif TC",serif;font-weight:900;flex:none}'+
  '#bpcase .nm{font-weight:700;color:#F0D9A0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '#bpcase .dt{opacity:.78;white-space:nowrap;font-size:12px}'+
  '#bpcase .sp{flex:1;min-width:4px}'+
  '#bpcase button{border:1px solid rgba(201,169,106,.5);background:rgba(0,0,0,.2);color:#E8DCC8;'+
    'border-radius:99px;padding:3px 11px;font-size:12px;cursor:pointer;font-family:inherit;flex:none}'+
  '#bpcase button.on{background:linear-gradient(135deg,#E0BD78,#B8923F);color:#1A1410;border-color:transparent;font-weight:700}'+
  '#bpcase-pick{position:fixed;inset:0;z-index:99998;display:none;align-items:flex-end;justify-content:center;'+
    'background:rgba(0,0,0,.6);padding:0}'+
  '#bpcase-pick.on{display:flex}'+
  '#bpcase-card{width:100%;max-width:520px;max-height:78vh;overflow:auto;background:#1B1712;'+
    'border-top:1px solid rgba(201,169,106,.4);border-radius:18px 18px 0 0;padding:16px 16px calc(20px + env(safe-area-inset-bottom))}'+
  '#bpcase-card h4{font-family:"Noto Serif TC",serif;color:#E0C285;font-size:15px;letter-spacing:.1em;margin:0 0 10px}'+
  '#bpcase-card .it{display:block;width:100%;text-align:left;background:#221C16;border:1px solid rgba(201,169,106,.22);'+
    'border-radius:12px;padding:10px 13px;margin-bottom:7px;cursor:pointer;color:#EDE7DA;font-family:inherit}'+
  '#bpcase-card .it b{color:#E0C285;font-size:14.5px}'+
  '#bpcase-card .it small{display:block;opacity:.65;font-size:12px;margin-top:2px}'+
  '#bpcase-card .it.cur{border-color:rgba(201,169,106,.75);background:rgba(201,169,106,.14)}'+
  '#bpcase-card .cls{width:100%;margin-top:6px;border:1px solid rgba(201,169,106,.35);background:transparent;'+
    'color:#E8DCC8;border-radius:99px;padding:10px;cursor:pointer;font-family:inherit;font-size:14px}'+
  '@media print{#bpcase,#bpcase-pick{display:none!important}}';
  (document.head||document.documentElement).appendChild(s);
}

/* ── 頂部案件列 ── */
function paint(){
  if(!document.body)return;
  css();
  var bar=document.getElementById('bpcase');
  if(!bar){
    bar=document.createElement('div'); bar.id='bpcase';
    document.body.insertBefore(bar,document.body.firstChild);
  }
  var c=get(), n=list().length;
  if(c){
    bar.innerHTML='<span class="ic">案</span>'+
      '<span class="nm">'+esc(c.name)+'</span>'+
      '<span class="dt">'+esc(c.sit||'')+'山・'+(c.per||'')+'運'+(c.by?'・屋主'+c.by:'')+'</span>'+
      '<span class="sp"></span>'+
      '<button id="bpcase-sw">切換</button><button id="bpcase-x">取消</button>';
    bar.querySelector('#bpcase-x').onclick=function(){clear()};
  }else{
    bar.innerHTML='<span class="ic">案</span>'+
      '<span class="dt">未指定案件——指定後各頁自動帶入坐向與屋主資料</span>'+
      '<span class="sp"></span>'+
      '<button class="on" id="bpcase-sw">'+(n?'選擇案件':'尚無案件')+'</button>';
  }
  var sw=bar.querySelector('#bpcase-sw');
  if(sw)sw.onclick=pick;
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){
  return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]})}

function pick(){
  css();
  var w=document.getElementById('bpcase-pick');
  if(!w){
    w=document.createElement('div'); w.id='bpcase-pick';
    w.innerHTML='<div id="bpcase-card"></div>';
    document.body.appendChild(w);
    w.addEventListener('click',function(e){if(e.target===w)w.classList.remove('on')});
  }
  var a=list(), cur=activeId(), card=w.querySelector('#bpcase-card');
  card.innerHTML='<h4>選擇目前案件</h4>'+
    (a.length?a.slice().reverse().map(function(c){
      return '<button class="it'+(String(c.id)===String(cur)?' cur':'')+'" data-id="'+c.id+'">'+
        '<b>'+esc(c.name)+'</b>'+
        '<small>'+esc(c.type||'')+'　'+esc(c.sit||'')+'山・'+(c.per||'')+'運'+
        (c.by?'　屋主 '+c.by+' 年生':'')+(c.addr?'<br>'+esc(c.addr):'')+'</small></button>';
    }).join('')
    :'<div style="opacity:.7;font-size:13px;line-height:1.9;padding:6px 2px">'+
     '目前還沒有案件。<br>請先到「客戶案件簿」建立一筆,之後各頁就會自動帶入。</div>')+
    '<button class="cls" id="bpcase-close">關閉</button>';
  card.querySelectorAll('.it').forEach(function(b){
    b.onclick=function(){setActive(b.dataset.id);w.classList.remove('on')};
  });
  card.querySelector('#bpcase-close').onclick=function(){w.classList.remove('on')};
  w.classList.add('on');
}

g.BPCASE={list:list,get:get,setActive:setActive,clear:clear,update:update,
          on:on,apply:apply,pick:pick,refresh:fire,autofill:autofill,KEY:KEY};

/* 模組頁自動帶入(案件簿本身不帶,免得蓋掉編輯中的表單)
   等 load 之後才插入案件列,讓各模組先把畫布尺寸算完,避免插入時的版面位移。*/
function boot(){
  var go=function(){
    paint();
    // 插入後通知需要重新量尺寸的模組(羅盤畫布等)
    try{window.dispatchEvent(new Event('resize'))}catch(e){}
    if(document.getElementById('cName'))return;   // 客戶案件簿
    var c=get(); if(!c)return;
    setTimeout(function(){autofill(c)},80);       // 等 select 的 option 建好
    setTimeout(function(){autofill(c);diag()},500);
  };
  if(document.readyState==='complete')setTimeout(go,120);
  else window.addEventListener('load',function(){setTimeout(go,120)});
}
on(function(c){ if(c&&!document.getElementById('cName'))setTimeout(function(){autofill(c,true)},30); });

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
// 其他分頁改了案件也同步
window.addEventListener('storage',function(e){if(e.key===KEY||e.key===ACT)fire()});
})(window);
