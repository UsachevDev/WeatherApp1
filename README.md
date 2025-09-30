# WeatherApp

Мини‑приложение погоды на **HTML + CSS + Vanilla JS**.
Панель со “стеклом”, шапка с поиском, левый блок текущей погоды, правые карточки метрик и горизонтальный слайдер почасового прогноза.

**API:** Open‑Meteo
- Геокодер: https://geocoding-api.open-meteo.com/v1/search  
- Прогноз:  https://api.open-meteo.com/v1/forecast

---

## Возможности

- Стеклянная панель (glassmorphism) с пресетами: `light`, `dim`, `solid` (через CSS‑токены).
- Поиск с автодополнением (подсказки), переключение кнопок submit/clear.
- Текущая погода: город, локальная дата/время (таймзона), температура, статус, «ощущается как».
- Иконки погоды (день/ночь), маппинг кодов Open‑Meteo.
- Почасовой слайдер (горизонтальный, scroll‑snap, кастомный скроллбар).
- Карточки метрик: влажность, ветер, давление, видимость, восход, закат.
- Доступность: корректные фокусы, respect `prefers-reduced-motion`, читаемость текста над светлым фоном.
- Сохранение последнего города в `localStorage`.

---

## Запуск локально

Никаких сборщиков не требуется, это статический проект.

```bash
# Вариант 1 (Node)
npx http-server . -p 5500

# Вариант 2 (Python 3)
python -m http.server 5500
```

Открой в браузере: **http://localhost:5500/src/index.html**  
> В VS Code можно использовать расширение **Live Server** и открыть `src/index.html` напрямую.

---

## Структура проекта

```
public/
  images/
    bg-cloudy.png
    icons/
      logo.svg
      search.svg
      close.svg
      weather/
        01d.svg 01n.svg ... 50d.svg 50n.svg
src/
  scripts/
    main.js
  styles/
    globals/
      variables.css
      reset.css
      layout.css
    blocks/
      stage.css
      header.css
      weather.css
      card.css
      slider.css
  index.html
README.md
```

---

## Темизация и токены

Все переменные — в `styles/globals/variables.css`.

Переключение пресета стекла:
```html
<body data-glass="dim"> <!-- варианты: light (по умолчанию), dim, solid -->
```
Ключевые токены:
- `--neutral-600-10`, `--frost-40` — фон панели и элементов.
- `--glass-blur`, `--glass-radius`, `--glass-stroke`, `--glass-inner` — поведение стекла.
- `--txt-glow-weak`, `--txt-glow-strong`, `--txt-temp` — читаемость текста.
- Размеры: `--stage-w`, `--weather-w`, `--card-w`, `--card-h`, `--search-*`, `--hour-*`.


---

## Деплой автоматически (GitHub Pages)

1. Создать `.github/workflows/pages.yml` (автосборка в `dist/` и деплой):
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ "sprint-1-task-1" ]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: "pages"
     cancel-in-progress: false

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Prepare dist
           run: |
             rm -rf dist
             mkdir -p dist
             cp -R src/* dist/
             mkdir -p dist/public
             cp -R public/* dist/public
             grep -rl "\.\./public/" dist | xargs sed -i 's#\.\./public/#./public/#g'
             grep -rl "\.\./\.\./\.\./public/" dist/styles | xargs sed -i 's#\.\./\.\./\.\./public/#\.\./\.\./public/#g'
         - uses: actions/upload-pages-artifact@v3
           with: { path: dist }

     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

2. Коммит и пуш:
   ```bash
   git add .github/workflows/pages.yml
   git commit -m "ci(pages): auto build & deploy to GitHub Pages"
   git push -u origin HEAD
   ```

3. **Settings → Pages → Build and deployment**: Source = **GitHub Actions**.

---

## Доступность

- Фокус — на контейнере поиска `.search:focus-within` (нет «двойного бордера» у `<input>`).
- Подсказки — listbox; стрелки/мышь.
- `prefers-reduced-motion: reduce` — выключает анимации/переходы.
- Текст над светлыми облаками читается за счёт мягких `text-shadow`‑токенов.
