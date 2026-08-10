/* 抱朴隨緣堂 判語資料包 v1
   ─────────────────────────────────────────────
   為什麼要有這一層：
     判語（斷語、化解、深論）是本門的價值所在，不能明擺在原始碼裡。
     做法是把判語抽出來加密成 pack.bin，跟著網站一起發佈；
     解碼金鑰由 GAS 在驗證授權碼時才發給，客戶端解一次、存起來，
     之後永久離線可用。

   ⚠ 誠實的上限：
     付過錢的裝置上一定有明文（不然使用者看不到）。
     這一層擋的是「翻原始碼就抄走」，不是絕對防盜。
     真的外流時，靠的是把那組授權碼從名單移除，讓新裝置拿不到金鑰。
   ───────────────────────────────────────────── */
(function(g){
  'use strict';
  var CACHE_KEY = 'bpsy_pack_v1';
  var BIN_URL   = 'pack.bin';
  var mem = null;      // 解開後的判語物件
  var pending = null;  // 進行中的載入 Promise

  /* ── 小型 IndexedDB 包裝（localStorage 放不下整包） ── */
  function idb(){
    return new Promise(function(res, rej){
      var q = indexedDB.open('bpsy_pack', 1);
      q.onupgradeneeded = function(){ q.result.createObjectStore('kv'); };
      q.onsuccess = function(){ res(q.result); };
      q.onerror   = function(){ rej(q.error); };
    });
  }
  function idbGet(k){
    return idb().then(function(db){
      return new Promise(function(res){
        var r = db.transaction('kv','readonly').objectStore('kv').get(k);
        r.onsuccess = function(){ res(r.result || null); };
        r.onerror   = function(){ res(null); };
      });
    }).catch(function(){ return null; });
  }
  function idbPut(k, v){
    return idb().then(function(db){
      return new Promise(function(res){
        var r = db.transaction('kv','readwrite').objectStore('kv').put(v, k);
        r.onsuccess = function(){ res(true); };
        r.onerror   = function(){ res(false); };
      });
    }).catch(function(){ return false; });
  }

  function hex2buf(h){
    h = String(h||'').replace(/[^0-9a-fA-F]/g,'');
    var a = new Uint8Array(h.length/2);
    for(var i=0;i<a.length;i++) a[i] = parseInt(h.substr(i*2,2),16);
    return a;
  }
  function b64buf(b64){
    var s = atob(String(b64||'').replace(/\s+/g,''));
    var a = new Uint8Array(s.length);
    for(var i=0;i<s.length;i++) a[i] = s.charCodeAt(i);
    return a;
  }

  /* pack.bin 格式：base64( iv(12 bytes) + AES-GCM 密文 ) */
  function decrypt(b64, keyHex){
    var raw = b64buf(b64);
    var iv  = raw.slice(0, 12);
    var ct  = raw.slice(12);
    return crypto.subtle.importKey('raw', hex2buf(keyHex), {name:'AES-GCM'}, false, ['decrypt'])
      .then(function(k){ return crypto.subtle.decrypt({name:'AES-GCM', iv:iv}, k, ct); })
      .then(function(buf){ return JSON.parse(new TextDecoder('utf-8').decode(buf)); });
  }

  /* 先看本機快取；沒有就下載 pack.bin，用金鑰解開後存起來 */
  function load(keyHex){
    if (mem) return Promise.resolve(mem);
    if (pending) return pending;
    pending = idbGet(CACHE_KEY).then(function(cached){
      if (cached && typeof cached === 'object'){ mem = cached; return mem; }
      if (!keyHex) return null;
      return fetch(BIN_URL, {cache:'no-cache'})
        .then(function(r){ return r.ok ? r.text() : null; })
        .then(function(b64){ return b64 ? decrypt(b64, keyHex) : null; })
        .then(function(obj){
          if (!obj) return null;
          mem = obj;
          idbPut(CACHE_KEY, obj);
          return mem;
        });
    }).catch(function(){ return null; })
      .then(function(v){ pending = null; return v; });
    return pending;
  }

  /* 取一個判語表。路徑寫法：'ziwei.SG' */
  function tbl(path){
    if (!mem) return null;
    var cur = mem, parts = String(path||'').split('.');
    for (var i=0;i<parts.length;i++){
      if (cur == null) return null;
      cur = cur[parts[i]];
    }
    return (cur == null) ? null : cur;
  }


  /* 替身表：頂替原本寫在原始碼裡的判語表。
     讀寫行為跟普通物件/陣列一模一樣（Object.keys、map、in 都正常），
     資料包還沒解開時一律回空，不會拋錯。 */
  function proxy(path, isArr){
    var base = isArr ? [] : {};
    function pick(){ return src(path, isArr); }   /* 每次存取都重新問，資料包晚點到也不怕 */
    try {
      return new Proxy(base, {
        get: function(t,k){ var s=pick(); if(s && (k in Object(s))) return Object(s)[k]; return t[k]; },
        has: function(t,k){ var s=pick(); return (s && (k in Object(s))) || (k in t); },
        ownKeys: function(t){ var s=pick(); return s ? Reflect.ownKeys(Object(s)) : Reflect.ownKeys(t); },
        getOwnPropertyDescriptor: function(t,k){
          var s=pick();
          if (s && Object.prototype.hasOwnProperty.call(Object(s),k))
            return {value:Object(s)[k], enumerable:true, configurable:true, writable:true};
          return Reflect.getOwnPropertyDescriptor(t,k);
        }
      });
    } catch(e){ return base; }
  }


  /* 取一張判語表：資料包裡存的是原本的字面原文，用到才計算一次。
     這樣搬遷只是把文字搬家，不動到任何算法。 */

  /* 未解碼時的替代物：怎麼取都不會爆，且一律當空字串。
     原本的渲染程式常寫成 TXT[k][0] 這種形式，
     若只回 {} 會在第二層就拋錯，整頁白掉。 */
  function blank(){
    var f = function(){ return blank(); };
    try {
      return new Proxy(f, {
        get: function(t,k){
          if (k === Symbol.toPrimitive) return function(){ return ""; };
          if (k === Symbol.iterator)   return function(){ return [][Symbol.iterator](); };
          if (k === "toString" || k === "valueOf") return function(){ return ""; };
          if (k === "length") return 0;
          if (k === "join")   return function(){ return ""; };
          if (k === "map" || k === "filter" || k === "slice" || k === "concat") return function(){ return []; };
          if (k === "forEach") return function(){};
          return blank();
        },
        has: function(){ return false; },
        apply: function(){ return blank(); }
      });
    } catch(e){ return {}; }
  }

  var memo = {};
  function src(path, isArr){
    if (Object.prototype.hasOwnProperty.call(memo, path)) return memo[path];
    var s = tbl(path), v = null;
    if (typeof s === "string" && s){
      try { v = (new Function("return (" + s + ")"))(); } catch(e){ v = null; }
    }
    if (v == null) return blank();
    memo[path] = v;
    return v;
  }

  g.BPPACK = {
    load:  load,
    proxy: proxy,
    src:   src,
    tbl:   tbl,
    have:  function(){ return !!mem; },
    clear: function(){ mem = null; return idbPut(CACHE_KEY, null); },
    /* 給模組用：等資料包就緒（已解碼者才會有），回傳 true/false */
    ready: function(){
      if (mem) return Promise.resolve(true);
      var key = null;
      try { key = (g.BPSY && g.BPSY.packKey) ? g.BPSY.packKey() : null; } catch(e){}
      return load(key).then(function(v){ return !!v; });
    }
  };
})(window);
