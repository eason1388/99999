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
var JS_M={
 壬:{ok:'主武貴剛毅,中男體健有擔當,名聲外揚。若南方丙位得水相照,子孫更利文才。',
     bad:'中男損傷、二房人丁不旺,主腎與泌尿之疾。水形如箭直射而來者應驗最速,如葫蘆狀者主腰腿之傷。'},
 子:{ok:'家中男丁康健、子孫聰穎,主守成有道、根基穩固。',
     bad:'中男漂泊不定,易犯桃花酒色,耳疾腎虧。水聚而不流者尤主淫佚暗昧。'},
 癸:{ok:'出秀氣清貴之人,女眷賢淑,主聰明多才。',
     bad:'主婦人隱疾與暗昧之事,男子腎虧體虛,家中易生曖昧口舌。'},
 丑:{ok:'三房進財,主田產倉廩豐盈,積蓄漸厚。',
     bad:'少男傷病、手足關節之疾,破財損丁,家中小口難養。'},
 艮:{ok:'三房大發,人丁財帛兩旺,主置產興家。',
     bad:'少男愚鈍或有傷殘,脾胃不和,家宅不寧、進退兩難。'},
 寅:{ok:'出文秀之人,進田產、得貴助。',
     bad:'小兒多驚,跌撲傷手,主虛驚官非。'},
 甲:{ok:'長男顯貴,出武職有威權,長房興旺。',
     bad:'長男敗財,主肝膽之疾與足傷,長房不利、家長受累。'},
 卯:{ok:'長房人丁興旺,出剛強幹練、能立門戶之人。',
     bad:'長男好動不安、離鄉背井,主官非爭訟、筋骨酸痛。'},
 乙:{ok:'出文人秀士,長女亦賢,主科名文書之喜。',
     bad:'肝木受損、筋骨酸痛,長房口舌是非不斷。'},
 辰:{ok:'田產進益,家道殷實,主積穀藏金。',
     bad:'長女長媳不利,主風濕氣喘,或有難言之惡疾。'},
 巽:{ok:'出文貴、利科名考試,長女賢淑貌美,家出才女。',
     bad:'長女長媳受損,主難產或風化之事,氣管毛髮之疾。'},
 巳:{ok:'利文書功名,家出秀才,主聲名漸起。',
     bad:'蛇蟲驚擾,婦人血症,長房媳婦不安於室。'},
 丙:{ok:'財源廣進、名聲顯達,主科甲功名,文章傳世。',
     bad:'中女不利,主眼目之疾、心火上炎,防火厄與血光。'},
 午:{ok:'大發財祿,人口興旺,主聲名遠播、貴人扶持。',
     bad:'血光、心疾、目病,中女多災,尤防火燭之患。'},
 丁:{ok:'出文人,女眷秀慧,家道昌盛、書香不斷。',
     bad:'中女血症、心神不寧,主口舌是非與虛火之症。'},
 未:{ok:'田產豐厚,主婦持家有道,家宅厚實安穩。',
     bad:'老母有疾、脾胃不和,主婦人病與皮膚之患。'},
 坤:{ok:'人丁旺、婦人壽考,家宅安穩,主厚德綿長。',
     bad:'主婦受損、腹疾纏身,家中陰盛陽衰,是非叢生。'},
 申:{ok:'出武職或有力氣之人,主行動力強、能任事。',
     bad:'婦人多病,防傷胎小產,家中不寧、奔波勞碌。'},
 庚:{ok:'進財迅速,利口才、談判與買賣交易。',
     bad:'少女不利,主肺與咽喉之疾,防刀傷血光。'},
 酉:{ok:'財帛豐盈,家出貌美女子,主人緣與偏財。',
     bad:'少女多災,主口舌官非,齒疾、肺疾纏身。'},
 辛:{ok:'利文書契約與金玉之財,主精巧之藝。',
     bad:'女眷病痛,口舌爭訟,主無端破財。'},
 戌:{ok:'進財有道,老人康健,家中長輩得安。',
     bad:'老父不利,主頭疾與筋骨之痛,家長多病。'},
 乾:{ok:'主大貴,家長顯達,全家蒙其蔭庇。',
     bad:'老父受剋,主頭風骨痛,家長早衰,重則主孤。'},
 亥:{ok:'財源綿長,子孫得蔭,主根基深厚。',
     bad:'肺與大腸之疾,老人氣喘,家運滯塞不通。'}
};
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

g.BPE={
  M24:M24,FLY:FLY,PAL_M:PAL_M,NUM2PAL:NUM2PAL,PAL2NUM:PAL2NUM,
  palaceOf:palaceOf,fly:fly,xkChart:xkChart,
  youxing:youxing,JI_X:JI_X,TRIB:TRIB,XSTAR:XSTAR,
  mingGua:mingGua,guaGroup:guaGroup,zhaiGroup:zhaiGroup,
  STAR_NM:STAR_NM,starLevel:starLevel,LV_TX:LV_TX,
  JS_GONGS:JS_GONGS,JS_M:JS_M,JS_FIX:JS_FIX,
  jsGong:jsGong,jsJudge:jsJudge,jsScore:jsScore,
  xkPalVerdict:xkPalVerdict,crossCheck:crossCheck
};
})(window);
