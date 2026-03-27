# SVG Donut

Статический проект с анимированным ASCII/SVG donut-рендером и экспортом в `SVG`/`GIF`.

## Деплой на Vercel

1. Залей проект в GitHub.
2. В Vercel нажми `Add New -> Project` и выбери репозиторий.
3. `Framework Preset`: `Other`.
4. `Build Command`: оставить пустым.
5. `Output Directory`: оставить пустой.
6. Нажми `Deploy`.

Vercel автоматически раздаст `index.html` из корня проекта и папку `static/`.

## Локальный запуск

```bash
python3 -m http.server 4173
```

Открой `http://localhost:4173`.
