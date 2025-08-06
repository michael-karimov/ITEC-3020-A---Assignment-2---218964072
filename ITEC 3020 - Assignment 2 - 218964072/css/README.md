# ITEC3020 — Assignment 2 (Clean Minimal Solution)

## How to run (local web server required)
- Python: `python3 -m http.server 8000` → open http://localhost:8000
- VS Code: Install **Live Server** → “Go Live”
- Node (optional): `npx http-server -p 8000`

## What to demo in your video
1) Toggle the theme on **Home**; reload the page and open **Blog** to show persistence.
2) On **Blog**, show posts are loaded (network tab will show `data/posts.json`).
3) Show **header/footer** exist only in `partials/` and appear on both pages (no duplication).
4) Mention the two posts in `data/posts.json` explain Parts One & Two (as required).

## Notes
- Keep the path `fetch('data/posts.json')` (not `../data/...`).
- The theme toggle is one shared button that controls the entire site.
