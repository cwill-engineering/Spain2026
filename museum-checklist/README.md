# Prado Challenge

Tailwind + React scavenger hunt checklist for the Museo del Prado. Progress is saved in the browser (`localStorage`).

## Netlify (`verdant-bubblegum-a35b1a`)

In **Site configuration → Build & deploy → Build settings**:

| Setting | Value |
|--------|--------|
| **Repository** | `cwill-engineering/Spain2026` |
| **Branch** | `main` (after merge) |
| **Base directory** | `museum-checklist` |
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |

`museum-checklist/netlify.toml` matches these values when the base directory is set.

## Local dev

```bash
cd museum-checklist
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
