<div align="center">

# LightX2V App Website

### [Visit Website →](https://light-ai.top/LightX2V-App-Website/) · [简体中文 →](https://light-ai.top/LightX2V-App-Website/zh/)

The official download website for LightX2V on Mac and Windows.

</div>

## Local development

Requires Node.js 22+ and Python 3. No dependencies to install.

```sh
npm run dev
```

Open [localhost:4173](http://127.0.0.1:4173/). After editing, run `npm run build` and refresh.

To build and verify:

```sh
npm run build && npm run check && npm test
```

## Deployment

Changes to `main` deploy through GitHub Pages. Official app downloads are checked every 15 minutes and updated when they change.

When replacing images, update the media manifest and approved snapshot in `site-data/`.
