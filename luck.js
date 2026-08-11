/* 抱朴隨緣堂 — 流月流日運勢引擎 v1
   ─────────────────────────────────────────────
   八字取法：以扶抑法的喜用神為主軸，十神為輔（本門取法）。

   ⚠ 兩個最容易改錯的地方：
     1. 流月以「節」分界（立春、驚蟄、清明…），不是農曆初一。
        改成農曆會讓月初月末的判語整個偏掉。
     2. 流日用日柱干支，校準點 2026/8/5 = 辛亥，
        已與外部農民曆核對（2026/8/11 = 丁巳）。
   ───────────────────────────────────────────── */
(function(g){
'use strict';
if(!g.BPBAZI) return;                      /* 需要 bazi.js 先載入 */
var B = g.BPBAZI, GAN = B.GAN, ZHI = B.ZHI;

function gz(i){ i = ((i%60)+60)%60; return GAN[i%10] + ZHI[i%12]; }

/* ── 干支推算 ── */
function dayIdx(y,m,d){ return (B.jdnOf(y,m,d) + 49) % 60; }

function yearOf(y,m,d){                    /* 流年以立春分界 */
  var jd = B.jdnOf(y,m,d) + 0.5, lc = B.liChunJD(y);
  var yy = (jd < lc) ? y-1 : y;
  return { year: yy, idx: (((yy-4)%60)+60)%60 };
}

function monthOf(y,m,d){                   /* 流月：節氣月支 + 五虎遁月干 */
  var yr  = yearOf(y,m,d);
  var lon = B.sunLon(B.jdAt(y,m,d,12));
  var mi  = Math.floor(((((lon-315)%360)+360)%360)/30);   /* 0 = 寅月 */
  var yg  = yr.idx % 10;
  var gi  = ((yg%5)*2 + 2) % 10;                          /* 寅月天干 */
  return { gan: GAN[(gi+mi)%10], zhi: ZHI[(mi+2)%12], mi: mi, yr: yr };
}

/* ── 十神 ── */
function tenGod(dayGan, tGan){
  var d = GAN.indexOf(dayGan), t = GAN.indexOf(tGan);
  if (d<0 || t<0) return '';
  var dw = B.GAN_WX[dayGan], tw = B.GAN_WX[tGan];
  var same = (d%2) === (t%2);
  if (dw === tw)          return same ? '比肩' : '劫財';
  if (B.SHENG[dw] === tw) return same ? '食神' : '傷官';
  if (B.KE[dw] === tw)    return same ? '偏財' : '正財';
  if (B.KE[tw] === dw)    return same ? '七殺' : '正官';
  if (B.SHENG[tw] === dw) return same ? '偏印' : '正印';
  return '';
}

var TEN_TXT = (window.BPPACK?BPPACK.proxy('luck.TEN_TXT',false):{});

/* ── 沖合 ── */
function chong(a,b){ return (ZHI.indexOf(a)+6)%12 === ZHI.indexOf(b); }
var LIUHE = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯',
             '辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};

/* ── 核心：某一天對某個命局的吉凶 ── */
function dayLuck(p, fav, y, m, d){
  var di = dayIdx(y,m,d), dg = GAN[di%10], dz = ZHI[di%12];
  var dayGan = p.day.gan, dayZhi = p.day.zhi;
  var like = fav.like || [], avoid = fav.avoid || [];
  var gw = B.GAN_WX[dg], zw = B.ZHI_WX[dz];
  var sc = 0, why = [];

  if (like.indexOf(gw) >= 0){ sc += 2; why.push('日干'+dg+'（'+gw+'）生扶喜用'); }
  if (avoid.indexOf(gw) >= 0){ sc -= 2; why.push('日干'+dg+'（'+gw+'）引動忌神'); }
  if (like.indexOf(zw) >= 0){ sc += 2; why.push('日支'+dz+'（'+zw+'）助我所喜'); }
  if (avoid.indexOf(zw) >= 0){ sc -= 2; why.push('日支'+dz+'（'+zw+'）加重所忌'); }
  if (fav.primary && (gw === fav.primary || zw === fav.primary)){ sc += 1; why.push('正逢首要用神'+fav.primary); }

  if (chong(dz, dayZhi)){ sc -= 2; why.push('流日'+dz+'沖本命日支'+dayZhi+'，易有變動奔波'); }
  else if (LIUHE[dz] === dayZhi){ sc += 1; why.push('流日'+dz+'與日支'+dayZhi+'六合，事易成'); }
  if (dz === dayZhi && dg === dayGan) why.push('干支同本命日柱（伏吟），舊事重提');

  var lvl = sc >= 4 ? '大吉' : sc >= 2 ? '吉' : sc >= -1 ? '平' : sc >= -3 ? '小凶' : '凶';
  var tg  = tenGod(dayGan, dg);
  return { gz: dg+dz, gan: dg, zhi: dz, score: sc, level: lvl, ten: tg,
           tenTxt: TEN_TXT[tg] || null, why: why };
}

/* ── 吉時：十二時辰依喜忌評分，取前三 ── */
var SHI = ['子23-01','丑01-03','寅03-05','卯05-07','辰07-09','巳09-11',
           '午11-13','未13-15','申15-17','酉17-19','戌19-21','亥21-23'];
function goodHours(fav, dayGanOfDate){
  var g0 = ((GAN.indexOf(dayGanOfDate)%5)*2)%10;          /* 五鼠遁：子時干 */
  var like = fav.like||[], avoid = fav.avoid||[], out = [];
  for (var i=0;i<12;i++){
    var hg = GAN[(g0+i)%10], hz = ZHI[i];
    var s = 0;
    if (like.indexOf(B.GAN_WX[hg])>=0) s += 2;
    if (avoid.indexOf(B.GAN_WX[hg])>=0) s -= 2;
    if (like.indexOf(B.ZHI_WX[hz])>=0) s += 2;
    if (avoid.indexOf(B.ZHI_WX[hz])>=0) s -= 2;
    out.push({ label: SHI[i], gz: hg+hz, score: s });
  }
  out.sort(function(a,b){ return b.score - a.score; });
  return out;
}

/* ── 本月走勢：整個節氣月逐日掃描 ── */
function monthTrend(p, fav, y, m, d){
  var mo = monthOf(y,m,d);
  var best = [], worst = [], days = [];
  var base = new Date(y, m-1, d);
  for (var k=-35; k<=35; k++){            /* 節氣月最長 31 天，兩邊都要掃到 */
    var t = new Date(base.getTime() + k*86400000);
    var mm = monthOf(t.getFullYear(), t.getMonth()+1, t.getDate());
    if (mm.mi !== mo.mi) continue;                        /* 只取同一個節氣月 */
    var r = dayLuck(p, fav, t.getFullYear(), t.getMonth()+1, t.getDate());
    days.push({ md:(t.getMonth()+1)+'/'+t.getDate(), gz:r.gz, score:r.score, level:r.level });
  }
  days.slice().sort(function(a,b){return b.score-a.score;}).slice(0,3).forEach(function(x){best.push(x)});
  days.slice().sort(function(a,b){return a.score-b.score;}).slice(0,3).forEach(function(x){worst.push(x)});
  var mw = { gan:B.GAN_WX[mo.gan], zhi:B.ZHI_WX[mo.zhi] };
  var mFav = ((fav.like||[]).indexOf(mw.zhi)>=0) ? '本月月令助我所喜，整體順勢'
           : ((fav.avoid||[]).indexOf(mw.zhi)>=0) ? '本月月令引動所忌，宜守不宜攻'
           : '本月月令與喜忌無涉，平穩之月';
  return { month: mo.gan+mo.zhi, monthText: mFav, best: best, worst: worst, days: days };
}

g.BPLUCK = {
  dayIdx: dayIdx, yearOf: yearOf, monthOf: monthOf,
  tenGod: tenGod, TEN_TXT: TEN_TXT,
  dayLuck: dayLuck, goodHours: goodHours, monthTrend: monthTrend,
  gz: gz
};
})(window);
