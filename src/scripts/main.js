console.log("main.js loaded");

/* ========== utils ========== */
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const debounce = (fn, ms = 300) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};
const pad2 = (n) => String(n).padStart(2, "0");

/* ========== static assets ========== */
const paths = {
  logo: "../public/images/icons/logo.svg",
  search: "../public/images/icons/search.svg",
  close: "../public/images/icons/close.svg",
};

/* ========== app state ========== */
const state = {
  city: "Москва",
  date: "Суббота, 06 января, 11:29",
  temp: -7,
  status: "Облачно",
  feels: -11,
  tiles: 6,
  icon: "04d",

  humidity: null,   // %
  wind: null,       // м/с
  pressure: null,   // мм рт.ст.
  visibility: null, // км
  sunrise: null,    // HH:MM
  sunset: null,     // HH:MM

  hourly: []        // [{time:"HH:MM", temp, icon}]
};

/* ========== WEATHER API (Open-Meteo) ========== */
const WEATHER_MAP = [
  { codes: [0], desc: "Ясно", d: "01d", n: "01n" },
  { codes: [1], desc: "Малооблачно", d: "02d", n: "02n" },
  { codes: [2], desc: "Переменная облачность", d: "03d", n: "03n" },
  { codes: [3], desc: "Облачно", d: "04d", n: "04n" },
  { codes: [45, 48], desc: "Туман", d: "50d", n: "50n" },
  { codes: [51, 53, 55, 56, 57], desc: "Морось", d: "09d", n: "09n" },
  { codes: [61, 63, 65], desc: "Дождь", d: "10d", n: "10n" },
  { codes: [66, 67], desc: "Ледяной дождь", d: "10d", n: "10n" },
  { codes: [71, 73, 75, 77, 85, 86], desc: "Снег", d: "13d", n: "13n" },
  { codes: [80, 81, 82], desc: "Ливень", d: "09d", n: "09n" },
  { codes: [95, 96, 99], desc: "Гроза", d: "11d", n: "11n" },
];

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const iconBase = (code) => `../public/images/icons/weather/${code}`;
function setWeatherIcon(imgEl, code, isNight = false) {
  const tryOrder = [
    `${iconBase(code)}.svg`,
    `${iconBase(code)}.png`,
    `${iconBase(isNight ? "01n" : "01d")}.svg`,
  ];
  let i = 0;
  imgEl.onerror = () => {
    i += 1;
    if (i < tryOrder.length) imgEl.src = tryOrder[i];
    else imgEl.onerror = null;
  };
  imgEl.src = tryOrder[0];
}

function mapWeather(code, isDay) {
  for (const m of WEATHER_MAP) if (m.codes.includes(code)) {
    return { desc: m.desc, icon: isDay ? m.d : m.n, isNight: !isDay };
  }
  return { desc: "Ясно", icon: isDay ? "01d" : "01n", isNight: !isDay };
}

async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
  const r = await fetch(url);
  const j = await r.json();
  if (!j.results || !j.results.length) throw new Error("Город не найден");
  const g = j.results[0];
  return { lat: g.latitude, lon: g.longitude, name: g.name, tz: g.timezone };
}

async function fetchWeather(lat, lon, tz) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m,pressure_msl,visibility` +
    `&hourly=temperature_2m,weather_code,is_day` +
    `&daily=sunrise,sunset` +
    `&windspeed_unit=ms&temperature_unit=celsius&timezone=${encodeURIComponent(tz)}`;
  const r = await fetch(url);
  return r.json();
}

function formatCityDate(now, tz) {
  const dateFmt = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: tz,
  });
  const timeFmt = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
  return `${cap(dateFmt.format(now))}, ${timeFmt.format(now)}`;
}
const fmtHM = (date, tz) =>
  new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(date);

/* ========== UI updates ========== */
function updateWeatherUI() {
  const cityEl = $(".weather__city");
  const dateEl = $(".weather__date");
  const tempEl = $(".weather__temp");
  const statEl = $(".weather__status");
  const feelsEl = $(".weather__feels");
  const iconEl = $(".weather__icon");

  if (cityEl) cityEl.textContent = state.city;
  if (dateEl) dateEl.textContent = state.date;
  if (tempEl) tempEl.textContent = `${state.temp}°`;
  if (statEl) statEl.textContent = state.status;
  if (feelsEl) feelsEl.textContent = `Ощущается как: ${state.feels}°`;
  if (iconEl) setWeatherIcon(iconEl, state.icon, state.icon.endsWith("n"));
}

function updateCardsUI() {
  const set = (key, val) => {
    const node = document.querySelector(`.card__value[data-field="${key}"]`);
    if (node) node.textContent = val;
  };
  if (state.humidity != null) set("humidity", `${state.humidity}%`);
  if (state.wind != null) set("wind", `${state.wind} м/с`);
  if (state.pressure != null) set("pressure", `${state.pressure} мм рт.ст.`);
  if (state.visibility != null) set("visibility", `${state.visibility} км`);
  if (state.sunrise) set("sunrise", state.sunrise);
  if (state.sunset) set("sunset", state.sunset);
}

function updateSliderUI() {
  const list = $(".slider__list");
  if (!list) return;
  list.innerHTML = "";
  state.hourly.forEach(h => {
    const li = el("li", "slider__item");
    const t = el("div", "slider__time", h.time);
    const img = el("img", "slider__icon");
    setWeatherIcon(img, h.icon, h.icon.endsWith("n"));
    img.alt = "";
    const v = el("div", "slider__temp", `${h.temp > 0 ? "+" : ""}${h.temp}°`);
    li.append(t, img, v);
    list.append(li);
  });
}

async function loadWeatherByGeo(geo) {
  try {
    const w = await fetchWeather(geo.lat, geo.lon, geo.tz);
    const c = w.current;
    const mapped = mapWeather(c.weather_code, c.is_day === 1);
    const now = new Date();

    state.city = geo.name;
    state.date = formatCityDate(now, geo.tz);
    state.temp = Math.round(c.temperature_2m);
    state.feels = Math.round(c.apparent_temperature);
    state.status = mapped.desc;
    state.icon = mapped.icon;

    state.humidity = Math.round(c.relative_humidity_2m);
    state.wind = Math.round(c.wind_speed_10m);
    const pressureMm = c.pressure_msl * 0.75006;
    state.pressure = Math.round(pressureMm);
    const visKm = (c.visibility || 0) / 1000;
    state.visibility = Math.round(visKm);

    const sr = new Date(w.daily.sunrise[0]);
    const ss = new Date(w.daily.sunset[0]);
    state.sunrise = fmtHM(sr, geo.tz);
    state.sunset = fmtHM(ss, geo.tz);

    const times = w.hourly.time;
    const temps = w.hourly.temperature_2m;
    const wcode = w.hourly.weather_code;
    const isDay = w.hourly.is_day;
    const nowTs = Date.now();
    const next = [];
    for (let i = 0; i < times.length; i++) {
      const ts = Date.parse(times[i]);
      if (ts >= nowTs) {
        const local = new Date(ts);
        const mappedH = mapWeather(wcode[i], isDay[i] === 1);
        next.push({
          time: fmtHM(local, geo.tz),
          temp: Math.round(temps[i]),
          icon: mappedH.icon
        });
      }
      if (next.length >= 12) break;
    }
    state.hourly = next;

    updateWeatherUI();
    updateCardsUI();
    updateSliderUI();

    localStorage.setItem("lastCity", geo.name);
  } catch (e) {
    console.error(e.message || e);
  }
}

async function loadCityWeather(city) {
  try {
    const g = await geocodeCity(city);
    await loadWeatherByGeo(g);
  } catch (e) {
    console.error(e.message || e);
  }
}

/* ========== autocomplete ========== */
let suggestAbort = null;
async function geocodeSuggest(q, count = 7) {
  if (suggestAbort) suggestAbort.abort();
  suggestAbort = new AbortController();
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=${count}&language=ru&format=json`;
  const r = await fetch(url, { signal: suggestAbort.signal });
  const j = await r.json();
  const list = (j.results || []).map(g => {
    const name = g.name || "";
    const admin = g.admin1 ? `, ${g.admin1}` : "";
    const country = g.country ? `, ${g.country}` : "";
    return {
      name: g.name,
      display: `${name}${admin}${country}`,
      lat: g.latitude,
      lon: g.longitude,
      tz: g.timezone,
    };
  });
  return list;
}

/* ========== UI builders ========== */
function createHeaderNode() {
  const wrap = el("div", "stage__header");

  const logoLink = el("a", "header__logo-link");
  logoLink.href = "#";
  const logo = el("img", "header__logo");
  logo.src = paths.logo; logo.alt = "WeatherApp";
  logoLink.appendChild(logo);

  const form = el("form", "search");
  const input = el("input", "search__input");
  input.type = "text";
  input.placeholder = "Поиск по городу";
  input.autocomplete = "off";

  const ctrls = el("div", "search__controls");

  const btnSearch = el("button", "search__btn search__btn--submit");
  btnSearch.type = "submit";
  btnSearch.append(el("img"));
  btnSearch.firstChild.src = paths.search;
  btnSearch.firstChild.alt = "Найти";

  const btnClear = el("button", "search__btn search__btn--clear");
  btnClear.type = "button";
  btnClear.append(el("img"));
  btnClear.firstChild.src = paths.close;
  btnClear.firstChild.alt = "Очистить";

  ctrls.append(btnSearch, btnClear);
  form.append(input, ctrls);

  const list = el("ul", "search__suggest");
  list.setAttribute("role", "listbox");
  form.append(list);

  let sugg = [];
  let active = -1;

  const closeSuggest = () => {
    list.innerHTML = "";
    list.classList.remove("is-open");
    sugg = [];
    active = -1;
  };

  const openSuggest = (items) => {
    list.innerHTML = "";
    items.forEach((it, idx) => {
      const li = el("li", "search__suggest-item", it.display);
      li.setAttribute("role", "option");
      li.dataset.index = String(idx);
      li.addEventListener("mouseenter", () => setActive(idx));
      li.addEventListener("mouseleave", () => setActive(-1));
      li.addEventListener("mousedown", (e) => { e.preventDefault(); selectItem(idx); });
      list.appendChild(li);
    });
    list.classList.add("is-open");
  };

  const setActive = (idx) => {
    active = idx;
    [...list.children].forEach((n, i) => {
      if (i === idx) n.classList.add("is-active");
      else n.classList.remove("is-active");
    });
  };

  const moveActive = (dir) => {
    if (!sugg.length) return;
    if (active === -1 && dir === 1) active = 0;
    else {
      active += dir;
      if (active < 0) active = sugg.length - 1;
      if (active >= sugg.length) active = 0;
    }
    setActive(active);
  };

  const selectItem = async (idx) => {
    const item = sugg[idx];
    if (!item) return;
    input.value = item.display;
    closeSuggest();
    await loadWeatherByGeo(item);
  };

  const doSuggest = debounce(async (q) => {
    if (q.length < 2) { closeSuggest(); return; }
    try {
      const items = await geocodeSuggest(q, 7);
      if (!items.length) { closeSuggest(); return; }
      sugg = items;
      active = -1;
      openSuggest(items);
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    }
  }, 300);

  const updateClear = () => {
    const has = !!input.value.trim();
    btnClear.classList.toggle("is-visible", has);
    btnSearch.classList.toggle("is-hidden", has);
  };
  input.addEventListener("input", () => { updateClear(); doSuggest(input.value.trim()); });

  input.addEventListener("keydown", (e) => {
    if (list.classList.contains("is-open")) {
      if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
      else if (e.key === "Enter" && active >= 0) { e.preventDefault(); selectItem(active); }
      else if (e.key === "Escape") { closeSuggest(); input.blur(); return; }
    } else if (e.key === "Escape") {
      input.blur(); return;
    }
  });

  document.addEventListener("click", (e) => {
    if (!form.contains(e.target)) closeSuggest();
  });

  btnClear.addEventListener("click", () => {
    input.value = "";
    updateClear();
    closeSuggest();
    input.focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    if (list.classList.contains("is-open") && active >= 0) {
      selectItem(active);
    } else {
      loadCityWeather(q);
    }
    closeSuggest();
  });

  updateClear();

  wrap.append(logoLink, form);
  return wrap;
}

/* Weather */
function createWeatherNode() {
  const w = el("section", "weather");

  const head = el("div", "weather__head");
  head.append(
    el("div", "weather__city", state.city),
    el("div", "weather__date", state.date)
  );

  const center = el("div", "weather__center");
  center.append(el("div", "weather__temp", `${state.temp}°`));

  const meta = el("div", "weather__meta");
  const row = el("div", "weather__row");
  const ico = el("img", "weather__icon");
  setWeatherIcon(ico, state.icon, state.icon.endsWith("n"));
  ico.alt = state.status;
  row.append(ico, el("span", "weather__status", state.status));
  meta.append(row, el("div", "weather__feels", `Ощущается как: ${state.feels}°`));

  w.append(head, center, meta);
  return w;
}

/* Cards */
const CARD_FIELDS = [
  ["humidity", "Влажность"],
  ["wind", "Ветер"],
  ["pressure", "Давление"],
  ["visibility", "Видимость"],
  ["sunrise", "Восход"],
  ["sunset", "Закат"],
];

function createCardsNode() {
  const list = el("aside", "cards");
  CARD_FIELDS.forEach(([key, label]) => {
    const card = el("div", "card");
    const body = el("div", "card__body");
    const title = el("div", "card__title", label);
    const value = el("div", "card__value", "—");
    value.dataset.field = key;
    body.append(title, value);
    card.append(body);
    list.append(card);
  });
  return list;
}

/* Slider */
function createSliderNode() {
  const s = el("section", "slider");
  const list = el("ul", "slider__list");
  s.append(list);
  return s;
}

function createStageFooterNode() {
  return el("div", "stage__footer");
}

/* STAGE */
function renderStage() {
  const main = $("#main");
  const stage = el("section", "stage");

  stage.append(createHeaderNode());

  const grid = el("div", "stage__grid");
  grid.append(createWeatherNode(), createCardsNode());
  stage.append(grid);

  stage.append(createSliderNode());
  stage.append(createStageFooterNode());

  main.append(stage);
}

function renderFooter() {
  const f = $("#footer");
  if (f) f.innerHTML = "";
}

/* ========== boot ========== */
renderStage();
renderFooter();
document.body.setAttribute("data-glass", "dim");


const startCity = localStorage.getItem("lastCity") || state.city || "Москва";
loadCityWeather(startCity);
