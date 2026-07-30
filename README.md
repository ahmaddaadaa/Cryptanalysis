# Differential Cryptanalysis Demo – Heys SPN

A hands-on walk through a small 16-bit SPN cipher and a classic differential attack, based on Howard M. Heys’ tutorial.

## Live demo

Once GitHub Pages is on:

**https://ahmaddaadaa.github.io/Cryptanalysis/**

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
