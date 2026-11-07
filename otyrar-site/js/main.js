const S = window.SITE, $ = s => document.querySelector(s), esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = n => n.toLocaleString("ru-RU") + " ₸";
addEventListener("scroll", () => $("nav").classList.toggle("s", scrollY > 40), {passive:true});
const im = new Image(); im.onload = () => { const h = $(".hero"); h.style.backgroundImage = "url(images/hero.jpg)"; h.classList.add("img"); }; im.src = "images/hero.jpg";
addEventListener("scroll", () => { const c = $(".hero>div"); if (scrollY < innerHeight) c.style.transform = `translateY(${scrollY*.25}px)`; }, {passive:true});

// ---- меню с заказом в WhatsApp ----
const cart = {};
function renderMenu() {
  const q = $("#q").value.trim().toLowerCase(), cat = renderMenu.cat || "Все";
  const items = S.menu.filter(m => (cat === "Все" || m.cat === cat) && (!q || (m.name + " " + (m.desc||"")).toLowerCase().includes(q)));
  $("#menuItems").innerHTML = items.length ? items.map(m => {
    const i = S.menu.indexOf(m), n = cart[i] || 0;
    return `<div class="card dish"><h3>${esc(m.name)}${m.price?`<em>${fmt(m.price)}</em>`:""}</h3>${m.desc?`<p>${esc(m.desc)}</p>`:""}
      <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Убрать">−</button><span>${n}</span><button data-i="${i}" data-d="1" aria-label="Добавить">+</button></div></div>`;
  }).join("") : `<p class="note">Ничего не найдено.</p>`;
}
function renderCart() {
  const ids = Object.keys(cart).filter(i => cart[i] > 0);
  $("#cart").hidden = !ids.length; if (!ids.length) return;
  let sum = 0, cnt = 0, lines = [];
  ids.forEach(i => { const m = S.menu[i], n = cart[i]; cnt += n; sum += (m.price||0) * n; lines.push(`• ${m.name} × ${n}${m.price?` — ${fmt(m.price*n)}`:""}`); });
  $("#cartInfo").textContent = `${cnt} поз.` + (sum ? ` · ${fmt(sum)}` : "");
  $("#cartBtn").href = `https://wa.me/${S.wa}?text=` + encodeURIComponent("Здравствуйте! Хочу заказать:\n" + lines.join("\n") + (sum ? `\nИтого: ${fmt(sum)}` : ""));
}
if (S.menu.length) {
  $("#menuStatic").hidden = true; $("#menuApp").hidden = false;
  const cats = ["Все", ...new Set(S.menu.map(m => m.cat).filter(Boolean))]; renderMenu.cat = "Все";
  $("#tabs").innerHTML = cats.map((c, k) => `<button type="button" class="${k?"":"on"}">${esc(c)}</button>`).join("");
  $("#tabs").onclick = e => { if (e.target.tagName !== "BUTTON") return; [...$("#tabs").children].forEach(b => b.classList.toggle("on", b === e.target)); renderMenu.cat = e.target.textContent; renderMenu(); };
  $("#q").oninput = renderMenu;
  $("#menuItems").onclick = e => { const b = e.target.closest("button[data-i]"); if (!b) return; const i = b.dataset.i; cart[i] = Math.max(0, (cart[i]||0) + +b.dataset.d); renderMenu(); renderCart(); };
  $("#cartClr").onclick = () => { for (const k in cart) delete cart[k]; renderMenu(); renderCart(); };
  renderMenu();
}

// ---- отзывы и галерея ----
$("#revList").innerHTML = S.reviews.map(r => `<div class="card rv"><p>«${esc(r.text)}»</p><h3 style="font-size:16px;margin-top:12px">${esc(r.name)}</h3>${r.date?`<small style="color:var(--mut)">${esc(r.date)}</small>`:""}</div>`).join("");
if (S.gallery.length) $("#gal").innerHTML = S.gallery.map(f => `<div class="rv"><img src="images/${esc(f)}" alt="Отырар" loading="lazy"></div>`).join(""); else $("#galSec").hidden = true;

const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; e.target.classList.add("in"); io.unobserve(e.target);
  e.target.querySelectorAll("[data-n]").forEach(n => {
    const to = +n.dataset.n, d = n.dataset.d|0, t0 = performance.now();
    (function f(t){ const p = Math.min((t-t0)/1600,1); n.textContent = (to*(1-Math.pow(1-p,3))).toFixed(d) + (n.dataset.s||""); if(p<1) requestAnimationFrame(f); })(t0);
  });
}), {threshold:.15});
document.querySelectorAll(".rv").forEach(el => io.observe(el));

// ---- орнамент в шапке ----
(function(){
  const st = (r, s, a) => `<g transform="rotate(${a}) translate(0,${-r}) scale(${s})"><rect x="-120" y="-120" width="240" height="240"/><rect x="-120" y="-120" width="240" height="240" transform="rotate(45)"/></g>`;
  const ring = (n, r, s, off=0) => Array.from({length:n}, (_, k) => st(r, s, off + k*360/n)).join("");
  $("#art").innerHTML = `<defs><radialGradient id="fd"><stop offset=".25" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="mk"><rect x="-500" y="-500" width="1000" height="1000" fill="url(#fd)"/></mask></defs>
  <g mask="url(#mk)" fill="none" stroke="#c9a15a" stroke-width="1.3" vector-effect="non-scaling-stroke">
    <g class="r1"><circle r="440"/><circle r="330"/>${ring(16,385,.42)}${ring(12,330,.55,15)}</g>
    <g class="r2"><circle r="250"/>${ring(8,190,.55)}${ring(8,250,.28,22.5)}</g>
    <g class="r3"><circle r="120"/>${st(0,1,0)}${st(0,.55,22.5)}</g></g>`;
})();

// ---- окна, бронь, подсказки ----
const dlg = $("#dlg"), body = $("#dlgBody"), toast = $("#toast");
const wa = t => `https://wa.me/${S.wa}?text=` + encodeURIComponent(t);
const say = t => { toast.textContent = t; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 2600); };
const copy = async n => { try { await navigator.clipboard.writeText(n); say("Номер скопирован: " + n); } catch { say("Позвоните: " + n); } };
const showDlg = html => { body.innerHTML = html; dlg.showModal(); };
dlg.querySelector(".x").onclick = () => dlg.close();
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
const callBlock = `<p class="or">Или позвоните: <a href="tel:+77780011158" data-call>${S.phone}</a></p>`;

function booking() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  showDlg(`<h3>Бронь стола</h3><p>Заявка уйдёт в WhatsApp кафе. Подтверждение придёт от администратора.</p>
  <form id="bf"><label>Ваше имя<input name="n" required autocomplete="name"></label>
  <div class="row"><label>Дата<input type="date" name="d" required min="${d.toISOString().slice(0,10)}"></label><label>Время<input type="time" name="t" required></label></div>
  <label>Гостей<select name="g">${Array.from({length:20},(_, i)=>`<option${i==1?" selected":""}>${i+1}</option>`).join("")}</select></label>
  <label>Пожелания<textarea name="c" rows="2" placeholder="VIP-зал, детский уголок…"></textarea></label>
  <button class="btn" type="submit">Отправить в WhatsApp</button></form>${callBlock}`);
  $("#bf").onsubmit = e => { e.preventDefault(); const f = new FormData(e.target);
    window.open(wa(`Здравствуйте! Хочу забронировать стол.\nИмя: ${f.get("n")}\nДата: ${f.get("d")}\nВремя: ${f.get("t")}\nГостей: ${f.get("g")}` + (f.get("c") ? `\nПожелания: ${f.get("c")}` : "")), "_blank", "noopener"); dlg.close(); };
}
const INFO = {"Европейская кухня":"Европейская кухня — одно из направлений кафе.","Завтраки":"В кафе подают завтраки.","Бизнес-ланч":"Бизнес-ланч: с 12:00 до 15:00.","Постное меню":"В кафе есть постное меню.","Суши":"Суши доступны с доставкой."};
function category(name) {
  showDlg(`<h3>${esc(name)}</h3><p>${INFO[name] || ""} Актуальные блюда и цены подскажет администратор.</p>
  <a class="btn" target="_blank" rel="noopener" href="${wa(`Здравствуйте! Подскажите, пожалуйста, что в разделе «${name}» и какие цены?`)}">Узнать в WhatsApp</a>
  <a class="btn" target="_blank" rel="noopener" href="https://2gis.kz/aktau/firm/70000001116532247/tab/menu">Меню в 2ГИС</a>${callBlock}`);
}
document.addEventListener("click", e => {
  if (e.target.closest("[data-act=book]")) return booking();
  const c = e.target.closest("#menuStatic .card"); if (c) return category(c.querySelector("h3").textContent);
  const a = e.target.closest("a[href^='tel:']");
  if (a && matchMedia("(hover:hover) and (pointer:fine)").matches) { e.preventDefault(); copy(a.textContent.trim().startsWith("+") ? a.textContent.trim() : S.phone); }
});
document.querySelectorAll("#menuStatic .card").forEach(c => { c.tabIndex = 0; c.setAttribute("role", "button"); c.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.click(); } }; });
