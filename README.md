# Differential Cryptanalysis Demo – Heys SPN

A hands-on walk through a small 16-bit SPN cipher and a classic differential attack, based on Howard M. Heys’ tutorial.

## Live demo

| Host | URL |
|------|-----|
| **GitHub Pages** | https://ahmaddaadaa.github.io/Cryptanalysis/ *(turn on under Settings → Pages)* |
| **Render** | After deploy: `https://<your-service-name>.onrender.com` |

### Deploy on Render (recommended, free)

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in (GitHub login is fine).
2. **New → Static Site**
3. Connect the repo: `ahmaddaadaa/Cryptanalysis`
4. Settings:
   - **Name:** `cryptanalysis-demo` (or anything)
   - **Branch:** `main`
   - **Build Command:** leave empty
   - **Publish Directory:** `.`
5. Click **Create Static Site**

Render gives you a public link like:

`https://cryptanalysis-demo.onrender.com`

Or use **New → Blueprint** and point it at this repo (`render.yaml` is included).

### Deploy on GitHub Pages

1. https://github.com/ahmaddaadaa/Cryptanalysis/settings/pages  
2. Source: **Deploy from a branch** → `main` → `/ (root)` → Save  
3. Site: https://ahmaddaadaa.github.io/Cryptanalysis/

## What you can try

1. **Toy cipher** — 16-bit block, 4 rounds, DES-style 4×4 S-box  
2. **Difference table** — S-box DDT with the attack cells highlighted  
3. **Characteristic** — path with ΔP = `0x0B00`, p_D ≈ 2.64%  
4. **Key & message** — random subkeys and encrypt a short message  
5. **Attack** — chosen pairs, filter, count 256 partial-key guesses  
6. **Results** — see if the real 8 bits of K₅ rise to the top  
7. **Videos** — walkthrough for each step (add files under `videos/`)

## Run locally

```bash
open index.html
# or
npx serve .
```

## Deploy (GitHub Pages)

This repo is a static site. To host it:

1. Push to `main` on GitHub  
2. Repo **Settings → Pages**  
3. Source: **Deploy from a branch**  
4. Branch: **main** / folder: **/ (root)**  
5. Save — site is live in about a minute  

Video files go in `videos/` (keep each under 100 MB for GitHub). Suggested names:

- `videos/overview.mp4`
- `videos/step-1-cipher.mp4` … `videos/step-6-results.mp4`

## Project layout

```
Cryptanalysis/
├── index.html
├── css/style.css
├── js/
│   ├── spn.js
│   ├── diff-attack.js
│   └── app.js
├── videos/          # optional walkthrough clips
└── README.md
```

## Reference

Heys, H. M. *A Tutorial on Linear and Differential Cryptanalysis*.
