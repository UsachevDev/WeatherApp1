console.log("main.js loaded");

const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

const paths = {
  logo: "../public/images/icons/logo.svg",
  search: "../public/images/icons/search.svg",
  close: "../public/images/icons/close.svg",
};

const state = {
  city: "Москва",
  date: "Суббота, 06 января, 11:29",
  temp: -7,
  status: "Облачно",
  feels: -11,
  tiles: 6,
  icon: "04d",
};

function createHeaderNode() {
  const wrap = el("div", "stage__header");

  const logoLink = el("a", "header__logo-link");
  logoLink.href = "#";
  const logo = el("img", "header__logo");
  logo.src = paths.logo; logo.alt = "WeatherApp";
  logoLink.appendChild(logo);

  const form = el("form", "search");
  const input = el("input", "search__input");
  input.type = "text"; input.placeholder = "Поиск по городу"; input.autocomplete = "off";

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

  const updateClear = () => {
    const has = !!input.value.trim();
    btnClear.classList.toggle("is-visible", has);
    btnSearch.classList.toggle("is-hidden", has);
  };
  input.addEventListener("input", updateClear);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { input.value = ""; updateClear(); }
  });
  btnClear.addEventListener("click", () => {
    input.value = "";
    updateClear();
    input.focus();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log(input.value.trim());
  });

  wrap.append(logoLink, form);
  return wrap;
}

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
  ico.src = `../public/images/icons/weather/${state.icon}.png`;
  ico.alt = state.status;
  row.append(ico, el("span", "weather__status", state.status));
  meta.append(row, el("div", "weather__feels", `Ощущается как: ${state.feels}°`));

  w.append(head, center, meta);
  return w;
}

function createCardsNode() {
  const list = el("aside", "cards");
  for (let i = 0; i < state.tiles; i++) list.append(el("div", "card"));
  return list;
}

function createSliderNode() {
  return el("section", "slider");
}

function createStageFooterNode() {
  return el("div", "stage__footer");
}

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

renderStage();
renderFooter();
