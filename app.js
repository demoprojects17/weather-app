const $ = s => document.querySelector(s);
const places = [
 {name:'თბილისი',country:'საქართველო',latitude:41.7151,longitude:44.8271},
 {name:'ლონდონი',country:'დიდი ბრიტანეთი',latitude:51.5074,longitude:-0.1278},
 {name:'ტოკიო',country:'იაპონია',latitude:35.6762,longitude:139.6503},
 {name:'ნიუ-იორკი',country:'აშშ',latitude:40.7128,longitude:-74.006}
];
let selected=places[0], requestId=0, searchId=0, searchController, weatherController;
const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => value == null ? '—' : Math.round(value);
function weather(code,day=1){if(code===0)return [day?'☀️':'🌙','მოწმენდილი'];if(code<=2)return ['🌤️','ნაწილობრივ ღრუბლიანი'];if(code===3)return ['☁️','ღრუბლიანი'];if(code<=48)return ['🌫️','ნისლი'];if(code<=67)return ['🌧️','წვიმა'];if(code<=77)return ['🌨️','თოვლი'];if(code<=82)return ['🌦️','ხანმოკლე წვიმა'];if(code<=86)return ['🌨️','თოვლი'];return ['⛈️','ჭექა-ქუხილი'];}
async function getJSON(url,signal){const r=await fetch(url,{signal});if(!r.ok)throw new Error('API '+r.status);return r.json();}
function forecastURL(p){return 'https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude:p.latitude,longitude:p.longitude,current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure',hourly:'precipitation_probability',daily:'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',timezone:'auto',forecast_days:6});}
async function loadCity(p){const id=++requestId;weatherController?.abort();weatherController=new AbortController();$('#status').className='';$('#status').textContent=`${p.name} — მონაცემები იტვირთება…`;$('#forecast').setAttribute('aria-busy','true');try{const data=await getJSON(forecastURL(p),weatherController.signal);if(id!==requestId)return;selected=p;render(data);$('#location').textContent=[p.name,p.country].filter(Boolean).join(', ');$('#status').textContent=`განახლებულია ${data.current.time.slice(11,16)} · ქალაქის ადგილობრივი დრო`;try{localStorage.setItem('weather-city',JSON.stringify(p));}catch{}}catch(e){if(e.name==='AbortError'||id!==requestId)return;$('#status').className='error';$('#status').replaceChildren(document.createTextNode('ამინდი ვერ ჩაიტვირთა. შეამოწმე ინტერნეტი. '));const retry=document.createElement('button');retry.textContent='ხელახლა ცდა';retry.onclick=()=>loadCity(p);$('#status').append(retry);}finally{if(id===requestId)$('#forecast').setAttribute('aria-busy','false');}}
function render(d){hideForecastDetail();const c=d.current, daily=d.daily,[icon,label]=weather(c.weather_code,c.is_day);$('#forecast').innerHTML=`<article class="current"><div class="card-top"><span>დღეს</span><span>${c.time.slice(11,16)}</span></div><div class="current-main"><span class="temperature">${num(c.temperature_2m)}°</span><span class="weather-icon" aria-hidden="true">${icon}</span></div><p class="condition">${label}</p><div class="metrics"><div><span>შეგრძნებით</span><b>${num(c.apparent_temperature)}°</b></div><div><span>ქარი</span><b>${num(c.wind_speed_10m)} კმ/სთ</b></div><div><span>ტენიანობა</span><b>${num(c.relative_humidity_2m)}%</b></div><div><span>მზის ჩასვლა</span><b>${daily.sunset[0].slice(11,16)}</b></div></div></article>`+daily.time.slice(1,6).map((date,i)=>{const j=i+1,[symbol,description]=weather(daily.weather_code[j]);return `<article class="day"><div><div class="day-name">${new Intl.DateTimeFormat('ka',{weekday:'short'}).format(new Date(date+'T12:00:00'))}</div><div class="date">${date.slice(8)}.${date.slice(5,7)}</div></div><span class="weather-icon" role="img" aria-label="${description}">${symbol}</span><div><div class="high">${num(daily.temperature_2m_max[j])}°</div><div class="low">${num(daily.temperature_2m_min[j])}°</div></div></article>`;}).join('');attachForecastDetails(d);const today=c.time.slice(0,10);const hours=[6,9,12,15,18,21];$('#rain').innerHTML=hours.map(hour=>{const t=`${today}T${String(hour).padStart(2,'0')}:00`,i=d.hourly.time.indexOf(t),v=i<0?null:d.hourly.precipitation_probability[i];return `<div class="rain-bar"><b>${num(v)}${v==null?'':'%'}</b><div class="bar-track"><div class="bar-fill" style="height:${v??0}%"></div></div><small>${hour}:00</small></div>`;}).join('');}
$('#search-form').addEventListener('submit',async e=>{e.preventDefault();const query=$('#search').value.trim();if(query.length<2)return;const id=++searchId;searchController?.abort();searchController=new AbortController();const box=$('#results');box.hidden=false;box.innerHTML='<p>ვეძებთ ქალაქს…</p>';try{const data=await getJSON('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:query,count:6,language:'ka',format:'json'}),searchController.signal);if(id!==searchId)return;box.replaceChildren();if(!data.results?.length){box.innerHTML='<p>ქალაქი ვერ მოიძებნა. სცადე სხვა სახელი.</p>';return;}data.results.forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=[p.name,p.admin1,p.country].filter(Boolean).join(', ');b.onclick=()=>{box.hidden=true;$('#search').value='';loadCity(p);};box.append(b);});}catch(e){if(e.name!=='AbortError'&&id===searchId)box.innerHTML='<p>ძებნა ვერ შესრულდა. სცადე ხელახლა.</p>';}});
$('#search').addEventListener('input',()=>{searchId++;searchController?.abort();$('#results').hidden=true;});
document.addEventListener('click',e=>{if(!$('#search-form').contains(e.target))$('#results').hidden=true;});document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#results').hidden=true;});
$('#theme').onclick=()=>{const light=document.body.classList.toggle('light');$('#theme').setAttribute('aria-label',light?'მუქი თემის ჩართვა':'ღია თემის ჩართვა');try{localStorage.setItem('weather-theme',light?'light':'dark');}catch{}};
$('#explore').onclick=()=>{$('#search').focus();$('#search').scrollIntoView({behavior:'smooth',block:'center'});};
places.forEach((p,i)=>{const b=document.createElement('button');b.className='map-pin';b.style.left=`${(p.longitude+180)/360*100}%`;b.style.top=`${(90-p.latitude)/180*100}%`;b.setAttribute('aria-label',p.name);b.textContent='⌖';b.onclick=()=>loadCity(p);$('#map-pins').append(b);});
places.slice(1).forEach(async p=>{const b=document.createElement('button');b.className='city';b.innerHTML=`<div><small>${escapeHTML(p.country)}</small><h3>${escapeHTML(p.name)}</h3><p>იტვირთება…</p></div><div class="city-right">—</div>`;b.onclick=()=>loadCity(p);$('#cities').append(b);try{const d=await getJSON(forecastURL(p));const [icon,label]=weather(d.current.weather_code,d.current.is_day);document.querySelectorAll('.map-pin')[places.indexOf(p)].textContent=icon;b.querySelector('p').textContent=label;b.querySelector('.city-right').innerHTML=`<span class="weather-icon" aria-hidden="true">${icon}</span><div class="city-temp">${num(d.current.temperature_2m)}°</div>`;}catch{b.querySelector('p').textContent='სანახავად აირჩიე';}});
try{const saved=JSON.parse(localStorage.getItem('weather-city'));if(saved&&typeof saved.name==='string'&&Number.isFinite(saved.latitude)&&Number.isFinite(saved.longitude))selected=saved;if(localStorage.getItem('weather-theme')==='light')$('#theme').click();}catch{}

// A single shared detail card supports pointer, keyboard, and touch interaction.
const forecastDetail = document.createElement('div');
forecastDetail.id = 'forecast-detail';
forecastDetail.className = 'forecast-detail';
forecastDetail.setAttribute('role', 'tooltip');
forecastDetail.hidden = true;
document.body.append(forecastDetail);
let activeForecastCard = null, detailCloseTimer;
function hideForecastDetail() {
  clearTimeout(detailCloseTimer);
  if (activeForecastCard) {
    activeForecastCard.removeAttribute('aria-describedby');
    activeForecastCard.setAttribute('aria-expanded', 'false');
  }
  activeForecastCard = null;
  forecastDetail.hidden = true;
}
function placeForecastDetail() {
  if (!activeForecastCard) return;
  const card = activeForecastCard.getBoundingClientRect();
  const box = forecastDetail.getBoundingClientRect();
  const left = Math.max(12, Math.min(innerWidth - box.width - 12, card.left + (card.width - box.width) / 2));
  const below = card.bottom + 8;
  const top = below + box.height <= innerHeight - 12 ? below : Math.max(12, card.top - box.height - 8);
  forecastDetail.style.left = left + 'px';
  forecastDetail.style.top = top + 'px';
}
function attachForecastDetails(data) {
  document.querySelectorAll('#forecast > article').forEach((card, index) => {
    const day = data.daily;
    const date = new Intl.DateTimeFormat('ka', {weekday:'long', day:'numeric', month:'long'}).format(new Date(day.time[index] + 'T12:00:00'));
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', date + ' — ამინდის დეტალები');
    card.setAttribute('aria-expanded', 'false');
    const show = () => {
      clearTimeout(detailCloseTimer);
      if (activeForecastCard !== card) hideForecastDetail();
      const [icon, description] = weather(index === 0 ? data.current.weather_code : day.weather_code[index], index === 0 ? data.current.is_day : 1);
      const time = value => value ? value.slice(11,16) : '—';
      forecastDetail.innerHTML = `<div class="detail-heading"><span>${escapeHTML(date)}</span><span class="detail-icon" aria-hidden="true">${icon}</span></div><p>${description}</p><dl><div><dt>მაქსიმუმი</dt><dd>${num(day.temperature_2m_max[index])}°</dd></div><div><dt>მინიმუმი</dt><dd>${num(day.temperature_2m_min[index])}°</dd></div><div><dt>მზის ამოსვლა</dt><dd>${time(day.sunrise[index])}</dd></div><div><dt>მზის ჩასვლა</dt><dd>${time(day.sunset[index])}</dd></div></dl>`;
      activeForecastCard = card;
      card.setAttribute('aria-describedby', forecastDetail.id);
      card.setAttribute('aria-expanded', 'true');
      forecastDetail.hidden = false;
      placeForecastDetail();
    };
    card.addEventListener('mouseenter', show);
    card.addEventListener('mouseover', () => { if (activeForecastCard !== card) show(); });
    card.addEventListener('mouseleave', () => { detailCloseTimer = setTimeout(hideForecastDetail, 160); });
    card.addEventListener('focus', show);
    card.addEventListener('blur', hideForecastDetail);
    card.addEventListener('click', show);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(); }
    });
  });
}
forecastDetail.addEventListener('mouseenter', () => clearTimeout(detailCloseTimer));
forecastDetail.addEventListener('mouseleave', hideForecastDetail);
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('#forecast > article') && !forecastDetail.contains(event.target)) hideForecastDetail();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') hideForecastDetail(); });
window.addEventListener('resize', hideForecastDetail);
window.addEventListener('scroll', hideForecastDetail, {passive:true});

loadCity(selected);
