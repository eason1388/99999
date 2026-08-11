function _bpTerms(h){var ov=document.createElement('div');ov.id='bpsy-terms-ov';ov.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#14110F;display:flex;flex-direction:column';var bar=document.createElement('div');bar.style.cssText='flex:0 0 auto;padding:10px 14px;border-bottom:1px solid rgba(201,169,106,.35);background:#1A1512';var bt=document.createElement('button');bt.textContent='\u2039 返回勾選';bt.style.cssText='background:#C9A96A;color:#1A1512;border:0;border-radius:8px;padding:9px 16px;font-size:14px;cursor:pointer;font-weight:600';bt.onclick=function(){ov.parentNode&&ov.parentNode.removeChild(ov);};bar.appendChild(bt);var f=document.createElement('iframe');f.src='terms.html'+(h||'');f.style.cssText='flex:1 1 auto;width:100%;border:0;background:#14110F';ov.appendChild(bar);ov.appendChild(f);document.body.appendChild(ov);}
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
var KEY='bpsy_lic_v1', LINE_ID='fengshui1388', PRICE='NT$1,280 永久解碼';
// 線上刷卡購買頁(Google Apps Script 部署後把網址貼進來,留空則只顯示 LINE)
var BUY_URL='https://script.google.com/macros/s/AKfycbyPQKpwFDieQBgJsS3Y_N7sL4opTW5gfAWNwwfsjK550dLYhf6P5Eyo8ZgisytPr3Q6/exec';
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
  /* 通知伺服器登錄此裝置;失敗不影響解碼(離線也能用)*/
  try{ verifyRemote(code).then(function(j){
    if(j&&j.ok===false){ try{localStorage.removeItem(KEY)}catch(e){}
      alert('此授權碼未通過伺服器驗證,已取消解碼。若確有購買請聯繫 LINE:'+LINE_ID); }
    else if(j&&j.warn){ console.warn(j.warn); }
  }); }catch(e){}
  return true;
}
function clear(){ try{ localStorage.removeItem(KEY) }catch(e){} }

/* ── 共用視覺:外殼自有整套設計,只給模組頁套 ── */
function theme(){
  if(document.getElementById('bpsy-theme'))return;
  if(document.getElementById('stage'))return;          // index.html 外殼不套
  var l=document.createElement('link'); l.id='bpsy-theme';
  l.rel='stylesheet'; l.href='theme.css';
  (document.head||document.documentElement).appendChild(l);
}

/* ── 全站捲動順滑修正(所有載入 lock.js 的模組自動套用)── */
function scrollFix(){
  if(document.getElementById('bpsy-scroll'))return;
  // 外殼(index.html)自己管版面,只有模組頁才需要補底部留白與高度
  var isShell=!!document.getElementById('stage');
  var st=document.createElement('style'); st.id='bpsy-scroll';
  st.textContent=
  'html{-webkit-text-size-adjust:100%}'+
  'body{-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;overflow-x:hidden}'+
  (isShell?'':'body{padding-bottom:calc(40px + env(safe-area-inset-bottom))}')+
  '*{-webkit-tap-highlight-color:transparent}'+
  /* 畫布只吃橫向手勢,縱向一律讓頁面捲 */
  'canvas{touch-action:pan-y!important}'+
  /* 表格與長內容區塊獨立捲動時不要把手勢鎖死 */
  'table,pre,.scrollx{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain}'+
  /* 手機上輸入元件不觸發整頁縮放跳動(縮放後回不去正是「卡住」的主因)*/
  '@media(max-width:719px){input,select,textarea{font-size:16px}}'+
  /* 避免 iOS 動態視窗高度在捲動途中重排造成「卡住」(外殼自有 svh 設定,不動)*/
  (isShell?'':'@supports(height:100svh){html{height:auto;min-height:100svh}}');
  (document.head||document.documentElement).appendChild(st);
}

/* ── 樣式(只注入一次)── */
function css(){
  if(document.getElementById('bpsy-css')) return;
  var st=document.createElement('style'); st.id='bpsy-css';
  st.textContent=
  '.bpsy-wrap{border:1.5px solid rgba(201,169,106,.55);border-radius:16px;overflow:hidden;margin:14px 0;background:#1c1712;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.18);transition:border-color .18s,box-shadow .18s,transform .18s}'+
  '.bpsy-wrap:hover{border-color:rgba(201,169,106,.95);box-shadow:0 10px 32px rgba(201,169,106,.22);transform:translateY(-2px)}'+
  '.bpsy-wrap:active{transform:scale(.995)}'+
  '.bpsy-tag{display:flex;align-items:center;gap:6px;padding:8px 14px;background:linear-gradient(90deg,#c9a96a,#a8853f);color:#1a1410;font-size:12.5px;font-weight:700;letter-spacing:.06em}'+
  '.bpsy-tag .r{margin-left:auto;font-weight:800;letter-spacing:0}'+
  /* 個人化提要:這一段是看得見的,內容由本人命盤實算 */
  '.bpsy-teaser{padding:15px 16px 13px;font-size:13.5px;line-height:2;color:rgba(237,231,218,.92);'+
    'background:linear-gradient(180deg,rgba(201,169,106,.13),rgba(201,169,106,.02))}'+
  '.bpsy-teaser b{color:#f0d9a0;font-size:15px}'+
  '.bpsy-teaser .k{display:inline-block;background:rgba(201,169,106,.2);border:1px solid rgba(201,169,106,.45);'+
    'border-radius:6px;padding:1px 8px;color:#f0d9a0;font-weight:700;margin:0 2px}'+
  '.bpsy-cut{position:relative}'+
  '.bpsy-blur{filter:blur(4.5px);opacity:.3;pointer-events:none;user-select:none;padding:14px 16px;font-size:13.5px;line-height:1.95;height:150px;overflow:hidden;color:#e8dcc8}'+
  '.bpsy-mask{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;text-align:center;padding:14px;background:linear-gradient(180deg,rgba(28,23,18,.5) 0%,rgba(28,23,18,.95) 55%)}'+
  '.bpsy-mask .bi{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(201,169,106,.16);border:1.5px solid rgba(201,169,106,.5)}'+
  '.bpsy-mask .bt{font-family:"Noto Serif TC",serif;color:#e6c886;font-size:16px;letter-spacing:.08em;font-weight:700}'+
  '.bpsy-mask .bs{font-size:12.5px;color:rgba(237,231,218,.72);line-height:1.75}'+
  '#bpsy-modal .chans,.bpsy-chans{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:10px 0 4px}.bpsy-chan{font-size:12px;border:1px solid rgba(201,169,106,.45);border-radius:8px;padding:5px 10px;background:rgba(201,169,106,.10);color:#EDE7DA;white-space:nowrap}.bpsy-safe{font-size:11.5px;opacity:.75;line-height:1.75;margin-top:6px}.bpsy-safe b{color:#E0C285}.bpsy-allin{background:linear-gradient(135deg,rgba(224,189,120,.18),rgba(184,146,63,.12));border:1px solid rgba(201,169,106,.45);border-radius:12px;padding:10px 12px;margin:8px 0 10px;font-size:13px;line-height:1.8;text-align:left}.bpsy-allin b{color:#F0D9A0}.bpsy-btn{margin-top:6px;background:linear-gradient(135deg,#e0bd78,#b8923f);color:#1a1410;border:0;border-radius:999px;padding:12px 30px;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(201,169,106,.42);animation:bpsyPulse 2.6s ease-in-out infinite}'+
  '@keyframes bpsyPulse{0%,100%{box-shadow:0 4px 16px rgba(201,169,106,.42)}50%{box-shadow:0 4px 24px rgba(201,169,106,.72)}}'+
  '.bpsy-btn:active{transform:scale(.96)}'+
  '.bpsy-hint{font-size:11.5px;color:rgba(237,231,218,.5);margin-top:2px}'+
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
   '<div class="p">'+PRICE+'</div>'+'<div class="bpsy-allin"><b>一次付清,全站深解永久開啟</b><br>不是只解開你現在看的這一段。付款後<b>所有module</b>的深解論斷、化解方案、報告輸出全部一起解鎖,永久有效、不限裝置、無月租。</div>'+
   '<div style="font-size:12px;opacity:.7">一次付清・不限次數・不需連網・換手機可重輸</div>'+
   '<div class="d">解碼後可永久開啟:<br>'+
     '・紫微斗數〈抱朴心法・醫命合參〉全章<br>'+
     '・陰宅水法〈八路黃泉〉與〈房分斷〉<br>'+
     '・羅盤〈家人配位・易理深解〉六十四卦<br>'+
     '・易經推命(四柱命卦)全頁<br>'+
     '・金錢卦深層卦解</div>'+
   (BUY_URL
     ? '<div id="bpsy-agree" style="text-align:left;font-size:12.5px;line-height:1.7;margin:12px 0;padding:10px 12px;border:1px solid rgba(201,169,106,.35);border-radius:10px;background:rgba(255,255,255,.03)"><label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;margin-bottom:6px"><input type="checkbox" class="bpsy-ck" style="margin-top:3px;flex:0 0 auto"><span>我已閱讀並同意 <a href="terms.html" data-terms="" style="color:#E8C77A;text-decoration:underline">使用條款</a></span></label><label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;margin-bottom:6px"><input type="checkbox" class="bpsy-ck" style="margin-top:3px;flex:0 0 auto"><span>我已閱讀並同意 <a href="terms.html#disclaimer" data-terms="#disclaimer" style="color:#E8C77A;text-decoration:underline">免責聲明</a></span></label><label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input type="checkbox" class="bpsy-ck" style="margin-top:3px;flex:0 0 auto"><span>我同意於付款完成後立即取得數位內容／使用權限，並知悉依相關規定，數位內容開始提供後，7日解除權可能不適用。</span></label><div id="bpsy-agmsg" style="display:none;color:#E8A08A;margin-top:8px">請先勾選上列三項，再進行付款。</div></div><button class="bpsy-btn" id="bpsy-buy" style="width:100%;padding:14px">💳 線上刷卡購買・立即取得授權碼</button>'+
       '<div class="bpsy-chans">'+'<span class="bpsy-chan">💳 信用卡</span>'+'<span class="bpsy-chan">🏧 ATM 轉帳</span>'+'<span class="bpsy-chan">🏪 超商代碼</span>'+'<span class="bpsy-chan">📱 TWQR 行動支付</span>'+'</div>'+'<div class="bpsy-safe">金流由 <b>綠界科技 ECPay</b> 提供,通過金管會核備之第三方支付服務。<br>刷卡資料直接輸入綠界頁面,<b>本站不接觸、不留存你的卡號</b>。<br>付款完成畫面直接顯示授權碼,並同時寄一份到你的 Email。</div>'+
       '<div style="display:flex;align-items:center;gap:8px;margin:16px 0 6px;opacity:.4;font-size:11px">'+
         '<span style="flex:1;height:1px;background:currentColor"></span>或<span style="flex:1;height:1px;background:currentColor"></span></div>'+
       '<div style="font-size:12.5px;opacity:.8">加 LINE 由專人處理</div>'
     : '<div style="font-size:13px;opacity:.85">加 LINE 取得授權碼</div>')+
   '<div class="lid">'+LINE_ID+'</div>'+
   '<button class="bpsy-btn" id="bpsy-line"'+(BUY_URL?' style="background:transparent;border:1.5px solid rgba(201,169,106,.5);color:#e8dcc8;box-shadow:none;animation:none;font-weight:400;padding:10px 22px;font-size:13.5px"':'')+'>開啟 LINE 加好友</button>'+
   '<div style="margin-top:16px;font-size:13px;opacity:.85">已有授權碼?</div>'+
   '<input id="bpsy-in" placeholder="BPSY-XXXXXX-XXXX" autocomplete="off" autocapitalize="characters" spellcheck="false">'+
   '<div id="bpsy-msg"></div>'+
   '<div class="row"><button id="bpsy-x">關閉</button><button class="pri" id="bpsy-go">解碼</button></div>'+
   /* 綠界審核與消保法都要求可清楚查閱商品內容、交付與退費規定 */
   '<div style="margin-top:14px;font-size:11.5px;opacity:.6;line-height:1.8">'+
     '<a href="購買說明.html" target="_top" style="color:#E0C285">服務說明・交付方式・退費規定</a>'+
     '<br>客服信箱 jackkok1388@gmail.com</div>'+
   '</div>';
  document.body.appendChild(m);
  m.addEventListener('click',function(e){ if(e.target===m) close(); });
  m.querySelector('#bpsy-x').onclick=close;
  m.querySelector('#bpsy-line').onclick=function(){
    try{ window.open('https://line.me/R/ti/p/~'+LINE_ID,'_blank'); }catch(e){}
  };
  var buy=m.querySelector('#bpsy-buy');
[].slice.call(m.querySelectorAll('a[data-terms]')).forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();_bpTerms(a.getAttribute('data-terms')||'');});});
  if(buy)buy.onclick=function(){var _ck=[].slice.call(m.querySelectorAll('.bpsy-ck'));if(_ck.length && !_ck.every(function(c){return c.checked})){var _mm=m.querySelector('#bpsy-agmsg');if(_mm)_mm.style.display='block';return false;}try{localStorage.setItem('bpsy_agree',new Date().toISOString());}catch(e){}
    // iframe 內要開到最上層視窗,否則會被夾在小框裡
    try{ (window.top||window).open(BUY_URL,'_blank'); }catch(e){ window.open(BUY_URL,'_blank'); }
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
/* gate(完整內容, 標題, 個人化提要)
   teaser 必須是「由本人命盤實算出來的具體結論」,不是廣告詞。
   給了 teaser 就先讓他看見結論、斷在論斷與化解之前。 */
function gate(html, title, teaser){
  if(ok()) return html;
  css();
  // 不放真實內文,只放假文字底,避免未付費者由原始碼取得內容
  var plain='本段依抱朴隨緣堂心法逐項推演,含吉凶所主、應期年份、六親所應、'+
            '致命要害與化解次第,並附臨案驗證與實作步驟。此為本堂多年臨場心得之整理,'+
            '非坊間泛論可比,解碼後可永久查閱、離線使用。';
  return '<div class="bpsy-wrap" data-bpsy-open>'+
    '<div class="bpsy-tag"><span>🔒 深解內容・尚未解碼</span><span class="r">'+PRICE+'</span></div>'+
    (teaser?'<div class="bpsy-teaser">'+teaser+'</div>':'')+
    '<div class="bpsy-cut"><div class="bpsy-blur">'+plain+'</div>'+
    '<div class="bpsy-mask"><div class="bi">🔒</div>'+
    '<div class="bt">'+(title||'深解內容')+'</div>'+
    '<div class="bs">'+(teaser?'完整論斷與化解次第<br>解碼後永久開啟':'此段為抱朴隨緣堂心法深解<br>一次解碼・永久開啟・不需連網')+'</div>'+
    '<div style="font-size:11.5px;opacity:.72;margin:6px 0 8px;line-height:1.7">NT$1,280 一次付清,<b style="color:#E0C285">全站深解一起開</b>,非單篇購買</div>'+'<button class="bpsy-btn" data-bpsy-open>🔑 點此解碼</button>'+
    '<div class="bpsy-hint">已有授權碼?也是點這裡輸入</div></div></div></div>';
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
    '<div style="font-size:11.5px;opacity:.72;margin-bottom:8px;line-height:1.7">一次付清,<b style="color:#E0C285">全站深解永久開啟</b>,不限裝置</div>'+'<button class="bpsy-btn" data-bpsy-open>🔑 解碼 '+PRICE+'</button>';
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


/* ══════ 伺服器端驗證與內容配送 ══════
   深解內容不再放在網頁原始碼裡,改由伺服器驗過授權碼才送。
   驗過一次即快取於本機,之後離線可讀。                        */
var API='https://script.google.com/macros/s/AKfycbwKFd6QDy5KL0ql8ImnQS5cbmIV-jzm1vdX3RysbZOTUdbQDY9PHIhLgVVN32Gz8QEZMw/exec';
var CKEY='bpsy_paid_v1';

function devId(){
  try{
    var d=localStorage.getItem('bpsy_dev');
    if(!d){ d=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
      localStorage.setItem('bpsy_dev',d); }
    return d;
  }catch(e){ return 'nodev' }
}
function cacheGet(id){
  try{ return (JSON.parse(localStorage.getItem(CKEY)||'{}'))[id]||null }catch(e){ return null }
}
function cachePut(id,html){
  try{ var o=JSON.parse(localStorage.getItem(CKEY)||'{}'); o[id]=html;
    localStorage.setItem(CKEY,JSON.stringify(o)); }catch(e){}
}
/* 伺服器驗證。回 {ok, devices, warn} */
function verifyRemote(code){
  return fetch(API+'?p=verify&code='+encodeURIComponent(code)+'&dev='+encodeURIComponent(devId()))
    .then(function(r){return r.json()})
      .then(function(j){ try{ if(j && j.packKey && window.BPSY && window.BPSY.setPackKey) window.BPSY.setPackKey(j.packKey); }catch(e){} return j; })
    .catch(function(){ return {ok:null, msg:'連線失敗'} });   // null = 無法判定,不誤殺
}
/* 取深解內容。先看本機快取,沒有才連伺服器 */
function fetchPaid(id){
  var c=cacheGet(id);
  if(c)return Promise.resolve({ok:true,html:c,cached:true});
  var code=null; try{ code=localStorage.getItem(KEY) }catch(e){}
  if(!code)return Promise.resolve({ok:false,msg:'尚未解碼'});
  return fetch(API+'?p=content&code='+encodeURIComponent(code)+'&id='+encodeURIComponent(id))
    .then(function(r){return r.json()})
    .then(function(j){ if(j.ok)cachePut(id,j.html); return j; })
    .catch(function(){ return {ok:false,msg:'內容需連網取得,請連上網路後再試'} });
}
/* 把深解內容掛進指定容器 */
function mount(sel,id){
  var el=(typeof sel==='string')?document.querySelector(sel):sel;
  if(!el)return;
  if(!ok()){ el.innerHTML=gate('',''); bind(); return; }
  el.innerHTML='<div style="opacity:.6;font-size:13px;padding:10px 0">深解內容載入中…</div>';
  fetchPaid(id).then(function(j){
    el.innerHTML = j.ok ? j.html
      : '<div style="opacity:.75;font-size:13px;padding:10px 0">'+(j.msg||'無法取得內容')+'</div>';
  });
}

g.BPSY={ok:ok,gate:gate,gatePage:gatePage,bind:bind,open:open_,close:close,
         valid:valid,gen:gen,save:save,clear:clear,LINE:LINE_ID,PRICE:PRICE,KEY:KEY,verifyRemote:verifyRemote,fetchPaid:fetchPaid,mount:mount,devId:devId,API:API};

/* ── 案件狀態層:模組頁自動載入(外殼不需要)── */
function loadCase(){
  if(document.getElementById('stage'))return;        // index.html 外殼
  if(window.BPCASE||document.getElementById('bpcase-js'))return;
  var s=document.createElement('script');
  s.id='bpcase-js'; s.src='case.js'; s.defer=false;
  (document.head||document.documentElement).appendChild(s);
}

theme(); scrollFix();
document.addEventListener('DOMContentLoaded',function(){ theme(); scrollFix(); bind(); loadCase(); });
if(document.readyState!=='loading')loadCase();
})(window);

/* ==============================================================
   通用付費區塊引擎 v1 —— 抱朴隨緣堂
   ⚠ 這裡只做「畫面遮蔽」，文字仍在原始碼中。
     真要防抄，須把內文搬到 GAS 的 PAID 由伺服器配送。
   ============================================================== */
(function(){
  if(!window.BPSY) return;
  var B = window.BPSY;
  if(B.gateSections) return;

  (function(){
    if(document.getElementById('bpsy-gcss')) return;
    var s = document.createElement('style'); s.id = 'bpsy-gcss';
    s.textContent = '.bpsy-lockcell{color:#c9a24a;opacity:.75;font-size:15px}';
    (document.head||document.documentElement).appendChild(s);
  })();

  function card(t,d){ try{ return B.gate('', t, d); }catch(e){ return ''; } }

  /* 依標題文字鎖整節：h 之後的兄弟節點，直到遇到同級或更高級標題 */
  B.gateSections = function(root, rules){
    if(B.ok()) return;
    root = (typeof root === 'string') ? document.querySelector(root) : root;
    if(!root) return;
    var heads = [].slice.call(root.querySelectorAll('h1,h2,h3,h4'));
    rules.forEach(function(r){
      var h = heads.filter(function(x){
        if(x.getAttribute('data-bp-gated')) return false;
        return (r.h instanceof RegExp) ? r.h.test(x.textContent) : x.textContent.indexOf(r.h) >= 0;
      })[0];
      if(!h) return;
      h.setAttribute('data-bp-gated','1');
      var lv = h.tagName, n = h.nextElementSibling, kill = [];
      while(n){
        if(/^H[1-6]$/.test(n.tagName) && n.tagName <= lv) break;
        kill.push(n); n = n.nextElementSibling;
      }
      if(!kill.length) return;
      var d = document.createElement('div');
      d.innerHTML = card(r.title || h.textContent.replace(/^[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341]+\u3001/,'').trim(), r.desc || '');
      h.parentNode.insertBefore(d, kill[0]);
      kill.forEach(function(e){ if(e.parentNode) e.parentNode.removeChild(e); });
    });
    if(B.bind) B.bind(root);
  };

  /* 鎖表格的某幾欄：欄位保留，內文換成鎖頭 */
  B.gateCols = function(root, colNames, note){
    if(B.ok()) return;
    root = (typeof root === 'string') ? document.querySelector(root) : root;
    if(!root) return;
    var hit = false;
    [].slice.call(root.querySelectorAll('table')).forEach(function(tb){
      if(tb.getAttribute('data-bp-gated')) return;
      var r0 = tb.rows[0]; if(!r0) return;
      var idx = [];
      [].slice.call(r0.cells).forEach(function(th,i){
        if(colNames.some(function(c){ return th.textContent.indexOf(c) >= 0; })) idx.push(i);
      });
      if(!idx.length) return;
      tb.setAttribute('data-bp-gated','1'); hit = true;
      [].slice.call(tb.rows).slice(1).forEach(function(tr){
        idx.forEach(function(i){
          if(tr.cells[i]) tr.cells[i].innerHTML = '<span class="bpsy-lockcell">\ud83d\udd12</span>';
        });
      });
    });
    if(hit && note !== false){
      var d = document.createElement('div');
      d.innerHTML = card(note || '\u9010\u9805\u65b7\u8a9e', '\u8868\u4e2d\u7684\u5224\u65b7\u6587\u5b57\u70ba\u6df1\u89e3\u5167\u5bb9\uff0c\u89e3\u78bc\u5f8c\u5168\u90e8\u986f\u793a\u3002');
      root.appendChild(d);
      if(B.bind) B.bind(root);
    }
  };

  /* 容器變動後自動重鎖（有次數上限，避免迴圈） */
  B.autoGate = function(root, fn){
    root = (typeof root === 'string') ? document.querySelector(root) : root;
    if(!root) return;
    var busy = false, runs = 0;
    function run(){
      if(busy || runs > 80) return;
      busy = true; runs++;
      try{ fn(); }catch(e){}
      busy = false;
    }
    try{ new MutationObserver(run).observe(root, {childList:true, subtree:true}); }catch(e){}
    setTimeout(run, 300); setTimeout(run, 1200);
    document.addEventListener('click', function(){ runs = 0; setTimeout(run, 150); });
  };
})();

/* 保留前 N 個區塊，其餘鎖起來（給沒有標題結構的清單型輸出用） */
(function(){
  if(!window.BPSY || window.BPSY.gateRest) return;
  var B = window.BPSY;
  B.gateRest = function(root, keepN, title, desc){
    if(B.ok()) return;
    root = (typeof root === 'string') ? document.querySelector(root) : root;
    if(!root || root.getAttribute('data-bp-gated')) return;
    var kids = [].slice.call(root.children).filter(function(e){
      return !/^(SCRIPT|STYLE)$/.test(e.tagName) && !e.classList.contains('bpsy-wrap');
    });
    if(kids.length <= keepN) return;
    root.setAttribute('data-bp-gated','1');
    var kill = kids.slice(keepN);
    var d = document.createElement('div');
    try{ d.innerHTML = B.gate('', title || '\u5b8c\u6574\u4f48\u5c40\u5efa\u8b70', desc || ''); }catch(e){}
    root.insertBefore(d, kill[0]);
    kill.forEach(function(e){ if(e.parentNode) e.parentNode.removeChild(e); });
    if(B.bind) B.bind(root);
  };
})();

/* 判語資料包的金鑰：驗證通過時由 GAS 發下來，存在本機。
   沒金鑰就解不開 pack.bin，判語一律回空。 */
(function(){
  if(!window.BPSY) return;
  var KK = "bpsy_packkey";
  window.BPSY.packKey = function(){
    try { return localStorage.getItem(KK) || null; } catch(e){ return null; }
  };
  window.BPSY.setPackKey = function(k){
    try { if(k) localStorage.setItem(KK, String(k)); } catch(e){}
    try { if(window.BPPACK) BPPACK.load(String(k||"")); } catch(e){}
  };
  /* 頁面一載入就先把資料包叫醒（已快取者幾毫秒就好） */
  try { if(window.BPPACK) BPPACK.ready(); } catch(e){}
})();
