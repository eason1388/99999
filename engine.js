/* engine.js — 抱朴隨緣堂 共用推算引擎
   ─────────────────────────────────────────────────────────
   彙集三套引擎,供金鎖玉關頁與整合報告共用,避免各頁各自複製。
   ⚠ 飛星部分與「飛星八宅互動原型.html」為同一份算法,改這裡就要一併重驗。
   對外掛在 window.BPE。
*/
(function(g){
'use strict';

/* ═══════ 一、玄空飛星 ═══════ */
var M24='壬子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥';
var FLY=['中','乾','兌','艮','離','坎','坤','震','巽'];
var PAL_M={'坎':'壬子癸','艮':'丑艮寅','震':'甲卯乙','巽':'辰巽巳',
           '離':'丙午丁','坤':'未坤申','兌':'庚酉辛','乾':'戌乾亥'};
var NUM2PAL={1:'坎',2:'坤',3:'震',4:'巽',6:'乾',7:'兌',8:'艮',9:'離'};
var PAL2NUM={}; Object.keys(NUM2PAL).forEach(function(k){PAL2NUM[NUM2PAL[k]]=+k});
var YANG=new Set('乾坤艮巽甲庚壬丙寅申巳亥'.split(''));

function palaceOf(m){for(var p in PAL_M){if(PAL_M[p].indexOf(m)>=0)return p}return null}
function fly(c,fw){var o={},s=c;for(var i=0;i<FLY.length;i++){o[FLY[i]]=s;s=fw?s%9+1:(s-2+9)%9+1}return o}

function xkChart(period,sitting){
  var facing=M24[(M24.indexOf(sitting)+12)%24];
  var base=fly(period,true);
  var sp=palaceOf(sitting), fp=palaceOf(facing);
  var kind=PAL_M[sp].indexOf(sitting);
  function sc(pal,refIfFive){
    var s=base[pal];
    if(s===5)return fly(5,YANG.has(refIfFive));
    var ref=PAL_M[NUM2PAL[s]][kind];
    return fly(s,YANG.has(ref));
  }
  var mt=sc(sp,sitting), fc=sc(fp,facing), n=period;
  var pattern = (mt[sp]===n&&fc[fp]===n)?'旺山旺向'
              : (mt[fp]===n&&fc[sp]===n)?'上山下水'
              : (mt[fp]===n&&fc[fp]===n)?'雙星會向'
              : (mt[sp]===n&&fc[sp]===n)?'雙星會坐':'其他';
  return{period:period,sitting:sitting,facing:facing,sitPal:sp,facePal:fp,
         base:base,mountain:mt,facing_stars:fc,pattern:pattern};
}

/* ═══════ 二、八宅遊星 ═══════ */
var TRIB={'乾':7,'兌':6,'離':5,'震':4,'巽':3,'坎':2,'艮':1,'坤':0};
var XSTAR=['伏位','生氣','絕命','五鬼','禍害','六煞','天醫','延年'];
var JI_X=new Set(['生氣','延年','天醫','伏位']);
function youxing(zhai,gong){return XSTAR[TRIB[zhai]^TRIB[gong]]}

/* 命卦:三元年命。男逆女順,五寄坤(男)／艮(女)。
   ⚠ 年命以「立春」換年,不是元旦。立春逐年落在 2/3–2/5,
   本函式以 2/4 為界近似;birth 落在 2/3–2/5 者回傳 nearTerm=true,
   提醒需查當年立春確切時刻,不可逕自採用。                        */
function guaYear(year,birth){
  var y=parseInt(year,10)||0;
  if(!birth)return{y:y,nearTerm:false,adjusted:false};
  var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(birth));
  if(!m)return{y:y,nearTerm:false,adjusted:false};
  var Y=+m[1],M=+m[2],D=+m[3];
  if(!y)y=Y;
  var before = (M<2)||(M===2&&D<4);
  return{y: before? y-1 : y,
         nearTerm: (M===2&&D>=3&&D<=5),
         adjusted: before};
}
function mingGua(year,sex,birth){    // sex:1男 0女;birth 可省略
  var g=guaYear(year,birth);
  if(!g.y)return null;
  var s=0,ys=String(g.y);
  for(var i=0;i<ys.length;i++)s+=+ys[i];
  while(s>9)s=String(s).split('').reduce(function(a,b){return a+ +b},0);
  var n = sex ? (11-s) : (4+s);
  n=((n-1)%9+9)%9+1;
  if(n===5)n=sex?2:8;
  return NUM2PAL[n];
}
mingGua.year=guaYear;
var EAST4=new Set(['坎','離','震','巽']);
function guaGroup(gua){return EAST4.has(gua)?'東四命':'西四命'}
function zhaiGroup(pal){return EAST4.has(pal)?'東四宅':'西四宅'}

/* ═══════ 三、星曜旺衰 ═══════ */
var STAR_NM={1:'一白貪狼',2:'二黑病符',3:'三碧祿存',4:'四綠文昌',5:'五黃廉貞',
             6:'六白武曲',7:'七赤破軍',8:'八白左輔',9:'九紫右弼'};
function starLevel(s,per){
  if(s===5||s===2)return -2;
  if(s===per)return 2;
  if(s===per%9+1)return 1;
  if(s===(per%9+1)%9+1)return 1;
  if(s===(per-2+9)%9+1)return 0;
  return -1;
}
var LV_TX={'2':'當旺','1':'進氣','0':'剛退','-1':'衰死','-2':'凶星'};

/* ═══════ 四、金鎖玉關(過路陰陽) ═══════
   總訣:洛書一二三四宮宜砂,六七八九宮宜水。
   斷語為抱朴隨緣堂依卦象、六親房份與臟腑對應之自家表述。 */
var JS_GONGS=[
 {g:'坎',num:1,want:'砂',dir:'正北',who:'中男・二房',body:'腎、膀胱、泌尿、耳、血液',ms:['壬','子','癸']},
 {g:'艮',num:8,want:'水',dir:'東北',who:'少男・三房',body:'脾胃、手、背、鼻、關節',ms:['丑','艮','寅']},
 {g:'震',num:3,want:'砂',dir:'正東',who:'長男・長房',body:'肝膽、足、筋、神經',  ms:['甲','卯','乙']},
 {g:'巽',num:4,want:'砂',dir:'東南',who:'長女・長媳',body:'氣管、股、風疾、毛髮',ms:['辰','巽','巳']},
 {g:'離',num:9,want:'水',dir:'正南',who:'中女',      body:'心、眼目、血液循環、小腸',ms:['丙','午','丁']},
 {g:'坤',num:2,want:'砂',dir:'西南',who:'老母・主婦',body:'腹、脾胃、皮膚',      ms:['未','坤','申']},
 {g:'兌',num:7,want:'水',dir:'正西',who:'少女・幼口',body:'肺、咽喉、口齒',      ms:['庚','酉','辛']},
 {g:'乾',num:6,want:'水',dir:'西北',who:'老父・家長',body:'頭、肺、骨、大腸',    ms:['戌','乾','亥']}
];
var JS_M=(window.BPPACK?BPPACK.proxy('engine.JS_M',false):{});
var JS_FIX={
 砂:'補砂:此方宜設實牆、高櫃、山石盆景或高大植栽填實,色用黃褐厚重,忌開大窗、忌留空。',
 水:'見水:此方宜開窗採光、留出通道,或設水景、明鏡、淺色透亮之物,忌高櫃遮擋、忌堆置重物。'
};
function jsGong(pal){for(var i=0;i<JS_GONGS.length;i++)if(JS_GONGS[i].g===pal)return JS_GONGS[i];return null}
/* 單山判定:合訣 / 違訣 / 未判 */
function jsJudge(m,val){
  var g=jsGong(palaceOf(m));
  if(!g||!val||val==='平')return{k:'non',t:'—',gong:g};
  return{k:(val===g.want)?'ok':'bad', t:(val===g.want)?'合訣':'違訣', gong:g};
}
/* 全盤評分:以已判定的砂水位為分母,違訣加重扣分 */
function jsScore(D){
  D=D||{}; var ok=0,bad=0,fill=0,worst=[];
  JS_GONGS.forEach(function(g){g.ms.forEach(function(m){
    var v=D[m]; if(!v)return; fill++;
    if(v==='平')return;
    if(v===g.want)ok++; else{bad++; worst.push({m:m,g:g,val:v})}
  })});
  var n=ok+bad;
  return{ok:ok,bad:bad,fill:fill,worst:worst,
         s:n?Math.max(0,Math.min(100,Math.round(100*ok/n-bad*1.5))):null};
}

/* ═══════ 五、兩派交叉印證 ═══════
   同一宮位,金鎖玉關(形巒砂水)與玄空飛星八宅(理氣)各自表態。
   兩派同凶者最該先處理;結論相反者,通常是現場還沒看仔細的地方。 */
function xkPalVerdict(ch,pal){
  if(!ch)return{k:'non',why:''};
  var m=ch.mountain[pal], f=ch.facing_stars[pal], per=ch.period;
  var lm=starLevel(m,per), lf=starLevel(f,per);
  var zhai=ch.sitPal, yx=youxing(zhai,pal), yj=JI_X.has(yx);
  var sc=(lm>0?1:lm<=-2?-2:lm<0?-1:0)+(lf>0?1:lf<=-2?-2:lf<0?-1:0)+(yj?1:-1);
  var k = sc>=2?'ok' : sc<=-2?'bad' : 'mid';
  return{k:k, mt:m, fc:f, yx:yx, yj:yj,
    why:'山星'+m+'('+LV_TX[lm]+')、向星'+f+'('+LV_TX[lf]+')、八宅'+yx+(yj?'(吉)':'(凶)')};
}
/* 回傳 8 宮的合斷 */
function crossCheck(caseObj){
  var D=(caseObj&&caseObj.jinsuo)||{};
  var ch=null;
  if(caseObj&&caseObj.sit&&caseObj.per&&M24.indexOf(caseObj.sit)>=0){
    var per=parseInt(caseObj.per,10);
    if(per>=1&&per<=9){try{ch=xkChart(per,caseObj.sit)}catch(e){}}
  }
  var rows=JS_GONGS.map(function(g){
    /* 該宮三山:只要有一山違訣即以違訣論(形煞取重不取輕) */
    var vals=g.ms.map(function(m){return{m:m,v:D[m],j:jsJudge(m,D[m])}});
    var bad=vals.filter(function(x){return x.j.k==='bad'});
    var ok =vals.filter(function(x){return x.j.k==='ok'});
    var js = bad.length?'bad' : ok.length?'ok' : 'non';
    var xk = xkPalVerdict(ch,g.g);
    var lv, tag, act;
    if(js==='non'||xk.k==='non'){ lv=0; tag='資料不足'; act='此宮尚缺一派資料,補齊後才能互參。'; }
    else if(js==='bad'&&xk.k==='bad'){ lv=3; tag='雙重凶・最優先';
      act='形巒與理氣同斷為凶,不必再猶豫,此宮列為第一順位處理。'; }
    else if(js==='ok'&&xk.k==='ok'){ lv=-2; tag='雙重吉';
      act='兩派同斷為吉,宜安排要緊用途——主臥、神位、財位、辦公座向可優先取此宮。'; }
    else if(js==='bad'||xk.k==='bad'){ lv=2; tag='一派報凶';
      act='僅'+(js==='bad'?'金鎖玉關':'飛星八宅')+'見凶,'+(js==='bad'?'理氣':'形巒')+'尚可,屬中度須留意,先化解再觀察。'; }
    else if(js==='ok'&&xk.k==='mid'||xk.k==='ok'&&js==='non'){ lv=-1; tag='一派報吉'; act='一派見吉、一派持平,可用但非首選。'; }
    else { lv=1; tag='需現場複核';
      act='兩派結論不一致('+(js==='ok'?'金鎖玉關吉':'金鎖玉關凶')+'、'+(xk.k==='ok'?'飛星吉':xk.k==='bad'?'飛星凶':'飛星平')+
          '),多半是砂水判得不夠準,請回現場再確認此方的高低虛實。'; }
    return{pal:g.g,dir:g.dir,who:g.who,body:g.body,want:g.want,
           js:js,jsDetail:vals,xk:xk,level:lv,tag:tag,action:act};
  });
  return{chart:ch,rows:rows,
         priority:rows.filter(function(r){return r.level>=2})
                      .sort(function(a,b){return b.level-a.level})};
}

/* ═══════ 六、應期推算 ═══════
   宅盤是「潛勢」,要有流年引動才會發作。本引擎推的是「何時會被引動」。
   五種引動途徑,分強弱累計:
     ① 年紫白凶星(二、五)飛臨該宮
     ② 流年星與該宮病星同數 —— 同星加臨,力量倍增
     ③ 值年太歲坐該宮地支
     ④ 歲破 —— 太歲沖該宮地支
     ⑤ 三合會局會齊該宮地支
   ⚠ 應期是「較可能顯現的時段」,不是保證。對客戶務必如此表述。 */
var ZHI='子丑寅卯辰巳午未申酉戌亥';
var GAN='甲乙丙丁戊己庚辛壬癸';
var PAL_ZHI={'坎':['子'],'艮':['丑','寅'],'震':['卯'],'巽':['辰','巳'],
             '離':['午'],'坤':['未','申'],'兌':['酉'],'乾':['戌','亥']};
var SANHE=[['申','子','辰'],['亥','卯','未'],['寅','午','戌'],['巳','酉','丑']];
function yearZhi(y){return ZHI[((y-4)%12+12)%12]}
function yearGan(y){return GAN[((y-4)%10+10)%10]}
function yearGZ(y){return yearGan(y)+yearZhi(y)}
/* 年紫白中宮星,與案件簿流年掃描同一式 */
function yearStar(y){return (11-(y%9)-1+9)%9+1}
function yearChart(y){return fly(yearStar(y),true)}
function chong(z){return ZHI[(ZHI.indexOf(z)+6)%12]}

/* opts:{pal, star, period, from, span}
   star 為該宮要追的星(病星或旺星),可省略 */
function yingqi(opts){
  opts=opts||{};
  var pal=opts.pal; if(!pal||!PAL_ZHI[pal])return [];
  var star=opts.star||0;
  var from=opts.from||new Date().getFullYear();
  var span=opts.span||9;
  var zs=PAL_ZHI[pal], out=[];
  for(var y=from;y<from+span;y++){
    var yz=yearZhi(y), ann=yearChart(y), a=ann[pal], hits=[], sc=0;
    if(a===5){hits.push('五黃廉貞飛臨本宮');sc+=3}
    else if(a===2){hits.push('二黑病符飛臨本宮');sc+=2}
    if(star&&a===star){hits.push('流年'+a+'與本宮'+star+'同星加臨,力量倍增');sc+=3}
    if(zs.indexOf(yz)>=0){hits.push('太歲'+yz+'坐守本宮');sc+=2}
    /* 歲破:流年支正沖本宮所含之支 */
    for(var k=0;k<zs.length;k++){
      if(chong(zs[k])===yz){hits.push('歲破——太歲'+yz+'正沖本宮'+zs[k]);sc+=3;break}
    }
    /* 三合:流年支與本宮之支同屬一局(同支者已計入值年,不重複) */
    for(var i=0;i<SANHE.length;i++){
      var g=SANHE[i];
      if(g.indexOf(yz)<0)continue;
      var mate=zs.filter(function(z){return g.indexOf(z)>=0 && z!==yz})[0];
      if(mate){hits.push('三合'+g.join('')+'局,'+yz+'會本宮'+mate);sc+=1;break}
    }
    if(!hits.length)continue;
    out.push({year:y, gz:yearGZ(y), zhi:yz, annStar:a, score:sc,
              level: sc>=5?'重':sc>=3?'中':'輕', reasons:hits});
  }
  return out.sort(function(a,b){return b.score-a.score||a.year-b.year});
}
/* 給判語用的一句話 */
function yingqiText(list,n){
  if(!list||!list.length)return '未來數年內無明顯引動之年,可從容安排。';
  var top=list.slice(0,n||3);
  return top.map(function(x){
    return x.year+'('+x.gz+'年,'+x.level+')——'+x.reasons.join('、');
  }).join(';');
}

/* ═══════ 七、流年方位神煞 ═══════ */
var ZHI2PAL={};
Object.keys(PAL_ZHI).forEach(function(p){PAL_ZHI[p].forEach(function(z){ZHI2PAL[z]=p})});
/* 三煞:依年支三合局取其對沖之方 */
var SANSHA={'申子辰':'離','亥卯未':'兌','寅午戌':'坎','巳酉丑':'震'};
var SANSHA_TX={'離':'正南','兌':'正西','坎':'正北','震':'正東'};
function palOfStar(chart,n){for(var p in chart){if(p!=='中'&&chart[p]===n)return p}return null}
function yearFacts(y){
  var yz=yearZhi(y), ann=yearChart(y);
  var taisui=ZHI2PAL[yz], suipo=ZHI2PAL[chong(yz)];
  var sansha=null;
  for(var k in SANSHA){if(k.indexOf(yz)>=0){sansha=SANSHA[k];break}}
  return{year:y, gz:yearGZ(y), zhi:yz, centre:yearStar(y), chart:ann,
    taisui:taisui, taisuiZhi:yz, suipo:suipo, suipoZhi:chong(yz),
    sansha:sansha, sanshaTx:sansha?SANSHA_TX[sansha]:null,
    wu:palOfStar(ann,5), er:palOfStar(ann,2),
    wenchang:palOfStar(ann,4), cai:palOfStar(ann,8), wang:palOfStar(ann,9)};
}
/* 流年星疊本宅盤,逐宮出判語。chart 為 xkChart 結果,可為 null。
   ⚠ tags 分兩類:
     yr  = 太歲、歲破、三煞、五黃二黑落宮 —— 全年共通,家家戶戶一樣
     own = 與「本宅盤」交互作用才成立者 —— 只有這類能用來比較案件輕重
   排序若把 yr 也算進去,每間房子都會同分,名單就失去意義。         */
function annualPalace(chart,pal,y){
  var f=yearFacts(y), a=f.chart[pal];
  var m=chart?chart.mountain[pal]:0, v=chart?chart.facing_stars[pal]:0;
  var yr=[], own=[], lv=0, own_lv=0;
  if(a===5)yr.push('五黃到宮');
  if(a===2)yr.push('二黑病符到宮');
  if(f.taisui===pal)yr.push('太歲方');
  if(f.suipo===pal)yr.push('歲破方');
  if(f.sansha===pal)yr.push('三煞方');
  lv=yr.length?(a===5?3:a===2?2:0)+(f.suipo===pal?2:0)+(f.sansha===pal?2:0)+(f.taisui===pal?1:0):0;

  if(chart){
    /* 二五交加:流年與宅盤之間一為二、一為五,主病災,最忌 */
    var pair=[a,m,v];
    if(pair.indexOf(5)>=0&&pair.indexOf(2)>=0){own.push('二五交加');own_lv+=5}
    /* 流年凶星再臨本已為凶之宮,凶上加凶 */
    if((a===5||a===2)&&(m===5||m===2||v===5||v===2)&&own.indexOf('二五交加')<0){
      own.push('流年凶星疊本宅凶星');own_lv+=3}
    if((a===3&&(m===7||v===7))||(a===7&&(m===3||v===3))){own.push('鬥牛煞(三七疊臨)');own_lv+=2}
    if(a===chart.period){own.push('流年旺星到宮');own_lv-=2}
    if(a===4&&(m===1||v===1)){own.push('一四同宮利文昌');own_lv-=2}
    if(a===9&&(m===9||v===9)){own.push('九紫喜慶重疊');own_lv-=2}
  }
  var tags=own.concat(yr);
  return{pal:pal, ann:a, mt:m, fc:v, hasChart:!!chart,
         tags:tags, yrTags:yr, ownTags:own,
         level:lv+own_lv, ownLevel:own_lv,
         kind:(lv+own_lv)>=4?'重':(lv+own_lv)>=2?'中':(lv+own_lv)<=-2?'吉':'平'};
}

g.BPE={
  ZHI:ZHI,GAN:GAN,PAL_ZHI:PAL_ZHI,ZHI2PAL:ZHI2PAL,yearZhi:yearZhi,yearGZ:yearGZ,
  yearFacts:yearFacts,annualPalace:annualPalace,palOfStar:palOfStar,
  yearStar:yearStar,yearChart:yearChart,chong:chong,
  yingqi:yingqi,yingqiText:yingqiText,
  M24:M24,FLY:FLY,PAL_M:PAL_M,NUM2PAL:NUM2PAL,PAL2NUM:PAL2NUM,
  palaceOf:palaceOf,fly:fly,xkChart:xkChart,
  youxing:youxing,JI_X:JI_X,TRIB:TRIB,XSTAR:XSTAR,
  mingGua:mingGua,guaYear:guaYear,guaGroup:guaGroup,zhaiGroup:zhaiGroup,
  STAR_NM:STAR_NM,starLevel:starLevel,LV_TX:LV_TX,
  JS_GONGS:JS_GONGS,JS_M:JS_M,JS_FIX:JS_FIX,
  jsGong:jsGong,jsJudge:jsJudge,jsScore:jsScore,
  xkPalVerdict:xkPalVerdict,crossCheck:crossCheck
};
})(window);
