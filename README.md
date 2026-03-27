# SVG ASCII Animator

A static project with animated ASCII/SVG rendering and export to `SVG` / `GIF`.

## Features

- Live animated ASCII rendering in SVG.
- Multiple shape presets: `Donut`, `Square (Solid)`, `Square (Hollow)`, `Triangle`.
- Adjustable animation speed slider.
- Badge markdown output generator with one-click copy.
- Export animation to `SVG` and `GIF`.

## Deploy to Vercel

1. Push the project to GitHub.
2. In Vercel, click `Add New -> Project` and select the repository.
3. Set `Framework Preset` to `Other`.
4. Leave `Build Command` empty.
5. Leave `Output Directory` empty.
6. Click `Deploy`.

Vercel serves `index.html` from the repository root and the `static/` directory automatically.

## Run Locally

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.
