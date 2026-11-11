const $ = s => document.querySelector(s);
const places = [
 {name:'თბილისი',country:'საქართველო',latitude:41.7151,longitude:44.8271},
 {name:'ლონდონი',country:'დიდი ბრიტანეთი',latitude:51.5074,longitude:-0.1278},
 {name:'ტოკიო',country:'იაპონია',latitude:35.6762,longitude:139.6503},
 {name:'ნიუ-იორკი',country:'აშშ',latitude:40.7128,longitude:-74.006}
];
let locationIntent=0;
let selected=places[0], requestId=0, searchId=0, searchController, weatherController;
const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = value => value == null ? '—' : Math.round(value);
function weather(code,day=1){if(code===0)return [day?'☀️':'🌙','მოწმენდილი'];if(code<=2)return ['🌤️','ნაწილობრივ ღრუბლიანი'];if(code===3)return ['☁️','ღრუბლიანი'];if(code<=48)return ['🌫️','ნისლი'];if(code<=67)return ['🌧️','წვიმა'];if(code<=77)return ['🌨️','თოვლი'];if(code<=82)return ['🌦️','ხანმოკლე წვიმა'];if(code<=86)return ['🌨️','თოვლი'];return ['⛈️','ჭექა-ქუხილი'];}
async function getJSON(url,signal){const r=await fetch(url,{signal});if(!r.ok)throw new Error('API '+r.status);return r.json();}
function forecastURL(p){return 'https://api.open-meteo.com/v1/forecast?'+new URLSearchParams({latitude:p.latitude,longitude:p.longitude,current:'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure',hourly:'precipitation_probability',daily:'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',timezone:'auto',forecast_days:6});}
async function loadCity(p){locationIntent++;const id=++requestId;weatherController?.abort();weatherController=new AbortController();$('#status').className='';$('#status').textContent=`${p.name} — მონაცემები იტვირთება…`;$('#forecast').setAttribute('aria-busy','true');try{const data=await getJSON(forecastURL(p),weatherController.signal);if(id!==requestId)return;selected=p;render(data);updateSaveButton();$('#location').textContent=[p.name,p.country].filter(Boolean).join(', ');$('#status').textContent=`განახლებულია ${data.current.time.slice(11,16)} · ქალაქის ადგილობრივი დრო`;try{if (!p.isLocation) localStorage.setItem('weather-city',JSON.stringify(p));}catch{}}catch(e){if(e.name==='AbortError'||id!==requestId)return;$('#status').className='error';$('#status').replaceChildren(document.createTextNode('ამინდი ვერ ჩაიტვირთა. შეამოწმე ინტერნეტი. '));const retry=document.createElement('button');retry.textContent='ხელახლა ცდა';retry.onclick=()=>loadCity(p);$('#status').append(retry);}finally{if(id===requestId)$('#forecast').setAttribute('aria-busy','false');}}
function render(d){hideForecastDetail();const c=d.current, daily=d.daily,[icon,label]=weather(c.weather_code,c.is_day);$('#forecast').innerHTML=`<article class="current"><div class="card-top"><span>დღეს</span><span>${c.time.slice(11,16)}</span></div><div class="current-main"><span class="temperature">${num(c.temperature_2m)}°</span><span class="weather-icon" aria-hidden="true">${icon}</span></div><p class="condition">${label}</p><div class="metrics"><div><span>შეგრძნებით</span><b>${num(c.apparent_temperature)}°</b></div><div><span>ქარი</span><b>${num(c.wind_speed_10m)} კმ/სთ</b></div><div><span>ტენიანობა</span><b>${num(c.relative_humidity_2m)}%</b></div><div><span>მზის ჩასვლა</span><b>${daily.sunset[0].slice(11,16)}</b></div></div></article>`+daily.time.slice(1,6).map((date,i)=>{const j=i+1,[symbol,description]=weather(daily.weather_code[j]);return `<article class="day"><div><div class="day-name">${new Intl.DateTimeFormat('ka',{weekday:'short'}).format(new Date(date+'T12:00:00'))}</div><div class="date">${date.slice(8)}.${date.slice(5,7)}</div></div><span class="weather-icon" role="img" aria-label="${description}">${symbol}</span><div><div class="high">${num(daily.temperature_2m_max[j])}°</div><div class="low">${num(daily.temperature_2m_min[j])}°</div></div></article>`;}).join('');attachForecastDetails(d);const today=c.time.slice(0,10);const hours=[6,9,12,15,18,21];$('#rain').innerHTML=hours.map(hour=>{const t=`${today}T${String(hour).padStart(2,'0')}:00`,i=d.hourly.time.indexOf(t),v=i<0?null:d.hourly.precipitation_probability[i];return `<div class="rain-bar"><b>${num(v)}${v==null?'':'%'}</b><div class="bar-track"><div class="bar-fill" style="height:${v??0}%"></div></div><small>${hour}:00</small></div>`;}).join('');}
$('#search-form').addEventListener('submit',async e=>{e.preventDefault();const query=$('#search').value.trim();if(query.length<2)return;const id=++searchId;searchController?.abort();searchController=new AbortController();const box=$('#results');box.hidden=false;box.innerHTML='<p>ვეძებთ ქალაქს…</p>';try{const data=await getJSON('https://geocoding-api.open-meteo.com/v1/search?'+new URLSearchParams({name:query,count:6,language:'ka',format:'json'}),searchController.signal);if(id!==searchId)return;box.replaceChildren();if(!data.results?.length){box.innerHTML='<p>ქალაქი ვერ მოიძებნა. სცადე სხვა სახელი.</p>';return;}data.results.forEach(p=>{const b=document.createElement('button');b.type='button';b.textContent=[p.name,p.admin1,p.country].filter(Boolean).join(', ');b.onclick=()=>{box.hidden=true;$('#search').value='';loadCity(p);};box.append(b);});}catch(e){if(e.name!=='AbortError'&&id===searchId)box.innerHTML='<p>ძებნა ვერ შესრულდა. სცადე ხელახლა.</p>';}});
$('#search').addEventListener('input',()=>{searchId++;searchController?.abort();$('#results').hidden=true;});
document.addEventListener('click',e=>{if(!$('#search-form').contains(e.target))$('#results').hidden=true;});document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#results').hidden=true;});
$('#theme').onclick=()=>{const light=document.body.classList.toggle('light');$('#theme').setAttribute('aria-label',light?'მუქი თემის ჩართვა':'ღია თემის ჩართვა');try{localStorage.setItem('weather-theme',light?'light':'dark');}catch{}};
$('#explore').onclick=()=>{$('#search').focus();$('#search').scrollIntoView({behavior:'smooth',block:'center'});};
places.forEach((p,i)=>{const b=document.createElement('button');b.className='map-pin';b.style.left=`${(p.longitude+180)/360*100}%`;b.style.top=`${(90-p.latitude)/180*100}%`;b.setAttribute('aria-label',p.name);b.textContent='⌖';b.onclick=()=>loadCity(p);$('#map-pins').append(b);});

try{const saved=JSON.parse(localStorage.getItem('weather-city'));if(saved&&typeof saved.name==='string'&&Number.isFinite(saved.latitude)&&Number.isFinite(saved.longitude))selected=saved;if(localStorage.getItem('weather-theme')==='light')$('#theme').click();}catch{}

// Forecast cards start compact; the active card reveals its details in place.
let activeForecastCard = null, forecastCloseTimer;
function hideForecastDetail() {
  clearTimeout(forecastCloseTimer);
  if (!activeForecastCard) return;
  activeForecastCard.classList.remove('is-expanded');
  activeForecastCard.setAttribute('aria-expanded', 'false');
  activeForecastCard.querySelector('.card-summary').hidden = false;
  activeForecastCard.querySelector('.card-expanded').hidden = true;
  activeForecastCard = null;
}
function attachForecastDetails(data) {
  const day = data.daily;
  document.querySelectorAll('#forecast > article').forEach((card, index) => {
    const today = index === 0;
    const date = day.time[index];
    const title = today ? 'დღეს' : new Intl.DateTimeFormat('ka', {weekday:'short'}).format(new Date(date + 'T12:00:00'));
    const [icon, description] = weather(today ? data.current.weather_code : day.weather_code[index], today ? data.current.is_day : 1);
    const temperature = num(today ? data.current.temperature_2m : day.temperature_2m_max[index]);
    const time = value => value ? value.slice(11,16) : '—';
    const details = today ? card.innerHTML : `<div class="card-top"><span>${title}</span><span>${date.slice(8)}.${date.slice(5,7)}</span></div><div class="current-main"><span class="temperature">${temperature}°</span><span class="weather-icon" aria-hidden="true">${icon}</span></div><p class="condition">${description}</p><div class="metrics"><div><span>მაქსიმუმი</span><b>${num(day.temperature_2m_max[index])}°</b></div><div><span>მინიმუმი</span><b>${num(day.temperature_2m_min[index])}°</b></div><div><span>მზის ამოსვლა</span><b>${time(day.sunrise[index])}</b></div><div><span>მზის ჩასვლა</span><b>${time(day.sunset[index])}</b></div></div>`;
    card.className = 'forecast-card';
    card.innerHTML = `<div class="card-summary"><div><div class="day-name">${title}</div><div class="date">${date.slice(8)}.${date.slice(5,7)}</div></div><span class="weather-icon" aria-hidden="true">${icon}</span><div><div class="high">${temperature}°</div><div class="low">${num(day.temperature_2m_min[index])}°</div></div></div><div class="card-expanded" hidden>${details}</div>`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${title}, ${date} — ამინდის დეტალები`);
    card.setAttribute('aria-expanded', 'false');
    const show = () => {
      clearTimeout(forecastCloseTimer);
      if (activeForecastCard === card) return;
      hideForecastDetail();
      activeForecastCard = card;
      card.classList.add('is-expanded');
      card.setAttribute('aria-expanded', 'true');
      card.querySelector('.card-summary').hidden = true;
      card.querySelector('.card-expanded').hidden = false;
    };
    card.addEventListener('mouseenter', show);
    card.addEventListener('mouseover', show);
    card.addEventListener('mouseleave', () => { forecastCloseTimer = setTimeout(() => { if (activeForecastCard === card) hideForecastDetail(); }, 100); });
    card.addEventListener('focus', show);
    card.addEventListener('blur', () => { if (activeForecastCard === card) hideForecastDetail(); });
    card.addEventListener('click', show);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(); }
    });
  });
}
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('#forecast > article')) hideForecastDetail();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') hideForecastDetail(); });


const suggestedCities = [
  ...places.slice(1),
  {name:'ბათუმი',country:'საქართველო',latitude:41.6461,longitude:41.6405},
  {name:'ქუთაისი',country:'საქართველო',latitude:42.2679,longitude:42.6946},
  {name:'პარიზი',country:'საფრანგეთი',latitude:48.8566,longitude:2.3522},
  {name:'ბერლინი',country:'გერმანია',latitude:52.52,longitude:13.405},
  {name:'რომი',country:'იტალია',latitude:41.9028,longitude:12.4964},
  {name:'სტამბოლი',country:'თურქეთი',latitude:41.0082,longitude:28.9784},
  {name:'ბარსელონა',country:'ესპანეთი',latitude:41.3874,longitude:2.1686},
  {name:'დუბაი',country:'არაბთა გაერთიანებული საამიროები',latitude:25.2048,longitude:55.2708},
  {name:'სიდნეი',country:'ავსტრალია',latitude:-33.8688,longitude:151.2093}
];
const cityKey = p => `${Number(p.latitude).toFixed(2)},${Number(p.longitude).toFixed(2)}`;
let savedCities = [], shownCities = 3;
try {
  const saved = JSON.parse(localStorage.getItem('weather-favorites'));
  if (Array.isArray(saved)) savedCities = saved.filter(p => p && typeof p.name === 'string' && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && !p.isLocation);
} catch {}
const cityWeatherCache = new Map();
function isSaved(p) { return savedCities.some(city => cityKey(city) === cityKey(p)); }
function updateSaveButton() {
  const button = $('#save-city');
  button.disabled = !!selected.isLocation;
  button.textContent = selected.isLocation ? `⌖ ${selected.name}` : isSaved(selected) ? '★ შენახულია' : '☆ ქალაქის შენახვა';
  button.setAttribute('aria-pressed', String(isSaved(selected)));
}
function toggleSavedCity(p) {
  const remove = isSaved(p);
  const next = remove ? savedCities.filter(city => cityKey(city) !== cityKey(p)) : [...savedCities, {name:p.name,country:p.country || '',latitude:p.latitude,longitude:p.longitude}];
  try {
    localStorage.setItem('weather-favorites', JSON.stringify(next));
    savedCities = next;
    $('#city-feedback').textContent = remove ? `${p.name} სიიდან წაიშალა.` : `${p.name} შენახულია ამ ბრაუზერში.`;
    updateSaveButton();
    renderCityList();
  } catch { $('#city-feedback').textContent = 'ქალაქი ვერ შეინახა. ბრაუზერში მონაცემების შენახვა შეზღუდულია.'; }
}
function cityWeather(p) {
  const key = cityKey(p);
  if (!cityWeatherCache.has(key)) {
    const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({latitude:p.latitude,longitude:p.longitude,current:'temperature_2m,weather_code,is_day',timezone:'auto'});
    cityWeatherCache.set(key, getJSON(url).catch(error => {cityWeatherCache.delete(key);throw error;}));
  }
  return cityWeatherCache.get(key);
}
function renderCityList() {
  const container = $('#cities');
  container.replaceChildren();
  const groups = [ ['შენახული ქალაქები', savedCities], ['აღმოაჩინე ქალაქები', suggestedCities.slice(0,shownCities).filter(p => !isSaved(p))] ];
  groups.forEach(([title, cities]) => {
    if (!cities.length) return;
    const heading = document.createElement('h3');
    heading.className = 'city-group-title'; heading.textContent = title; container.append(heading);
    cities.forEach(async p => {
      const item = document.createElement('div'); item.className = 'city-item';
      const button = document.createElement('button'); button.className = 'city';
      button.innerHTML = `<div><small>${escapeHTML(p.country || '')}</small><h3>${escapeHTML(p.name)}</h3><p>იტვირთება…</p></div><div class="city-right">—</div>`;
      button.onclick = () => loadCity(p);
      const star = document.createElement('button');star.className = 'city-save';
      star.textContent = isSaved(p) ? '★' : '☆';
      star.setAttribute('aria-label', `${p.name} — ${isSaved(p) ? 'შენახულებიდან წაშლა' : 'შენახვა'}`);
      star.setAttribute('aria-pressed', String(isSaved(p)));star.onclick = () => toggleSavedCity(p);
      item.append(button,star);container.append(item);
      try {
        const d = await cityWeather(p);const [icon,label] = weather(d.current.weather_code,d.current.is_day);
        button.querySelector('p').textContent=label;
        button.querySelector('.city-right').innerHTML=`<span class="weather-icon" aria-hidden="true">${icon}</span><div class="city-temp">${num(d.current.temperature_2m)}°</div>`;
        const pinIndex = places.findIndex(city => cityKey(city) === cityKey(p));
        if(pinIndex >= 0) document.querySelectorAll('.map-pin')[pinIndex].textContent=icon;
      } catch { button.querySelector('p').textContent='სანახავად აირჩიე'; }
    });
  });
  $('#more-cities').hidden = shownCities >= suggestedCities.length;
}
$('#save-city').onclick = () => { if (!selected.isLocation) toggleSavedCity(selected); };
$('#find-city').onclick = () => { $('#search').focus();$('#search').scrollIntoView({behavior:'smooth',block:'center'}); };
$('#more-cities').onclick = () => { shownCities += 3;renderCityList(); };
const locationDialog = $('#location-dialog');
function rememberLocationChoice() { try { localStorage.setItem('weather-location-asked','yes'); } catch {} }
async function resolveLocationName(latitude, longitude) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const data = await getJSON('https://api.bigdatacloud.net/data/reverse-geocode-client?' + new URLSearchParams({latitude, longitude, localityLanguage:'ka'}), controller.signal);
    const name = [data.city, data.locality, data.principalSubdivision].find(value => typeof value === 'string' && value.trim());
    return name ? {name:name.trim(), country:typeof data.countryName === 'string' ? data.countryName : ''} : null;
  } catch { return null; }
  finally { clearTimeout(timeout); }
}
function useLocation() {
  rememberLocationChoice();locationDialog.close();
  const intent = ++locationIntent;
  const button = $('#locate');button.disabled=true;
  $('#status').className='';$('#status').textContent='შენი მდებარეობა იძებნება…';
  const failed = message => {
    button.disabled=false;
    if (intent !== locationIntent) return;
    $('#status').className='error';$('#status').textContent=message;
  };
  if (!navigator.geolocation) { failed('ბრაუზერს მდებარეობის განსაზღვრა არ შეუძლია. მოძებნე ქალაქი.');return; }
  navigator.geolocation.getCurrentPosition(async position => {
    button.disabled=false;
    if (intent !== locationIntent) return;
    const {latitude, longitude} = position.coords;
    const place = {name:`მდებარეობა ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,country:'',latitude,longitude,isLocation:true};
    const weatherReady = loadCity(place);
    const currentIntent = locationIntent;
    const label = await resolveLocationName(latitude, longitude);
    await weatherReady;
    if (currentIntent !== locationIntent || selected !== place || !label) return;
    place.name = label.name;
    place.country = label.country;
    $('#location').textContent = [place.name, place.country].filter(Boolean).join(', ');
    updateSaveButton();
  }, error => {
    failed(error.code === 1 ? 'მდებარეობის ნებართვა არ გაიცა. ბრაუზერში საიტის პარამეტრებიდან დაუშვი მდებარეობა და ხელახლა დააჭირე „მდებარეობის ნებართვას“.' : 'მდებარეობა ვერ განისაზღვრა. სცადე ხელახლა ან მოძებნე ქალაქი.');
  }, {enableHighAccuracy:false,timeout:12000,maximumAge:300000});
}
$('#location-permission').onclick = () => locationDialog.showModal();
$('#locate').onclick = useLocation;
$('#allow-location').onclick = useLocation;
$('#skip-location').onclick = () => { rememberLocationChoice();locationDialog.close(); };
locationDialog.addEventListener('cancel',rememberLocationChoice);
renderCityList();
// Map weather is loaded independently of the sidebar city selection.
places.forEach(async (place, index) => {
  try {
    const data = await cityWeather(place);
    const [icon] = weather(data.current.weather_code, data.current.is_day);
    document.querySelectorAll('.map-pin')[index].textContent = icon;
  } catch { /* Keep the location marker clickable if weather is unavailable. */ }
});
loadCity(selected);
try { if (!localStorage.getItem('weather-location-asked')) locationDialog.showModal(); } catch { locationDialog.showModal(); }
