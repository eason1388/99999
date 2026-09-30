/* Isolated pair presentation rule. The underlying chart and general scoring stay unchanged. */
(function(g){
  'use strict';
  function personKey(person){
    if(!person)return '';
    var time=String(person.time||'');
    if(/^\d{2}:\d{2}:00$/.test(time))time=time.slice(0,5);
    return String(person.birth||'')+'|'+time+'|'+String(person.sex);
  }
  var identities=['1975-07-16|05:27|1','1976-04-09|02:00|0'];
  var chapters=[
    ['一、感情基調——相知相惜，溫柔同行',
      '這段關係值得珍惜的，是兩個人願意逐漸理解彼此，把關心落實在日常。相處不必時時熱烈；能安心分享心事、記得對方的需要，也是一種深厚的親近。'],
    ['二、彼此欣賞——看見優點，也容得下差異',
      '多留意對方讓自己感到踏實、被尊重的地方，並把欣賞說出口。兩人不需要凡事相同，能在不同意見中仍保有尊重，感情才有持續靠近的空間。'],
    ['三、溝通默契——把心意說清楚',
      '想念就表達，介意就溫和說明，不用冷淡試探，也不讓對方靠猜測確認心意。先聽懂彼此在意什麼，再一起談做法，往往比爭出誰對誰錯更能增進信任。'],
    ['四、相處節奏——親近而不催促',
      '安排兩人都舒服的聯絡與見面節奏，也尊重各自的工作、朋友和休息時間。關係的進展以雙方都願意為前提；穩定而自然的陪伴，比急著要求承諾更能累積安全感。'],
    ['五、生活互補——一起分擔，也彼此照顧',
      '把共同生活的小事商量清楚：誰方便安排、誰擅長處理，就主動多做一點，再適時交換與調整。互補不是一方長期付出，而是兩個人都能感受到自己的努力被看見。'],
    ['六、分歧處理——先安定情緒，再靠近彼此',
      '有不同意見時，先暫停傷人的話，再約好時間把事情談完。不翻舊帳、不以沉默懲罰對方；願意道歉、願意修正，能讓一次分歧成為更了解彼此的機會。'],
    ['七、長久經營——讓承諾落在行動',
      '對時間、金錢、家庭往來與未來期待保持坦誠。把共同目標拆成做得到的小步驟，定期問問彼此最近的感受；可靠的行動與持續的關心，會讓相處更踏實。'],
    ['八、合婚總評——佳偶良緣，值得用心珍惜',
      '以相知相惜為起點，以尊重與信任為依歸，這是一段值得認真對待、溫柔經營的緣分。願兩人在彼此願意的步調裡，一起把欣賞化為陪伴，把心意累積成安穩。']
  ];
  var profile={
    score:92,
    label:'天作之合',
    summary:'相知相惜，適合以真誠與耐心培養長久默契。<br>保留彼此的特質，也願意照顧對方的感受，讓欣賞在日常中化為踏實的陪伴。<br><b>好緣分值得珍惜；雙方自願、互相尊重與持續付出，是感情安穩的根本。</b>',
    teaser:'<b>相知相惜・溫柔同行</b><br>從彼此欣賞、溝通默契到生活分工，整理八個讓關係更安穩的相處方向。',
    deep:chapters.map(function(chapter){
      return '<h3 style="font-family:\'Noto Serif TC\',serif;font-size:15px;color:var(--gold);margin:14px 0 5px;padding-bottom:3px;border-bottom:1px solid rgba(201,169,106,.3)">'+chapter[0]+'</h3>'+
        '<div style="font-size:13.5px;line-height:1.95;margin:5px 0">'+chapter[1]+'</div>';
    }).join('')+'<div style="font-size:11.5px;opacity:.6;margin-top:10px;line-height:1.8">合婚是參考，不是判決；分數不保證關係結果，兩人真實的感受、選擇與相待之心更重要。</div>'
  };
  g.BPHEHUNPAIR={find:function(a,b){
    var ka=personKey(a),kb=personKey(b);
    return ((ka===identities[0]&&kb===identities[1])||(ka===identities[1]&&kb===identities[0]))?profile:null;
  }};
})(window);
