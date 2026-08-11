/* 抱朴隨緣堂・報告書輸出 v1
   用瀏覽器原生列印產生 A4 PDF(離線可用、中文不變豆腐字)

   用法:
     <script src="lock.js"></script>
     <script src="report.js"></script>
     BPRPT.button('#someContainer', {
       title : '紫微斗數命書',
       meta  : [['生辰','1990/08/15 14:30'],['命局','水二局']],
       source: () => document.getElementById('detail')   // 要印的內容
     });

   或直接:BPRPT.print({title, meta, html})
*/
(function(g){
'use strict';

var SHOP = '抱朴隨緣堂';
var SUB  = '全能玄學羅盤';
var LINE = 'fengshui1388';

function css(){
  if(document.getElementById('bprpt-css')) return;
  var st = document.createElement('style'); st.id = 'bprpt-css';
  st.textContent =
  '#bp-print{display:none}' +
  '@media print{' +
    'html,body{background:#fff!important;height:auto!important;overflow:visible!important;' +
      'padding:0!important;margin:0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'body>*{display:none!important}' +
    '#bp-print{display:block!important;color:#1a1a1a;font-family:"Noto Serif TC","Songti TC",serif;font-size:11pt;line-height:1.85}' +
    '@page{size:A4;margin:14mm 13mm 16mm}' +
    /* 版頭 */
    '#bp-print .rh{display:flex;align-items:flex-end;gap:12px;border-bottom:2.5px solid #8C6D3F;padding-bottom:8px;margin-bottom:4px}' +
    '#bp-print .rh .seal{width:42px;height:42px;border:2px solid #8C6D3F;border-radius:50%;display:flex;' +
      'align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#8C6D3F;flex:none}' +
    '#bp-print .rh .nm{font-size:17pt;font-weight:900;letter-spacing:.18em;color:#8C6D3F}' +
    '#bp-print .rh .sb{font-size:8pt;letter-spacing:.3em;color:#666;margin-top:2px}' +
    '#bp-print .rh .rt{margin-left:auto;text-align:right;font-size:8.5pt;color:#666;line-height:1.6}' +
    '#bp-print h1.rtitle{font-size:15pt;letter-spacing:.14em;text-align:center;margin:16px 0 4px;color:#1a1a1a}' +
    '#bp-print .rline{width:54px;height:2px;background:#8C6D3F;margin:0 auto 14px}' +
    /* 基本資料 */
    '#bp-print .rmeta{display:flex;flex-wrap:wrap;gap:0;border:1px solid #C9A96A;border-radius:4px;' +
      'overflow:hidden;margin-bottom:16px;font-size:9.5pt}' +
    '#bp-print .rmeta div{flex:1 1 45%;display:flex;border-bottom:1px solid #E5DED2}' +
    '#bp-print .rmeta div span{background:#F7F3EC;padding:5px 9px;min-width:74px;color:#6b5836;font-weight:700;border-right:1px solid #E5DED2}' +
    '#bp-print .rmeta div b{padding:5px 9px;font-weight:400}' +
    /* 內容 */
    '#bp-print .rbody h2{font-size:12pt;color:#8C6D3F;border-bottom:1.5px solid #C9A96A;' +
      'padding-bottom:3px;margin:16px 0 7px;letter-spacing:.08em;break-after:avoid;page-break-after:avoid}' +
    '#bp-print .rbody h3{font-size:11pt;color:#6b5836;margin:11px 0 4px;break-after:avoid;page-break-after:avoid}' +
    '#bp-print .rbody table{width:100%;border-collapse:collapse;font-size:9pt;margin:6px 0;break-inside:auto}' +
    '#bp-print .rbody th{background:#F7F3EC;color:#6b5836;border:1px solid #D9CDB6;padding:4px 6px;text-align:left}' +
    '#bp-print .rbody td{border:1px solid #E5DED2;padding:4px 6px;vertical-align:top}' +
    '#bp-print .rbody tr{break-inside:avoid;page-break-inside:avoid}' +
    '#bp-print .rbody .item,#bp-print .rbody .row2{display:flex;justify-content:space-between;gap:10px;' +
      'padding:3px 0;border-bottom:1px dotted #DDD4C2;break-inside:avoid}' +
    '#bp-print .rbody .note,#bp-print .rbody .ni{background:#F9F6F0;border-left:2.5px solid #C9A96A;' +
      'padding:7px 10px;margin:7px 0;font-size:9pt;line-height:1.8;break-inside:avoid}' +
    '#bp-print .rbody div,#bp-print .rbody p{break-inside:avoid-page}' +
    /* 深色底的區塊在紙上要翻白 */
    '#bp-print .rbody *{background-image:none!important;box-shadow:none!important;text-shadow:none!important}' +
    '#bp-print .rbody [style*="background"]{background-color:#F9F6F0!important}' +
    '#bp-print .rbody [style*="color:#fff"],#bp-print .rbody [style*="color:white"]{color:#1a1a1a!important}' +
    /* 鎖住的區塊不印 */
    '#bp-print .bpsy-wrap,#bp-print .bpsy-mask,#bp-print .bpsy-blur,#bp-print .bpsy-tag,' +
    '#bp-print button,#bp-print canvas,#bp-print input,#bp-print select{display:none!important}' +
    /* 版尾 */
    '#bp-print .rf{margin-top:20px;border-top:1px solid #C9A96A;padding-top:7px;' +
      'font-size:8pt;color:#777;line-height:1.7;display:flex;justify-content:space-between;gap:12px}' +
    '#bp-print .rdis{margin-top:9px;font-size:7.5pt;color:#999;line-height:1.65}' +
  '}';
  (document.head || document.documentElement).appendChild(st);
}

function today(){
  var d = new Date();
  return d.getFullYear() + '/' + ('0'+(d.getMonth()+1)).slice(-2) + '/' + ('0'+d.getDate()).slice(-2);
}

/** 主函式:組出報告書並叫起列印 */
function print_(o){
  o = o || {};
  /* ── 報告輸出為付費功能 ──
     可交付的文件是師傅拿去跟客戶收費的東西,列印前先驗授權。 */
  if (!(window.BPSY && BPSY.ok())) {
    if (window.BPSY && BPSY.open) {
      alert('報告輸出為深解功能。\n\nNT$1,280 一次付清,全站深解與所有報告輸出永久開啟,不限裝置。');
      BPSY.open();
    } else {
      alert('報告輸出需先解碼(NT$1,280 永久,全站通用)。');
    }
    return;
  }
  css();
  var old = document.getElementById('bp-print');
  if (old) old.remove();

  var html = o.html;
  if (!html && o.source){
    var el = (typeof o.source === 'function') ? o.source() : o.source;
    html = el ? el.innerHTML : '';
  }
  html = html || '';

  var meta = (o.meta || []).map(function(m){
    return '<div><span>' + m[0] + '</span><b>' + m[1] + '</b></div>';
  }).join('');

  var d = document.createElement('div');
  d.id = 'bp-print';
  d.innerHTML =
    '<div class="rh"><div class="seal">羅</div>' +
      '<div><div class="nm">' + SHOP + '</div><div class="sb">' + SUB + '</div></div>' +
      '<div class="rt">製表日期　' + today() + '<br>LINE　' + LINE + '</div></div>' +
    '<h1 class="rtitle">' + (o.title || '命理報告書') + '</h1><div class="rline"></div>' +
    (meta ? '<div class="rmeta">' + meta + '</div>' : '') +
    '<div class="rbody">' + html + '</div>' +
    '<div class="rf"><div>' + SHOP + '　' + SUB + '</div>' +
      '<div>諮詢預約　LINE：' + LINE + '</div></div>' +
    '<div class="rdis">' + (o.note ||
      '本報告依三元易卦、玄空飛星、子平八字與紫微斗數等傳統學理推算,供參考之用,' +
      '不構成醫療、財務或法律建議。各派傳承或有出入,重大決定請另洽專業面斷。') + '</div>';

  document.body.appendChild(d);
  setTimeout(function(){
    try { window.focus(); } catch(e){}
    window.print();
  }, 120);
}

/** 在指定容器內插一顆「列印／存成 PDF」按鈕 */
function button(sel, o){
  var host = (typeof sel === 'string') ? document.querySelector(sel) : sel;
  if (!host) return;
  if (host.querySelector('[data-bprpt]')) return;
  var b = document.createElement('button');
  b.setAttribute('data-bprpt', '1');
  b.textContent = '🖨 列印／存成 PDF 報告書';
  b.style.cssText = 'display:block;width:100%;max-width:340px;margin:14px auto 4px;padding:12px 20px;' +
    'border:0;border-radius:999px;background:linear-gradient(135deg,#c9a96a,#a8853f);color:#1a1410;' +
    'font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;box-shadow:0 4px 16px rgba(201,169,106,.35)';
  b.onclick = function(){
    // 未解碼者只印得到免費層,先告知
    if (g.BPSY && !g.BPSY.ok()){
      if (!confirm('尚未解碼,報告書只會包含免費部分。\n\n解碼後可輸出含完整深解的專業報告書,可直接交付客戶。\n\n仍要列印嗎?')){
        g.BPSY.open(); return;
      }
    }
    print_(typeof o === 'function' ? o() : o);
  };
  host.appendChild(b);
  var t = document.createElement('div');
  t.style.cssText = 'text-align:center;font-size:11.5px;opacity:.6;margin-bottom:10px;line-height:1.7';
  t.innerHTML = '列印視窗選「另存為 PDF」即可存檔<br>' +
                '<span style="opacity:.85">iPhone:分享 → 列印 → 兩指放大 → 存到檔案</span>';
  host.appendChild(t);
  /* 未解碼時,按鈕明示這是付費功能,避免按了才發現 */
  try{
    if(!(window.BPSY && BPSY.ok())){
      var lockBtn=host.querySelector('[data-bprpt]');
      if(lockBtn && lockBtn.textContent.indexOf('深解')<0){
        lockBtn.textContent='🔒 '+lockBtn.textContent.replace(/^🖨\s*/,'')+'(深解功能)';
        lockBtn.style.opacity='.82';
      }
      var tip=document.createElement('div');
      tip.style.cssText='font-size:11.5px;opacity:.7;margin-top:6px;line-height:1.7;text-align:center';
      tip.innerHTML='報告輸出需解碼。NT$1,280 一次付清,<b style="color:#E0C285">全站深解與所有報告永久開啟</b>。';
      host.appendChild(tip);
    }
  }catch(e){}

}

g.BPRPT = { print: print_, button: button, SHOP: SHOP, LINE: LINE };
})(window);
