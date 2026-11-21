'use strict';
const VERSION='1.2.0';
const CACHE_KEY='mishiten-forecast-v1';
const API='https://api.open-meteo.com/v1/forecast?latitude=35.118&longitude=138.919&timezone=Asia%2FTokyo&forecast_days=2&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max';
const $=id=>document.getElementById(id);
let forecast=null,selected=0;
const days=['日','月','火','水','木','金','土'];
function fmt(date){const d=new Date(date+'T12:00:00+09:00');return `${d.getMonth()+1}/${d.getDate()}（${days[d.getDay()]}）`}
function icon(c){if(c===0)return '☀️';if(c<=2)return '🌤️';if(c<=3)return '☁️';if(c<=48)return '🌫️';if(c<=67)return '🌧️';if(c<=77)return '❄️';if(c<=82)return '🌦️';return '⛈️'}
function label(c){if(c===0)return '晴れ';if(c<=2)return '晴れ時々くもり';if(c<=3)return 'くもり';if(c<=48)return '霧';if(c<=67)return '雨';if(c<=77)return '雪';if(c<=82)return 'にわか雨';return '雷雨'}
function normalize(raw){if(!raw?.daily?.time?.length||!raw?.hourly?.time?.length)throw Error('予報データが不正です');return {updated:Date.now(),current:raw.current,days:raw.daily.time.slice(0,2).map((date,i)=>({date,code:raw.daily.weather_code[i],hi:Math.round(raw.daily.temperature_2m_max[i]),lo:Math.round(raw.daily.temperature_2m_min[i]),rain:raw.daily.precipitation_probability_max[i]??0,hours:raw.hourly.time.map((t,j)=>({time:t,temp:raw.hourly.temperature_2m[j],code:raw.hourly.weather_code[j],rain:raw.hourly.precipitation_probability[j]})).filter(x=>x.time.startsWith(date))}))}}
function render(){if(!forecast)return;const d0=forecast.days[0];const top=forecast.days[selected];if(!top)return;const today=selected===0;const displayCode=today?(forecast.current?.weather_code??top.code):top.code;const displayTemp=today?Math.round(forecast.current?.temperature_2m??top.hi):top.hi;$('date').textContent=(today?'今日 ':'明日 ')+fmt(top.date);$('currentTemp').textContent=displayTemp;$('condition').textContent=label(displayCode);$('bigIcon').textContent=icon(displayCode);$('high').textContent=`最高 ${top.hi}°`;$('low').textContent=`最低 ${top.lo}°`;$('rain').textContent=`☂ 降水確率 ${top.rain}%`;
 document.querySelectorAll('.day').forEach((el,i)=>{const d=forecast.days[i];if(!d)return;el.classList.toggle('active',selected===i);el.querySelector('strong').textContent=(i===0?'今日 ':'明日 ')+fmt(d.date);el.querySelector('.weather-icon').textContent=icon(d.code);el.querySelector('.summary').textContent=label(d.code);el.querySelector('.temps').textContent=`${d.hi}° / ${d.lo}°`;el.querySelector('.chance').textContent=`☂ 降水確率 ${d.rain}%`});
 const d=forecast.days[selected];if(!d)return;$('hourTitle').textContent=(selected===0?'今日':'明日')+'の時間別予報';const now=new Date().toLocaleString('sv-SE',{timeZone:'Asia/Tokyo'}).replace(' ','T');let h=d.hours.filter(x=>selected===1||x.time.slice(0,13)>=now.slice(0,13));if(!h.length)h=d.hours;$('hours').replaceChildren(...h.filter((_,i)=>i%2===0).map(x=>{const el=document.createElement('div');el.className='hour';const hour=x.time.slice(11,13);el.innerHTML=`<span>${hour}時</span><span class="emoji">${icon(x.code)}</span><b>${Math.round(x.temp)}°</b><span class="precip">☂ ${x.rain??0}%</span>`;return el}));$('tip').textContent=d.rain>=50?'雨の可能性があります。傘を持って出かけましょう。':d.lo<=7?'朝晩は冷え込みます。暖かい上着があると安心です。':d.hi>=28?'日中は暑くなりそうです。こまめな水分補給を忘れずに。':'気温の変化に合わせて服装を調整しましょう。';renderOutfit(d);renderSpots(d);applyWeatherBackground();}
async function refresh(){const btn=$('reload');btn.disabled=true;$('status').textContent='最新の天気を取得しています…';try{const response=await fetch(API,{cache:'no-store'});if(!response.ok)throw Error('取得失敗');const data=normalize(await response.json());forecast=data;try{localStorage.setItem(CACHE_KEY,JSON.stringify(data))}catch{}render();$('status').textContent='✓ 更新：'+new Date(data.updated).toLocaleString('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+'（日本時間）'}catch(e){$('status').textContent=forecast?'⚠ 通信できません。保存済みの予報を表示中です。':'⚠ 取得できませんでした。ネット接続を確認して更新してください。'}finally{btn.disabled=false}}
for(const el of document.querySelectorAll('.day'))el.addEventListener('click',()=>{selected=Number(el.dataset.index);render()});$('reload').addEventListener('click',refresh);
// Appearance settings are saved on this device only.
const THEME_KEY='mishiten-theme-v1', EFFECTS_KEY='mishiten-effects-v1';
let themeSetting='auto',weatherEffects=true;
try{themeSetting=localStorage.getItem(THEME_KEY)||'auto';weatherEffects=localStorage.getItem(EFFECTS_KEY)!=='false'}catch{}

// Curated suggestions are bundled locally. No location or place-search API is used.
const SPOTS=[
 {name:'楽寿園',town:'三島市',emoji:'🌳',type:'outdoor',cool:true,desc:'木陰や緑を楽しめる市街地の公園。散策におすすめ。'},
 {name:'三島スカイウォーク',town:'三島市',emoji:'🌉',type:'outdoor',cool:false,desc:'晴れた日の景色を楽しみたいときに。風の強い日は注意。'},
 {name:'柿田川公園',town:'清水町',emoji:'💧',type:'outdoor',cool:true,desc:'湧水と木陰のある散策スポット。暑い日の短時間のお出かけに。'},
 {name:'源兵衛川',town:'三島市',emoji:'🌿',type:'outdoor',cool:true,desc:'水辺の景観を楽しめる散策コース。足元には注意。'},
 {name:'沼津港深海水族館',town:'沼津市',emoji:'🐟',type:'indoor',cool:true,desc:'雨の日や暑い日に楽しみやすい屋内施設。'},
 {name:'佐野美術館',town:'三島市',emoji:'🖼️',type:'indoor',cool:true,desc:'天候を気にせず展示を楽しめる美術館。'},
 {name:'沼津市立図書館',town:'沼津市',emoji:'📚',type:'indoor',cool:true,desc:'静かな屋内で読書を楽しみたい日に。'},
 {name:'裾野市立鈴木図書館',town:'裾野市',emoji:'📖',type:'indoor',cool:true,desc:'暑さや雨を避けてゆっくり過ごせる場所。'},
 {name:'長泉町健康公園',town:'長泉町',emoji:'🚶',type:'outdoor',cool:false,desc:'過ごしやすい気温の日に散歩や軽い運動を。'}
];
function renderSpots(d){
 const rainy=d.rain>=45||d.code>=51;const hot=d.hi>=28;const cold=d.hi<=11;
 let reason,chosen;
 if(rainy){reason='雨の可能性があるため、屋内で楽しめる場所を選びました。';chosen=['沼津港深海水族館','佐野美術館','沼津市立図書館','裾野市立鈴木図書館'];}
 else if(hot){reason=`最高${d.hi}℃の暑い予報。涼しさを感じられる場所や屋内施設がおすすめです。`;chosen=['柿田川公園','沼津港深海水族館','佐野美術館','源兵衛川'];}
 else if(cold){reason='寒い予報なので、暖かい屋内で過ごせる場所を中心に選びました。';chosen=['佐野美術館','沼津港深海水族館','沼津市立図書館','裾野市立鈴木図書館'];}
 else{reason='お出かけしやすい気温。景色や散策を楽しめる場所がおすすめです。';chosen=['三島スカイウォーク','楽寿園','長泉町健康公園','柿田川公園'];}
 $('spotsReason').textContent=(selected===0?'今日':'明日')+'：'+reason;
 $('spots').replaceChildren(...chosen.map(name=>{const s=SPOTS.find(x=>x.name===name);const el=document.createElement('article');el.className='spot';const emoji=document.createElement('div');emoji.className='spot-emoji';emoji.textContent=s.emoji;const title=document.createElement('h3');title.textContent=s.name;const town=document.createElement('div');town.className='town';town.textContent='📍 '+s.town;const desc=document.createElement('p');desc.textContent=s.desc;const match=document.createElement('span');match.className='match';match.textContent=rainy?'☂ 雨の日向け':hot?'🌡 暑い日向け':cold?'🧣 寒い日向け':'☀ お出かけ日和';el.append(emoji,title,town,desc,match);return el;}));
}

function renderOutfit(d){const items=[];if(d.lo<=7)items.push('🧥 厚手の上着');else if(d.lo<=15)items.push('🧥 薄手の上着');else items.push('👕 動きやすい服');if(d.hi>=27)items.push('🥤 飲み物');if(d.rain>=35||[51,53,55,61,63,65,80,81,82,95,96,99].includes(d.code))items.push('☂️ 折りたたみ傘');if(d.code<=2)items.push('🧢 日差し対策');if(d.lo<=5)items.push('🧣 防寒小物');$('outfit').replaceChildren(...items.map(t=>{const el=document.createElement('span');el.textContent=t;return el}));}
function isNight(){const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',hourCycle:'h23'}).format(new Date()));return hour<6||hour>=18}
function applyWeatherBackground(){const dark=themeSetting==='dark'||(themeSetting==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.body.classList.toggle('dark',dark);document.body.classList.remove('weather-sun','weather-cloud','weather-rain','weather-snow','weather-storm','weather-night');if(weatherEffects&&forecast){const c=forecast.days[selected]?.code??0;const type=c<=2?'sun':c<=48?'cloud':c<=67?'rain':c<=77?'snow':c<=82?'rain':'storm';document.body.classList.add(isNight()&&selected===0?'weather-night':'weather-'+type)}$('themeSelect').value=themeSetting;$('effectsToggle').checked=weatherEffects;$('themeToggle').textContent=dark?'☀️ ライト':'🌙 ダーク';}
$('themeSelect').addEventListener('change',e=>{themeSetting=e.target.value;try{localStorage.setItem(THEME_KEY,themeSetting)}catch{}applyWeatherBackground()});
$('effectsToggle').addEventListener('change',e=>{weatherEffects=e.target.checked;try{localStorage.setItem(EFFECTS_KEY,String(weatherEffects))}catch{}applyWeatherBackground()});
$('themeToggle').addEventListener('click',()=>{const dark=document.body.classList.contains('dark');themeSetting=dark?'light':'dark';try{localStorage.setItem(THEME_KEY,themeSetting)}catch{}applyWeatherBackground()});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',applyWeatherBackground);
applyWeatherBackground();

try{const stored=JSON.parse(localStorage.getItem(CACHE_KEY));if(stored?.days?.length===2){forecast=stored;render();$('status').textContent='保存済みの予報を表示中（更新を確認しています）'}}catch{}
refresh();if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

