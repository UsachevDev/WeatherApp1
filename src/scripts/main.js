/* =========================================================================
 * WeatherApp — vanilla JS weather dashboard
 * Data: Open-Meteo (forecast + geocoding), BigDataCloud (reverse geocoding)
 * ========================================================================= */

/* ========== tiny DOM helpers ========== */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

/* ========== inline icons (currentColor) ========== */
const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg>`,
  pin: `<svg class="pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>`,
  humidity: `<svg class="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 6.3 6 10a6 6 0 1 1-12 0c0-3.7 6-10 6-10z"/></svg>`,
  wind: `<svg class="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h8"/></svg>`,
  pressure: `<svg class="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12 9 9"/><path d="M4.6 19a9 9 0 1 1 14.8 0z"/></svg>`,
  visibility: `<svg class="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
  sunrise: `<svg class="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M5.6 9.6 4 8M18.4 9.6 20 8M2 18h20M8 18a4 4 0 0 1 8 0M9 7l3-3 3 3"/></svg>`,
  sunset: `<svg class="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7V3M5.6 9.6 4 8M18.4 9.6 20 8M2 18h20M8 18a4 4 0 0 1 8 0M9 4l3 3 3-3"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.555-1.11-4.555-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg>`,
};

/* ========== weather code → description / icon / palette group ========== */
const CODE_INFO = {
  0:  { desc: "Clear sky",            group: "clear",   icon: "01" },
  1:  { desc: "Mainly clear",         group: "clear",   icon: "02" },
  2:  { desc: "Partly cloudy",        group: "clouds",  icon: "03" },
  3:  { desc: "Overcast",             group: "clouds",  icon: "04" },
  45: { desc: "Fog",                  group: "fog",     icon: "50" },
  48: { desc: "Rime fog",             group: "fog",     icon: "50" },
  51: { desc: "Light drizzle",        group: "drizzle", icon: "09" },
  53: { desc: "Drizzle",              group: "drizzle", icon: "09" },
  55: { desc: "Dense drizzle",        group: "drizzle", icon: "09" },
  56: { desc: "Freezing drizzle",     group: "drizzle", icon: "09" },
  57: { desc: "Freezing drizzle",     group: "drizzle", icon: "09" },
  61: { desc: "Light rain",           group: "rain",    icon: "10" },
  63: { desc: "Rain",                 group: "rain",    icon: "10" },
  65: { desc: "Heavy rain",           group: "rain",    icon: "10" },
  66: { desc: "Freezing rain",        group: "rain",    icon: "10" },
  67: { desc: "Freezing rain",        group: "rain",    icon: "10" },
  71: { desc: "Light snow",           group: "snow",    icon: "13" },
  73: { desc: "Snow",                 group: "snow",    icon: "13" },
  75: { desc: "Heavy snow",           group: "snow",    icon: "13" },
  77: { desc: "Snow grains",          group: "snow",    icon: "13" },
  80: { desc: "Rain showers",         group: "rain",    icon: "09" },
  81: { desc: "Rain showers",         group: "rain",    icon: "09" },
  82: { desc: "Violent showers",      group: "rain",    icon: "09" },
  85: { desc: "Snow showers",         group: "snow",    icon: "13" },
  86: { desc: "Snow showers",         group: "snow",    icon: "13" },
  95: { desc: "Thunderstorm",         group: "thunder", icon: "11" },
  96: { desc: "Thunderstorm, hail",   group: "thunder", icon: "11" },
  99: { desc: "Thunderstorm, hail",   group: "thunder", icon: "11" },
};
const codeInfo = (c) => CODE_INFO[c] || CODE_INFO[0];
const iconCode = (c, isDay) => `${codeInfo(c).icon}${isDay ? "d" : "n"}`;

function setWeatherIcon(imgEl, code, isDay) {
  const ic = iconCode(code, isDay);
  const png = `../public/images/icons/weather/${ic}.png`;
  imgEl.onerror = () => {
    imgEl.onerror = null;
    imgEl.src = `../public/images/icons/weather/${isDay ? "01d" : "01n"}.png`;
  };
  imgEl.src = png;
}

/* ========== units ========== */
const UNITS = {
  metric: {
    temp: "celsius", wind: "ms", precip: "mm",
    windLabel: "m/s", visLabel: "km", presLabel: "hPa", precipLabel: "mm",
  },
  imperial: {
    temp: "fahrenheit", wind: "mph", precip: "inch",
    windLabel: "mph", visLabel: "mi", presLabel: "inHg", precipLabel: "in",
  },
};
const fmtPressure = (hPa, u) =>
  u === "imperial" ? (hPa * 0.02953).toFixed(2) : String(Math.round(hPa));
const fmtVisibility = (m, u) =>
  u === "imperial" ? (m / 1609.34).toFixed(1) : String(Math.round(m / 1000));

/* ========== temperature → color ========== */
const toCelsius = (t, u) => (u === "imperial" ? (t - 32) * (5 / 9) : t);
// stops: [°C, [r, g, b]] from cold to hot
const TEMP_STOPS = [
  [-20, [120, 86, 255]], // violet
  [-10, [70, 110, 245]], // indigo
  [0,   [56, 150, 255]], // blue
  [6,   [56, 196, 248]], // sky
  [12,  [45, 212, 191]], // teal
  [17,  [120, 205, 90]], // green
  [22,  [232, 213, 74]], // yellow
  [27,  [251, 150, 60]], // orange
  [33,  [245, 85, 60]],  // red
  [40,  [205, 50, 90]],  // crimson
];
function tempColor(t, units = state.units) {
  const c = toCelsius(t, units);
  const s = TEMP_STOPS;
  if (c <= s[0][0]) return `rgb(${s[0][1].join(",")})`;
  if (c >= s[s.length - 1][0]) return `rgb(${s[s.length - 1][1].join(",")})`;
  for (let i = 0; i < s.length - 1; i++) {
    const [c0, a] = s[i];
    const [c1, b] = s[i + 1];
    if (c >= c0 && c <= c1) {
      const k = (c - c0) / (c1 - c0);
      const ch = (j) => Math.round(a[j] + (b[j] - a[j]) * k);
      return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`;
    }
  }
  return "rgb(245,245,245)";
}

/* ========== app state ========== */
const state = {
  units: localStorage.getItem("units") || "metric",
  geo: null,  // { lat, lon, name, tz }
  data: null, // last fetched forecast payload
};

/* ========== date / number formatting ========== */
const fmtLongDate = (now, tz) => {
  const d = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: tz,
  }).format(now);
  const t = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: tz,
  }).format(now);
  return `${d} · ${t}`;
};
const fmtHM = (date, tz) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(date);
const fmtHour = (date, tz) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone: tz }).format(date);

// `ts` is a unix timestamp in seconds (Open-Meteo timeformat=unixtime)
function dayLabel(ts, idx, tz) {
  const d = new Date(ts * 1000);
  if (idx === 0) return { main: "Today", sub: shortDate(d, tz) };
  if (idx === 1) return { main: "Tomorrow", sub: shortDate(d, tz) };
  return {
    main: new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: tz }).format(d),
    sub: shortDate(d, tz),
  };
}
const shortDate = (d, tz) =>
  new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: tz }).format(d);

/* ========== API ========== */
// fetch + JSON with a hard timeout so the UI can never hang forever
async function fetchJSON(url, { timeout = 12000, signal } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(
    () => ctrl.abort(new DOMException("Request timed out", "TimeoutError")),
    timeout
  );
  if (signal) signal.addEventListener("abort", () => ctrl.abort(signal.reason));
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`Service error (HTTP ${r.status})`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

async function geocodeSearch(query, count = 1) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`;
  const j = await fetchJSON(url, { timeout: 10000 });
  if (!j.results || !j.results.length) throw new Error(`No results for “${query}”`);
  return j.results;
}

async function reverseGeocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const j = await fetchJSON(url, { timeout: 8000 });
    return j.city || j.locality || j.principalSubdivision || "Your location";
  } catch {
    return "Your location";
  }
}

async function fetchWeather(lat, lon, tz, units) {
  const u = UNITS[units];
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m,pressure_msl,visibility` +
    `&hourly=temperature_2m,apparent_temperature,weather_code,is_day,precipitation_probability,relative_humidity_2m,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
    `&forecast_days=7&temperature_unit=${u.temp}&wind_speed_unit=${u.wind}&precipitation_unit=${u.precip}` +
    `&timeformat=unixtime&timezone=${encodeURIComponent(tz)}`;
  return fetchJSON(url, { timeout: 12000 });
}

/* ========== toast ========== */
let toastTimer = null;
function hideToast() {
  $("#toast").classList.remove("is-visible");
}
function showToast(message, type = "info", action = null) {
  const t = $("#toast");
  t.innerHTML = "";
  t.dataset.type = type;
  t.append(el("span", "toast__msg", message));
  clearTimeout(toastTimer);
  if (action) {
    const btn = el("button", "toast__action", action.label);
    btn.addEventListener("click", () => { hideToast(); action.onClick(); });
    t.append(btn);
    t.classList.add("is-visible"); // stays until the user acts
  } else {
    t.classList.add("is-visible");
    toastTimer = setTimeout(hideToast, 4000);
  }
}

/* ========== loading state ========== */
function setLoading(on) {
  const stage = $(".stage");
  if (!stage) return;
  stage.classList.toggle("is-loading", on);
  const targets = [
    ".weather__city", ".weather__date", ".weather__temp",
    ".weather__status", ".weather__sub",
  ];
  targets.forEach((sel) => {
    const node = $(sel);
    if (node) node.classList.toggle("skeleton", on);
  });
  document.querySelectorAll(".card__value").forEach((n) => n.classList.toggle("skeleton", on));
}

/* ========== render: weather panel ========== */
function renderWeather(data, geo) {
  const c = data.current;
  const isDay = c.is_day === 1;
  const info = codeInfo(c.weather_code);
  const now = new Date();

  // background palette
  document.body.dataset.weather = info.group;
  document.body.dataset.time = isDay ? "day" : "night";

  $(".weather__city").textContent = geo.name;
  $(".weather__date").textContent = fmtLongDate(now, geo.tz);
  $(".weather__temp").textContent = `${Math.round(c.temperature_2m)}°`;
  $(".weather__status").textContent = info.desc;

  const icon = $(".weather__icon");
  setWeatherIcon(icon, c.weather_code, isDay);
  icon.alt = info.desc;

  const hi = Math.round(data.daily.temperature_2m_max[0]);
  const lo = Math.round(data.daily.temperature_2m_min[0]);
  $(".weather__sub").innerHTML =
    `Feels like <b>${Math.round(c.apparent_temperature)}°</b>` +
    `<span>H:<b>${hi}°</b> &nbsp; L:<b>${lo}°</b></span>`;
}

/* ========== render: metric cards ========== */
function renderCards(data) {
  const c = data.current;
  const u = state.units;
  const cfg = UNITS[u];
  const set = (key, value, unit) => {
    const node = document.querySelector(`.card__value[data-field="${key}"]`);
    if (node) node.innerHTML = unit ? `${value}<small>${unit}</small>` : value;
  };
  set("humidity", Math.round(c.relative_humidity_2m), "%");
  set("wind", Math.round(c.wind_speed_10m), cfg.windLabel);
  set("pressure", fmtPressure(c.pressure_msl, u), cfg.presLabel);
  set("visibility", fmtVisibility(c.visibility ?? 0, u), cfg.visLabel);
  const tz = data.tz ?? state.geo.tz;
  set("sunrise", fmtHM(new Date(data.daily.sunrise[0] * 1000), tz), "");
  set("sunset", fmtHM(new Date(data.daily.sunset[0] * 1000), tz), "");
}

/* ========== render: hourly slider ========== */
function renderHourly(data, geo) {
  const list = $(".slider__list");
  list.innerHTML = "";
  const { time, temperature_2m, weather_code, is_day } = data.hourly;
  const nowTs = Date.now();
  let count = 0;
  let firstFuture = true;
  for (let i = 0; i < time.length && count < 24; i++) {
    const ts = time[i] * 1000;
    if (ts < nowTs - 3600000) continue;
    const d = new Date(ts);
    const li = el("li", "slider__item");
    if (firstFuture) {
      li.classList.add("is-now");
      firstFuture = false;
    }
    const label = count === 0 ? "Now" : fmtHour(d, geo.tz);
    const img = el("img", "slider__icon");
    setWeatherIcon(img, weather_code[i], is_day[i] === 1);
    img.alt = "";
    const temp = el("div", "slider__temp", `${Math.round(temperature_2m[i])}°`);
    temp.style.color = tempColor(temperature_2m[i]);
    li.append(el("div", "slider__time", label), img, temp);
    list.append(li);
    count++;
  }
}

/* ========== render: 7-day forecast ========== */
function renderDaily(data) {
  const list = $(".daily__list");
  list.innerHTML = "";
  const d = data.daily;
  const maxes = d.temperature_2m_max.map(Math.round);
  const mins = d.temperature_2m_min.map(Math.round);
  const globalMin = Math.min(...mins);
  const globalMax = Math.max(...maxes);
  const span = Math.max(globalMax - globalMin, 1);

  const tz = data.tz ?? state.geo.tz;
  d.time.forEach((ts, i) => {
    const info = codeInfo(d.weather_code[i]);
    const lbl = dayLabel(ts, i, tz);
    const lo = mins[i];
    const hi = maxes[i];
    const left = ((lo - globalMin) / span) * 100;
    const width = ((hi - lo) / span) * 100;

    const item = el("div", "daily__item");
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `${lbl.main} forecast details`);
    item.dataset.index = String(i);
    const open = () => openDayDetail(i);
    item.addEventListener("click", open);
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });

    const day = el("div", "daily__day");
    day.innerHTML = `${lbl.main}<span>${lbl.sub}</span>`;

    const cond = el("div", "daily__cond");
    const img = el("img", "daily__icon");
    setWeatherIcon(img, d.weather_code[i], true);
    img.alt = info.desc;
    img.title = info.desc;
    cond.append(img);

    const range = el("div", "daily__range");
    const fill = el("span", "daily__fill");
    fill.style.left = `${left}%`;
    fill.style.width = `${Math.max(width, 6)}%`;
    fill.style.background = `linear-gradient(90deg, ${tempColor(lo)}, ${tempColor(hi)})`;
    const track = el("div", "daily__track");
    track.append(fill);
    const loEl = el("span", "daily__lo", `${lo}°`);
    const hiEl = el("span", "daily__hi", `${hi}°`);
    hiEl.style.color = tempColor(hi);
    range.append(loEl, track, hiEl);

    const chev = el("span", "daily__chev",
      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>`);

    item.append(day, cond, range, chev);
    list.append(item);
  });
}

/* ========== day detail modal ========== */
function openDayDetail(index) {
  const data = state.data;
  if (!data) return;
  const d = data.daily;
  const tz = data.tz ?? state.geo.tz;
  const u = UNITS[state.units];
  const info = codeInfo(d.weather_code[index]);
  const lbl = dayLabel(d.time[index], index, tz);
  const hi = Math.round(d.temperature_2m_max[index]);
  const lo = Math.round(d.temperature_2m_min[index]);

  // hours belonging to this day
  const dayStart = d.time[index];
  const dayEnd = dayStart + 86400;
  const h = data.hourly;
  const hours = [];
  for (let i = 0; i < h.time.length; i++) {
    if (h.time[i] >= dayStart && h.time[i] < dayEnd) hours.push(i);
  }

  const overlay = el("div", "modal");
  const card = el("div", "modal__card");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-modal", "true");
  card.setAttribute("aria-label", `${lbl.main} forecast`);

  /* header */
  const close = el("button", "modal__close",
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`);
  close.setAttribute("aria-label", "Close");

  const header = el("div", "modal__header");
  const htext = el("div");
  htext.innerHTML = `<div class="modal__day">${lbl.main}</div><div class="modal__sub">${lbl.sub} · ${info.desc}</div>`;
  const hicon = el("img", "modal__icon");
  setWeatherIcon(hicon, d.weather_code[index], true);
  hicon.alt = info.desc;
  const htemp = el("div", "modal__temp");
  htemp.innerHTML =
    `<span style="color:${tempColor(d.temperature_2m_max[index])}">${hi}°</span>` +
    `<span class="modal__lo">${lo}°</span>`;
  header.append(htext, hicon, htemp);

  /* metrics */
  const metrics = el("div", "modal__metrics");
  const mk = (label, value) => {
    const m = el("div", "modal__metric");
    m.innerHTML = `<span class="modal__metric-label">${label}</span><span class="modal__metric-value">${value}</span>`;
    return m;
  };
  metrics.append(
    mk("Precipitation", `${(d.precipitation_sum[index] ?? 0).toFixed(1)} ${u.precipLabel}`),
    mk("Chance of rain", `${d.precipitation_probability_max[index] ?? 0}%`),
    mk("Max wind", `${Math.round(d.wind_speed_10m_max[index])} ${u.windLabel}`),
    mk("UV index", `${Math.round(d.uv_index_max[index] ?? 0)} · ${uvLabel(d.uv_index_max[index])}`),
    mk("Sunrise", fmtHM(new Date(d.sunrise[index] * 1000), tz)),
    mk("Sunset", fmtHM(new Date(d.sunset[index] * 1000), tz)),
  );

  /* hourly strip for the day */
  const hoursTitle = el("div", "modal__section-title", "Hourly");
  const hoursWrap = el("div", "modal__hours");
  hours.forEach((i) => {
    const cell = el("div", "modal__hour");
    const t = fmtHour(new Date(h.time[i] * 1000), tz);
    const img = el("img", "modal__hour-icon");
    setWeatherIcon(img, h.weather_code[i], h.is_day[i] === 1);
    img.alt = "";
    const temp = el("div", "modal__hour-temp", `${Math.round(h.temperature_2m[i])}°`);
    temp.style.color = tempColor(h.temperature_2m[i]);
    const pop = h.precipitation_probability?.[i] ?? 0;
    const rain = el("div", "modal__hour-pop", pop > 0 ? `${pop}%` : "");
    cell.append(el("div", "modal__hour-time", t), img, temp, rain);
    hoursWrap.append(cell);
  });

  card.append(close, header, metrics, hoursTitle, hoursWrap);
  overlay.append(card);
  document.body.append(overlay);
  void overlay.offsetWidth; // flush styles so the transition plays
  overlay.classList.add("is-open");

  const dismiss = () => {
    overlay.classList.remove("is-open");
    document.removeEventListener("keydown", onKey);
    setTimeout(() => overlay.remove(), 250);
  };
  const onKey = (e) => { if (e.key === "Escape") dismiss(); };
  close.addEventListener("click", dismiss);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) dismiss(); });
  document.addEventListener("keydown", onKey);
  close.focus();
}

const uvLabel = (uv) => {
  const v = uv ?? 0;
  if (v < 3) return "Low";
  if (v < 6) return "Moderate";
  if (v < 8) return "High";
  if (v < 11) return "Very high";
  return "Extreme";
};

/* ========== orchestration ========== */
async function loadWeather(geo) {
  setLoading(true);
  try {
    const data = await fetchWeather(geo.lat, geo.lon, geo.tz, state.units);
    data.tz = geo.tz;
    state.geo = geo;
    state.data = data;
    setLoading(false);
    renderWeather(data, geo);
    renderCards(data);
    renderHourly(data, geo);
    renderDaily(data);
    localStorage.setItem("lastGeo", JSON.stringify(geo));
  } catch (e) {
    setLoading(false);
    showToast(friendlyError(e), "error", { label: "Retry", onClick: () => loadWeather(geo) });
    console.error(e);
  }
}

// Map low-level errors to readable messages
function friendlyError(e) {
  if (e?.name === "TimeoutError" || e?.name === "AbortError")
    return "The weather service is taking too long to respond.";
  if (e instanceof TypeError)
    return "Couldn't connect — please check your internet connection.";
  return e?.message || "Something went wrong. Please try again.";
}

async function loadByCity(query) {
  try {
    const [g] = await geocodeSearch(query, 1);
    await loadWeather({ lat: g.latitude, lon: g.longitude, name: g.name, tz: g.timezone });
  } catch (e) {
    showToast(friendlyError(e), "error", { label: "Retry", onClick: () => loadByCity(query) });
  }
}

async function loadByGeolocation(btn) {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by your browser", "error");
    return;
  }
  btn.classList.add("is-busy");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const name = await reverseGeocode(lat, lon);
      btn.classList.remove("is-busy");
      await loadWeather({ lat, lon, name, tz });
    },
    () => {
      btn.classList.remove("is-busy");
      showToast("Could not get your location. Please allow access or search by city.", "error");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
  );
}

/* ========== autocomplete ========== */
let suggestAbort = null;
async function geocodeSuggest(q, count = 6) {
  if (suggestAbort) suggestAbort.abort();
  suggestAbort = new AbortController();
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=${count}&language=en&format=json`;
  const r = await fetch(url, { signal: suggestAbort.signal });
  const j = await r.json();
  return (j.results || []).map((g) => {
    const admin = g.admin1 ? `, ${g.admin1}` : "";
    const country = g.country ? `, ${g.country}` : "";
    return {
      name: g.name,
      display: `${g.name}${admin}${country}`,
      lat: g.latitude,
      lon: g.longitude,
      tz: g.timezone,
    };
  });
}

/* ========== UI builders ========== */
function buildHeader() {
  const header = el("header", "header");

  const logoLink = el("a", "header__logo-link");
  logoLink.href = "#";
  logoLink.setAttribute("aria-label", "WeatherApp home");
  const logo = el("img", "header__logo");
  logo.src = "../public/images/icons/logo.svg";
  logo.alt = "WeatherApp";
  logoLink.append(logo);

  /* --- search --- */
  const form = el("form", "search");
  form.setAttribute("role", "search");
  const field = el("div", "search__field");
  const input = el("input", "search__input");
  input.type = "text";
  input.placeholder = "Search for a city…";
  input.autocomplete = "off";
  input.setAttribute("aria-label", "Search for a city");

  const btnSubmit = el("button", "search__btn search__btn--submit", ICONS.search);
  btnSubmit.type = "submit";
  btnSubmit.setAttribute("aria-label", "Search");
  const btnClear = el("button", "search__btn search__btn--clear", ICONS.close);
  btnClear.type = "button";
  btnClear.setAttribute("aria-label", "Clear");

  field.append(input, btnSubmit, btnClear);

  const suggest = el("ul", "search__suggest");
  suggest.setAttribute("role", "listbox");
  form.append(field, suggest);

  wireSearch({ form, input, btnSubmit, btnClear, suggest });

  /* --- actions: geolocation + unit toggle --- */
  const actions = el("div", "header__actions");

  const geoBtn = el("button", "icon-btn", ICONS.location);
  geoBtn.type = "button";
  geoBtn.title = "Use my location";
  geoBtn.setAttribute("aria-label", "Use my location");
  geoBtn.addEventListener("click", () => loadByGeolocation(geoBtn));

  const toggle = el("div", "unit-toggle");
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Temperature units");
  const mkUnit = (unit, label) => {
    const b = el("button", "unit-toggle__btn", label);
    b.type = "button";
    b.dataset.unit = unit;
    if (state.units === unit) b.classList.add("is-active");
    b.addEventListener("click", () => switchUnits(unit, toggle));
    return b;
  };
  toggle.append(mkUnit("metric", "°C"), mkUnit("imperial", "°F"));

  actions.append(geoBtn, toggle);
  header.append(logoLink, form, actions);
  return header;
}

function switchUnits(unit, toggle) {
  if (unit === state.units) return;
  state.units = unit;
  localStorage.setItem("units", unit);
  toggle.querySelectorAll(".unit-toggle__btn").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.unit === unit)
  );
  if (state.geo) loadWeather(state.geo);
}

function wireSearch({ form, input, btnSubmit, btnClear, suggest }) {
  let items = [];
  let active = -1;

  const close = () => {
    suggest.innerHTML = "";
    suggest.classList.remove("is-open");
    items = [];
    active = -1;
  };
  const setActive = (idx) => {
    active = idx;
    [...suggest.children].forEach((n, i) => n.classList.toggle("is-active", i === idx));
  };
  const open = (list) => {
    suggest.innerHTML = "";
    list.forEach((it, idx) => {
      const li = el("li", "search__suggest-item", `${ICONS.pin}<span>${it.display}</span>`);
      li.setAttribute("role", "option");
      li.addEventListener("mouseenter", () => setActive(idx));
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        select(idx);
      });
      suggest.append(li);
    });
    suggest.classList.add("is-open");
  };
  const select = async (idx) => {
    const it = items[idx];
    if (!it) return;
    input.value = it.display;
    updateClear();
    close();
    await loadWeather(it);
  };
  const move = (dir) => {
    if (!items.length) return;
    active = (active + dir + items.length) % items.length;
    setActive(active);
  };

  const doSuggest = debounce(async (q) => {
    if (q.length < 2) return close();
    try {
      const list = await geocodeSuggest(q);
      if (!list.length) return close();
      items = list;
      active = -1;
      open(list);
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    }
  }, 280);

  const updateClear = () => {
    const has = !!input.value.trim();
    btnClear.classList.toggle("is-visible", has);
    btnSubmit.classList.toggle("is-hidden", has);
  };

  input.addEventListener("input", () => {
    updateClear();
    doSuggest(input.value.trim());
  });
  input.addEventListener("keydown", (e) => {
    const open = suggest.classList.contains("is-open");
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter" && open && active >= 0) { e.preventDefault(); select(active); }
    else if (e.key === "Escape") { close(); input.blur(); }
  });
  btnClear.addEventListener("click", () => {
    input.value = "";
    updateClear();
    close();
    input.focus();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    if (suggest.classList.contains("is-open") && active >= 0) select(active);
    else loadByCity(q);
    close();
  });
  document.addEventListener("click", (e) => {
    if (!form.contains(e.target)) close();
  });
}

function buildWeather() {
  const w = el("section", "weather u-rise");
  const head = el("div", "weather__head");
  head.append(el("div", "weather__city", "—"), el("div", "weather__date", "—"));

  const main = el("div", "weather__main");
  const icon = el("img", "weather__icon");
  icon.alt = "";
  const right = el("div");
  right.append(el("div", "weather__temp", "—"), el("div", "weather__status", "—"));
  main.append(icon, right);

  const sub = el("div", "weather__sub", "—");
  w.append(head, main, sub);
  return w;
}

const CARD_FIELDS = [
  ["humidity", "Humidity", ICONS.humidity],
  ["wind", "Wind", ICONS.wind],
  ["pressure", "Pressure", ICONS.pressure],
  ["visibility", "Visibility", ICONS.visibility],
  ["sunrise", "Sunrise", ICONS.sunrise],
  ["sunset", "Sunset", ICONS.sunset],
];

function buildCards() {
  const cards = el("aside", "cards u-rise");
  cards.style.animationDelay = "0.05s";
  CARD_FIELDS.forEach(([key, label, icon]) => {
    const card = el("div", "card");
    const head = el("div", "card__head", `${icon}<span class="card__title">${label}</span>`);
    const value = el("div", "card__value", "—");
    value.dataset.field = key;
    card.append(head, value);
    cards.append(card);
  });
  return cards;
}

function buildSection(titleText, listTag, listClass, blockClass, delay) {
  const sec = el("section", `${blockClass} u-rise`);
  sec.style.animationDelay = delay;
  const title = el("h2", "stage__section-title", titleText);
  const list = el(listTag, listClass);
  sec.append(title, list);
  return sec;
}

function buildFooter() {
  const f = el("footer", "stage__footer");
  const left = el("span", null, "Data by Open-Meteo · Built with vanilla JavaScript");
  const right = el("a", null, `${ICONS.github} <span>Source on GitHub</span>`);
  right.href = "https://github.com/UsachevDev/WeatherApp1";
  right.target = "_blank";
  right.rel = "noopener";
  right.style.display = "inline-flex";
  right.style.alignItems = "center";
  right.style.gap = "6px";
  f.append(left, right);
  return f;
}

/* ========== boot ========== */
function render() {
  const main = $("#main");
  const stage = el("section", "stage");

  stage.append(buildHeader());

  const grid = el("div", "stage__grid");
  grid.append(buildWeather(), buildCards());
  stage.append(grid);

  stage.append(buildSection("Hourly forecast", "ul", "slider__list", "slider", "0.1s"));
  stage.append(buildSection("7-day forecast", "div", "daily__list", "daily", "0.15s"));
  stage.append(buildFooter());

  main.append(stage);
}

render();

/* initial load: last location → default city */
(function start() {
  const saved = localStorage.getItem("lastGeo");
  if (saved) {
    try {
      loadWeather(JSON.parse(saved));
      return;
    } catch { /* fall through */ }
  }
  loadByCity("London");
})();
