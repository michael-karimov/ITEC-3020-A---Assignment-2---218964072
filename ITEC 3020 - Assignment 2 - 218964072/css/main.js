/* ===== Fragment loader: header & footer (Part 3) ===== */
async function loadFragment(into) {
  const el = document.querySelector(into);
  if (!el || !el.dataset.fragment) return;
  try {
    const res = await fetch(el.dataset.fragment, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    el.innerHTML = await res.text();
  } catch (err) {
    el.innerHTML = `<div class="container"><p role="alert">Failed to load content.</p></div>`;
    console.error("Fragment load error:", err);
  }
}

/* ===== Theme (Part 1) ===== */
function getPreferredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark" : "light";
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    const dark = theme === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.textContent = dark ? "🌙 Dark" : "🌞 Light";
  }
}
function initThemeToggle() {
  applyTheme(getPreferredTheme());
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("theme", next);
  });
}

/* ===== Blog (Part 2) ===== */
async function loadPosts() {
  const list = document.getElementById("blog-list");
  if (!list) return;
  const errBox = document.getElementById("blog-error");
  try {
    const res = await fetch("/data/posts.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) {
      list.innerHTML = "<p>No posts yet.</p>";
      return;
    }
    // Render cards
    list.innerHTML = "";
    posts.forEach(p => {
      const art = document.createElement("article");
      art.className = "card";
      art.innerHTML = `
        <h2>${p.title}</h2>
        <time datetime="${p.date}">${new Date(p.date).toLocaleDateString()}</time>
        ${p.tags?.length ? `<div class="tags">#${p.tags.join(" #")}</div>` : ""}
        <div class="content">${p.html}</div>
      `;
      list.appendChild(art);
    });
  } catch (err) {
    if (errBox) {
      errBox.classList.remove("visually-hidden");
      errBox.textContent = "Error loading blog posts.";
    }
    console.error("Blog load error:", err);
  }
}

/* ===== Boot ===== */
document.addEventListener("DOMContentLoaded", async () => {
  // Load header & footer first so toggle exists
  await Promise.all([loadFragment("#site-header"), loadFragment("#site-footer")]);
  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
  // Theme toggle binding (works after header injection)
  initThemeToggle();
  // Blog (only runs where #blog-list exists)
  loadPosts();
});
