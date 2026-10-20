// ---------- Деректер ----------
const products = [
  { id: 1, name: "Nova X Pro смартфоны", cat: "phone",  price: 389000, icon: "📱" },
  { id: 2, name: "Nova Lite смартфоны",  cat: "phone",  price: 179000, icon: "📱" },
  { id: 3, name: "Slate 14 ноутбугі",    cat: "laptop", price: 429000, icon: "💻" },
  { id: 4, name: "Slate Air 13 ноутбугі", cat: "laptop", price: 569000, icon: "💻" },
  { id: 5, name: "AirBeat құлаққабы",    cat: "audio",  price: 49900,  icon: "🎧" },
  { id: 6, name: "Pulse колонкасы",      cat: "audio",  price: 32900,  icon: "🔊" },
  { id: 7, name: "Tick S смарт-сағаты",  cat: "wear",   price: 74900,  icon: "⌚" },
  { id: 8, name: "Charge 20 000 mAh power bank", cat: "acc", price: 18900, icon: "🔋" }
];
const cats = {
  phone: "Смартфондар", laptop: "Ноутбуктер", audio: "Аудио",
  wear: "Сағаттар", acc: "Аксессуарлар"
};

// ---------- Көмекші функциялар ----------
const $ = (sel, root = document) => root.querySelector(sel);
const fmt = n => n.toLocaleString("ru-RU") + " ₸";

// localStorage бөлек ашылған файлда жұмыс істейді; қате болса, үнсіз өткізіп жібереміз
const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

function toast(message) {
  const t = $("#toast");
  t.textContent = message;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ---------- Тауар карточкасы ----------
function card(p) {
  return `<article class="card">
    <div class="thumb">${p.icon}</div>
    <h3>${p.name}</h3>
    <p class="price">${fmt(p.price)}</p>
    <button class="btn small" data-add="${p.id}">Себетке салу</button>
  </article>`;
}

function renderFeatured() {
  $("#featured").innerHTML = products.slice(0, 4).map(card).join("");
}

// ---------- Каталог: іздеу, санат, сұрыптау ----------
function renderCatalog() {
  const q = $("#search").value.trim().toLowerCase();
  const c = $("#category").value;
  const s = $("#sort").value;
  const list = products.filter(p => (!c || p.cat === c) && p.name.toLowerCase().includes(q));
  if (s === "asc")  list.sort((a, b) => a.price - b.price);
  if (s === "desc") list.sort((a, b) => b.price - a.price);
  $("#grid").innerHTML = list.map(card).join("");
  $("#noResult").hidden = list.length > 0;
}

// ---------- Себет ----------
let cart = store.get("volt-cart", {}); // { тауар id: саны }

function saveCart() {
  store.set("volt-cart", cart);
  renderCart();
}

function renderCart() {
  const items = Object.entries(cart)
    .map(([id, qty]) => ({ p: products.find(x => x.id == id), qty }))
    .filter(i => i.p);

  $("#cartList").innerHTML = items.map(({ p, qty }) => `
    <div class="row">
      <div class="thumb mini">${p.icon}</div>
      <div><strong>${p.name}</strong><br><span class="muted">${fmt(p.price)}</span></div>
      <div class="qty">
        <button data-dec="${p.id}" aria-label="Азайту">−</button>
        <span>${qty}</span>
        <button data-inc="${p.id}" aria-label="Көбейту">+</button>
      </div>
      <strong>${fmt(p.price * qty)}</strong>
      <button class="del" data-del="${p.id}" aria-label="Өшіру">✕</button>
    </div>`).join("");

  $("#total").textContent = fmt(items.reduce((sum, i) => sum + i.p.price * i.qty, 0));
  $("#cartCount").textContent = items.reduce((sum, i) => sum + i.qty, 0);
  $("#cartBox").hidden = items.length === 0;
  $("#cartEmpty").hidden = items.length > 0;
}

document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const d = btn.dataset;
  if (d.add) { cart[d.add] = (cart[d.add] || 0) + 1; saveCart(); toast("Себетке қосылды"); }
  if (d.inc) { cart[d.inc]++; saveCart(); }
  if (d.dec) { cart[d.dec]--; if (cart[d.dec] < 1) delete cart[d.dec]; saveCart(); }
  if (d.del) { delete cart[d.del]; saveCart(); }
});

$("#checkout").addEventListener("click", () => {
  cart = {};
  saveCart();
  toast("Тапсырыс қабылданды!");
});

// ---------- Профиль ----------
const form = $("#profileForm");
Object.entries(store.get("volt-profile", {})).forEach(([key, value]) => {
  if (form.elements[key]) form.elements[key].value = value;
});
form.addEventListener("submit", e => {
  e.preventDefault();
  store.set("volt-profile", Object.fromEntries(new FormData(form)));
  toast("Профиль сақталды");
});

// ---------- Беттер арасында ауысу (#home, #catalog, ...) ----------
function route() {
  const id = (location.hash || "#home").slice(1);
  const el = document.getElementById(id);
  const page = el && el.classList.contains("page") ? id : "home";
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === page));
  document.querySelectorAll("nav a").forEach(a =>
    a.classList.toggle("active", a.getAttribute("href") === "#" + page));
  $("#nav").classList.remove("open");
  $("#burger").setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
}

$("#burger").addEventListener("click", () => {
  const open = $("#nav").classList.toggle("open");
  $("#burger").setAttribute("aria-expanded", open);
});
window.addEventListener("hashchange", route);

// ---------- Іске қосу ----------
Object.entries(cats).forEach(([value, label]) => {
  $("#category").insertAdjacentHTML("beforeend", `<option value="${value}">${label}</option>`);
});
["input", "change"].forEach(ev => {
  $("#search").addEventListener(ev, renderCatalog);
  $("#category").addEventListener(ev, renderCatalog);
  $("#sort").addEventListener(ev, renderCatalog);
});
renderFeatured();
renderCatalog();
renderCart();
route();
