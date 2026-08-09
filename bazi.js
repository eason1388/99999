/* bazi.js — 四柱排盤與喜用神(供姓名學等模組取用)
   校準基準:本站今日盤 2026/8/5 = 丙午年 乙未月 辛亥日。
   ⚠ 喜用神以扶抑法為主;從格、化格、專旺格機械算法會判錯,
     故遇極端偏枯時回傳 warn 提示人工判斷,並允許外部覆蓋。
   對外掛在 window.BPBAZI。 */
(function(g){
'use strict';
var GAN='甲乙丙丁戊己庚辛壬癸', ZHI='子丑寅卯辰巳午未申酉戌亥';
var GAN_WX={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
var ZHI_WX={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
var SHENG={木:'火',火:'土',土:'金',金:'水',水:'木'};
var KE={木:'土',土:'水',水:'火',火:'金',金:'木'};
function jdnOf(y,m,d){
  var a=Math.floor((14-m)/12), yy=y+4800-a, mm=m+12*a-3;
  return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;
}
function sunLon(jd){
  var T=(jd-2451545)/36525;
  var L0=280.46646+36000.76983*T+0.0003032*T*T;
  var M=357.52911+35999.05029*T-0.0001537*T*T;
  var Mr=M*Math.PI/180;
  var C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(Mr)
       +(0.019993-0.000101*T)*Math.sin(2*Mr)+0.000289*Math.sin(3*Mr);
  var O=125.04-1934.136*T;
  var lam=L0+C-0.00569-0.00478*Math.sin(O*Math.PI/180);
  return ((lam%360)+360)%360;
}
function jdAt(y,m,d,hour){ return jdnOf(y,m,d)-0.5+((hour===undefined?12:hour)-8)/24; }
function liChunJD(y){
  var lo=jdnOf(y,2,1)-0.5, hi=jdnOf(y,2,9)-0.5;
  for(var i=0;i<40;i++){
    var mid=(lo+hi)/2, L=sunLon(mid);
    var diff=((L-315)%360+360)%360;
    if(diff>180)lo=mid; else hi=mid;
  }
  return (lo+hi)/2;
}
function pillars(y,m,d,hour){
  if(hour===undefined||hour===null)hour=12;
  var jd=jdAt(y,m,d,hour), lon=sunLon(jd);
  var mi=Math.floor((((lon-315)%360)+360)%360/30);
  var monthZhi=ZHI[(mi+2)%12];
  var yy=y;
  if(jd<liChunJD(y))yy=y-1;
  var yGanIdx=((yy-4)%10+10)%10, yZhiIdx=((yy-4)%12+12)%12;
  var yinGan=((yGanIdx%5)*2+2)%10;
  var mGanIdx=(yinGan+mi)%10;
  var di=(jdnOf(y,m,d)+49)%60;
  var dGanIdx=di%10, dZhiIdx=di%12;
  var hz=Math.floor((hour+1)/2)%12;
  var ziGan=((dGanIdx%5)*2)%10;
  var hGanIdx=(ziGan+hz)%10;
  return{ year:{gan:GAN[yGanIdx],zhi:ZHI[yZhiIdx]},
    month:{gan:GAN[mGanIdx],zhi:monthZhi},
    day:{gan:GAN[dGanIdx],zhi:ZHI[dZhiIdx]},
    hour:{gan:GAN[hGanIdx],zhi:ZHI[hz]},
    solarLon:lon, adjYear:yy };
}
function strength(p){
  var dw=GAN_WX[p.day.gan], sc=0, detail=[];
  function w(x,base,label){
    var v=0;
    if(x===dw)v=base;
    else if(SHENG[x]===dw)v=base*0.8;
    else if(SHENG[dw]===x)v=-base*0.6;
    else if(KE[dw]===x)v=-base*0.4;
    else if(KE[x]===dw)v=-base*0.9;
    sc+=v; detail.push(label+x+(v>=0?'+':'')+v.toFixed(1));
  }
  w(ZHI_WX[p.month.zhi],3,'月令');
  w(GAN_WX[p.year.gan],1.2,'年干');
  w(GAN_WX[p.month.gan],1.5,'月干');
  w(GAN_WX[p.hour.gan],1.2,'時干');
  w(ZHI_WX[p.year.zhi],1.2,'年支');
  w(ZHI_WX[p.day.zhi],1.8,'日支');
  w(ZHI_WX[p.hour.zhi],1.2,'時支');
  var kind = sc>=1.5?'身強' : sc<=-1.5?'身弱' : ('中和偏'+(sc>0?'強':'弱'));
  var warn=null;
  if(sc<=-6)warn='日主極弱,恐為從弱格(從財、從殺、從兒),扶抑法未必適用,請人工判斷。';
  if(sc>=7)warn='日主極強,恐為專旺格或從強格,扶抑法未必適用,請人工判斷。';
  return{score:+sc.toFixed(1), kind:kind, dayWX:dw, detail:detail, warn:warn};
}
function favor(p){
  var s=strength(p), dw=s.dayWX, like=[], avoid=[], yin=null, guan=null, k;
  for(k in SHENG){if(SHENG[k]===dw)yin=k;}
  for(k in KE){if(KE[k]===dw)guan=k;}
  var shi=SHENG[dw], cai=KE[dw];
  if(s.score>0){ like=[guan,shi,cai]; avoid=[dw,yin]; }
  else { like=[yin,dw]; avoid=[guan,shi,cai]; }
  return{strength:s, like:like, avoid:avoid, primary:like[0],
    text:(s.score>0?'日主偏強,宜洩宜剋,喜':'日主偏弱,宜生宜扶,喜')+like.join('、')+
         ';忌'+avoid.join('、')+'。'};
}
var WX_RADICAL={
 木:'木、艹、竹、禾、東、林、森、松、柏、桂、榮、蓉、芸、茜、菁',
 火:'火、灬、日、光、明、赤、南、炎、煒、煌、晴、暉、昭、烈、彤',
 土:'土、山、石、田、玉、王、圭、坤、培、增、峻、崇、岳、垚',
 金:'金、钅、白、辛、酉、刀、刂、鋒、銘、鈞、鍾、鑫、鈴、錦、璇',
 水:'水、氵、冫、雨、魚、北、江、河、洋、涵、澤、清、淑、霖、沛'
};
var WX_STROKE={木:'尾數 1、2',火:'尾數 3、4',土:'尾數 5、6',金:'尾數 7、8',水:'尾數 9、0'};
g.BPBAZI={GAN:GAN,ZHI:ZHI,GAN_WX:GAN_WX,ZHI_WX:ZHI_WX,SHENG:SHENG,KE:KE,
  jdnOf:jdnOf,sunLon:sunLon,jdAt:jdAt,liChunJD:liChunJD,
  pillars:pillars,strength:strength,favor:favor,
  WX_RADICAL:WX_RADICAL,WX_STROKE:WX_STROKE};
})(window);
