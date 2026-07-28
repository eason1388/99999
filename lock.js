/* 抱朴隨緣堂 授權鎖 v1  ——  離線可驗證,永久有效
   用法:
     <script src="lock.js"></script>
     h += BPSY.gate(深解HTML, '抱朴心法・醫命合參');   // 回傳字串
     ...塞進 DOM 後...
     BPSY.bind();                                     // 綁定解鎖鈕
   查詢:BPSY.ok()  → true/false
*/
(function(g){
'use strict';
var KEY='bpsy_lic_v1', LINE_ID='fengshui1388', PRICE='NT$699 永久解碼';
var ABC='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';           // 去掉 0O1I,避免抄錯

function h32(s){var x=2166136261>>>0;for(var i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619)>>>0}return x>>>0}
function chk(serial){
  var v=h32('BPSY|'+serial+'|BAOPU|699');
  var w=h32(serial+'|'+v);
  return ABC[v%32]+ABC[(v>>>7)%32]+ABC[w%32]+ABC[(w>>>11)%32];
}
// 抄錯容錯:0/O→D、1/I→L(ABC 不含 0O1I)
function norm(c){return String(c||'').toUpperCase().replace(/[^0-9A-Z]/g,'').replace(/[0O]/g,'D').replace(/[1I]/g,'L')}
function valid(code){
  var c=norm(code);
  if(c.indexOf('BPSY')!==0) return false;
  c=c.slice(4);
  if(c.length!==10) return false;
  var s=c.slice(0,6), k=c.slice(6);
  for(var i=0;i<c.length;i++) if(ABC.indexOf(c[i])<0) return false;
  return chk(s)===k;
}
function gen(serial){                                  // 產生器用
  var raw=norm(serial), s='';
  for(var i=0;i<raw.length&&s.length<6;i++){           // 只保留可用字元,0O1I 自動轉換
    var c=raw[i];
    if(c==='0')c='D'; else if(c==='O')c='D';
    else if(c==='1')c='L'; else if(c==='I')c='L';
    if(ABC.indexOf(c)>=0)s+=c;
  }
  while(s.length<6) s+=ABC[Math.floor(Math.random()*32)];
  return 'BPSY-'+s+'-'+chk(s);
}
function ok(){ try{ return valid(localStorage.getItem(KEY)); }catch(e){ return false } }
function save(code){
  if(!valid(code)) return false;
  try{ localStorage.setItem(KEY,'BPSY-'+norm(code).slice(4,10)+'-'+norm(code).slice(10)); }catch(e){}
  return true;
}
function clear(){ try{ localStorage.removeItem(KEY) }catch(e){} }

/* ── 樣式(只注入一次)── */
function css(){
  if(document.getElementById('bpsy-css')) return;
  var st=document.createElement('style'); st.id='bpsy-css';
  st.textContent=
  '.bpsy-wrap{position:relative;border:1px solid rgba(201,169,106,.35);border-radius:12px;overflow:hidden;margin:10px 0;background:rgba(0,0,0,.15)}'+
  '.bpsy-blur{filter:blur(5px);opacity:.45;pointer-events:none;user-select:none;padding:14px;font-size:13.5px;line-height:1.9;max-height:190px;overflow:hidden}'+
  '.bpsy-mask{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:16px;background:linear-gradient(180deg,rgba(20,16,12,.25),rgba(20,16,12,.88))}'+
  '.bpsy-mask .bi{font-size:26px}'+
  '.bpsy-mask .bt{font-family:"Noto Serif TC",serif;color:#c9a96a;font-size:15px;letter-spacing:.08em}'+
  '.bpsy-mask .bs{font-size:12px;opacity:.75;line-height:1.7}'+
  '.bpsy-btn{margin-top:4px;background:linear-gradient(135deg,#c9a96a,#a8853f);color:#1a1410;border:0;border-radius:999px;padding:9px 22px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}'+
  '.bpsy-btn:active{transform:scale(.97)}'+
  '#bpsy-modal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:18px;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}'+
  '#bpsy-modal.on{display:flex}'+
  '#bpsy-card{width:100%;max-width:360px;max-height:88vh;overflow:auto;background:#1c1712;border:1px solid rgba(201,169,106,.45);border-radius:16px;padding:20px;color:#e8dcc8;font-family:inherit;text-align:center}'+
  '#bpsy-card h3{font-family:"Noto Serif TC",serif;color:#c9a96a;margin:0 0 4px;font-size:18px;letter-spacing:.1em}'+
  '#bpsy-card .p{font-size:22px;color:#f0d9a0;font-weight:700;margin:6px 0 2px}'+
  '#bpsy-card .d{font-size:12.5px;opacity:.8;line-height:1.85;text-align:left;margin:10px 0;padding:10px 12px;background:rgba(255,255,255,.04);border-radius:10px}'+
  '#bpsy-card .lid{font-size:19px;letter-spacing:.14em;color:#7fd18a;font-weight:700;margin:8px 0;user-select:all}'+
  '#bpsy-in{width:100%;box-sizing:border-box;margin-top:10px;padding:11px;border-radius:10px;border:1px solid rgba(201,169,106,.4);background:rgba(0,0,0,.35);color:#e8dcc8;font-size:16px;text-align:center;letter-spacing:.1em;font-family:inherit}'+
  '#bpsy-msg{font-size:13px;min-height:18px;margin-top:8px}'+
  '#bpsy-card .row{display:flex;gap:8px;margin-top:10px}'+
  '#bpsy-card .row button{flex:1;padding:11px;border-radius:10px;border:1px solid rgba(201,169,106,.35);background:transparent;color:#e8dcc8;font-size:14px;cursor:pointer;font-family:inherit}'+
  '#bpsy-card .row button.pri{background:linear-gradient(135deg,#c9a96a,#a8853f);color:#1a1410;border:0;font-weight:700}';
  (document.head||document.documentElement).appendChild(st);
}

/* ── 解鎖視窗 ── */
function modal(){
  css();
  var m=document.getElementById('bpsy-modal');
  if(m) return m;
  m=document.createElement('div'); m.id='bpsy-modal';
  m.innerHTML=
   '<div id="bpsy-card">'+
   '<h3>抱朴隨緣堂・深解解碼</h3>'+
   '<div class="p">'+PRICE+'</div>'+
   '<div style="font-size:12px;opacity:.7">一次付清・不限次數・不需連網・換手機可重輸</div>'+
   '<div class="d">解碼後可永久開啟:<br>'+
     '・紫微斗數〈抱朴心法・醫命合參〉全章<br>'+
     '・陰宅水法〈八路黃泉〉與〈房分斷〉<br>'+
     '・羅盤〈家人配位・易理深解〉六十四卦<br>'+
     '・易經推命(四柱命卦)全頁<br>'+
     '・金錢卦深層卦解</div>'+
   '<div style="font-size:13px;opacity:.85">加 LINE 取得授權碼</div>'+
   '<div class="lid">'+LINE_ID+'</div>'+
   '<button class="bpsy-btn" id="bpsy-line">開啟 LINE 加好友</button>'+
   '<div style="margin-top:16px;font-size:13px;opacity:.85">已有授權碼?</div>'+
   '<input id="bpsy-in" placeholder="BPSY-XXXXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false">'+
   '<div id="bpsy-msg"></div>'+
   '<div class="row"><button id="bpsy-x">關閉</button><button class="pri" id="bpsy-go">解碼</button></div>'+
   '</div>';
  document.body.appendChild(m);
  m.addEventListener('click',function(e){ if(e.target===m) close(); });
  m.querySelector('#bpsy-x').onclick=close;
  m.querySelector('#bpsy-line').onclick=function(){
    try{ window.open('https://line.me/R/ti/p/~'+LINE_ID,'_blank'); }catch(e){}
  };
  m.querySelector('#bpsy-go').onclick=function(){
    var v=m.querySelector('#bpsy-in').value, msg=m.querySelector('#bpsy-msg');
    if(save(v)){
      msg.style.color='#7fd18a'; msg.textContent='✔ 解碼成功,正在開啟…';
      setTimeout(function(){ location.reload(); },700);
    }else{
      msg.style.color='#e88'; msg.textContent='✘ 授權碼不正確,請確認大小寫與連字號';
    }
  };
  m.querySelector('#bpsy-in').addEventListener('keydown',function(e){ if(e.key==='Enter') m.querySelector('#bpsy-go').click(); });
  return m;
}
function open_(){ modal().classList.add('on'); setTimeout(function(){var i=document.getElementById('bpsy-in'); i&&i.focus();},50); }
function close(){ var m=document.getElementById('bpsy-modal'); m&&m.classList.remove('on'); }

/* ── 產生鎖住區塊的 HTML ──
   已解碼 → 原樣回傳;未解碼 → 模糊預覽 + 遮罩 */
function gate(html, title){
  if(ok()) return html;
  css();
  // 不放真實內文,只放假文字底,避免未付費者由原始碼取得內容
  var plain='本段依抱朴隨緣堂心法逐項推演,含吉凶所主、應期年份、六親所應、'+
            '致命要害與化解次第,並附臨案驗證與實作步驟。此為本堂多年臨場心得之整理,'+
            '非坊間泛論可比,解碼後可永久查閱、離線使用。';
  return '<div class="bpsy-wrap"><div class="bpsy-blur">'+plain+'</div>'+
    '<div class="bpsy-mask"><div class="bi">🔒</div>'+
    '<div class="bt">'+(title||'深解內容')+'</div>'+
    '<div class="bs">此段為抱朴隨緣堂心法深解<br>解碼後永久開啟</div>'+
    '<button class="bpsy-btn" data-bpsy-open>🔑 解碼 '+PRICE+'</button></div></div>';
}

/* ── 整頁鎖(易經推命這類整頁付費用)── */
function gatePage(title, desc){
  if(ok()) return false;
  css();
  var d=document.createElement('div');
  d.style.cssText='padding:40px 20px;text-align:center';
  d.innerHTML='<div style="font-size:40px">🔒</div>'+
    '<div style="font-family:\'Noto Serif TC\',serif;color:#c9a96a;font-size:19px;letter-spacing:.1em;margin:10px 0">'+(title||'本頁為深解內容')+'</div>'+
    '<div style="font-size:13px;opacity:.8;line-height:1.9;max-width:420px;margin:0 auto 16px">'+(desc||'解碼後永久開啟,不需連網、不限次數。')+'</div>'+
    '<button class="bpsy-btn" data-bpsy-open>🔑 解碼 '+PRICE+'</button>';
  var b=document.body;
  b.innerHTML=''; b.appendChild(d); bind();
  return true;
}

function bind(root){
  (root||document).querySelectorAll('[data-bpsy-open]').forEach(function(b){
    if(b._bpsy) return; b._bpsy=1;
    b.addEventListener('click',function(e){ e.preventDefault(); e.stopPropagation(); open_(); });
  });
}

g.BPSY={ok:ok,gate:gate,gatePage:gatePage,bind:bind,open:open_,close:close,
         valid:valid,gen:gen,save:save,clear:clear,LINE:LINE_ID,PRICE:PRICE,KEY:KEY};

document.addEventListener('DOMContentLoaded',function(){ bind(); });
})(window);
