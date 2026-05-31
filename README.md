# daidaide Gallery

Personal photo gallery for daidaide, built with Vite, React, and TypeScript.

The gallery reads photo data from a static JSON file:

```txt
public/data/gallery.json
```

When deployed as a project site, the gallery is expected to live at:

```txt
https://daidaideaa.github.io/gallery/
```

## Local Development

```bash
npm install
npm run dev
```

Open the `/gallery/` path shown by Vite.

## Build

```bash
npm run build
npm run preview
```

## Deployment

Push this repository to `daidaideaa/gallery`. The GitHub Actions workflow in `.github/workflows/pages.yml` builds `dist` and deploys it to GitHub Pages.
