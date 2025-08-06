/* Small, dependency-free JS:
   - Load header/footer fragments
   - Theme toggle with persistence and OS preference
   - Blog rendering from JSON (tag chips + reading time)
*/

/* --- helpers --- */

async function fetchWithTimeout(url, opts = {}, ms = 5000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(id); }
}

function htmlToText(html) {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  return d.textContent || d.innerText || "";
}

function readingTimeFromHTML(html, wpm = 200) {
  const words = htmlToText(html).trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / wpm));
  return `${mins} min read`;
}

/* --- fragments --- */

async function loadFragment(sel) {
  const el = document.querySelector(sel);
  if (!el || !el.dataset.fragment) return;
  try {
    const res = await fetchWithTimeout(el.dataset.fragment, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    el.innerHTML = await res.text();
  } catch (err) {
    el.innerHTML = `<div class="container"><p role="alert">Failed to load content.</p></div>`;
    console.error("Fragment load error:", err);
  }
}

/* --- theme toggle --- */

function getPreferredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    const dark = theme === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.textContent = dark ? "Dark" : "Light";
    btn.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
  }
}

function initThemeToggle() {
  applyTheme(getPreferredTheme());

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("theme", next);
    });
  }

  const saved = localStorage.getItem("theme");
  if (!saved && window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", e => applyTheme(e.matches ? "dark" : "light"));
  }
}

/* --- nav highlight --- */
function markActiveNav() {
  const links = document.querySelectorAll('.nav a[href]');
  const here = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => a.getAttribute('href').endsWith(here) && a.setAttribute('aria-current', 'page'));
}

/* --- blog rendering --- */

function renderSkeletons() {
  const list = document.getElementById("blog-list");
  if (!list) return;
  list.innerHTML = `<div class="skel"></div><div class="skel"></div><div class="skel"></div>`;
}

function renderControls(tags) {
  const controls = document.getElementById("blog-controls");
  if (!controls || !tags.size) return;
  const all = ["All", ...Array.from(tags).sort()];
  controls.innerHTML = all.map(tag => `<button class="chip" data-tag="${tag}">${tag}</button>`).join("");
}

function attachFilter(posts) {
  const list = document.getElementById("blog-list");
  const controls = document.getElementById("blog-controls");
  if (!controls) { draw("All"); return; }

  function draw(tag = "All") {
    list.innerHTML = "";
    const filtered = tag === "All" ? posts : posts.filter(p => p.tags?.includes(tag));
    if (filtered.length === 0) { list.innerHTML = `<p class="muted">No posts for “${tag}”.</p>`; return; }

    filtered.forEach(p => {
      const dateISO = p.date;
      const dateText = isNaN(Date.parse(dateISO)) ? p.date : new Date(dateISO).toLocaleDateString();
      const contentHTML = p.html ?? p.bodyHtml ?? "";
      const read = readingTimeFromHTML(contentHTML);

      const art = document.createElement("article");
      art.className = "card";
      art.innerHTML = `
        <h2>${p.title}</h2>
        <div class="meta"><time datetime="${dateISO}">${dateText}</time> • <span>${read}</span></div>
        ${p.tags?.length ? `<div class="tags">#${p.tags.join(" #")}</div>` : ""}
        <div class="content">${contentHTML}</div>
      `;
      list.appendChild(art);
    });
  }

  controls.addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    controls.querySelectorAll(".chip").forEach(c => c.dataset.active = "false");
    btn.dataset.active = "true";
    draw(btn.dataset.tag);
  });

  const first = controls.querySelector('.chip[data-tag="All"]');
  if (first) first.dataset.active = "true";
  draw("All");
}

async function loadPosts() {
  const list = document.getElementById("blog-list");
  if (!list) return;
  const errBox = document.getElementById("blog-error");

  try {
    renderSkeletons();
    // correct path and filename
    const res = await fetchWithTimeout("css/posts.json", { cache: "no-cache" }, 7000);
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const posts = await res.json();

    if (!Array.isArray(posts) || posts.length === 0) { list.innerHTML = "<p>No posts yet.</p>"; return; }

    // newest → oldest and collect unique tags
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const tags = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));

    renderControls(tags);
    attachFilter(posts);
  } catch (err) {
    if (errBox) { errBox.classList.remove("visually-hidden"); errBox.textContent = "Error loading blog posts."; }
    console.error("Blog load error:", err);
    list.innerHTML = "<p>Could not load posts.</p>";
  }
}

/* --- boot --- */
document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([loadFragment("#site-header"), loadFragment("#site-footer")]);

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  initThemeToggle();
  markActiveNav();
  loadPosts();

  const main = document.getElementById("main");
  if (main) main.focus();
});
