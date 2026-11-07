const S = window.SITE, $ = s => document.querySelector(s), esc = t => String(t).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = n => n.toLocaleString("ru-RU") + " ₸";
addEventListener("scroll", () => $("nav").classList.toggle("s", scrollY > 40), {passive:true});
const im = new Image(); im.onload = () => { const h = $(".hero"); h.style.backgroundImage = "url(images/hero.jpg)"; h.classList.add("img"); }; im.src = "images/hero.jpg";
addEventListener("scroll", () => { const c = $(".hero>div"); if (scrollY < innerHeight) c.style.transform = `translateY(${scrollY*.25}px)`; }, {passive:true});

// ---- меню и корзина ----
const KEY = "otyrar-cart-v1", CUST = "otyrar-cust-v1", cart = {};
const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const ck = i => S.menu[i].cat + "|" + S.menu[i].name, idx = {};
S.menu.forEach((m, i) => idx[ck(i)] = i);
Object.entries(lsGet(KEY, {})).forEach(([k, n]) => { if (k in idx && n > 0) cart[idx[k]] = n; });
const saveCart = () => { const o = {}; for (const i in cart) if (cart[i] > 0) o[ck(i)] = cart[i]; lsSet(KEY, o); };
const lines = () => Object.keys(cart).filter(i => cart[i] > 0).map(i => ({ i: +i, m: S.menu[i], n: cart[i] }));
const sum = () => lines().reduce((s, l) => s + l.m.price * l.n, 0), count = () => lines().reduce((s, l) => s + l.n, 0);
let curCat = null;
function updateBar() { const c = count(); $("#cart").hidden = !c; $("#cartInfo").textContent = c ? `${c} поз. · ${fmt(sum())}` : ""; }
function change(i, d) { cart[i] = Math.max(0, (cart[i] || 0) + d); saveCart(); renderMenu(); updateBar(); }
function renderMenu() {
  const q = $("#q").value.trim().toLowerCase();
  const list = S.menu.map((m, i) => ({ m, i })).filter(({ m }) => q ? (m.name + " " + m.cat + " " + (m.sub || "")).toLowerCase().includes(q) : m.cat === curCat);
  let last = null, html = "";
  const cv = !q && S.photos && S.photos[curCat];
  if (cv) html += `<div class="cover"><img src="images/menu/${esc(cv)}" alt="${esc(curCat)}" loading="lazy" onerror="this.parentNode.remove()"></div>`;
  list.forEach(({ m, i }) => {
    const grp = q ? m.cat : (m.sub || ""); if (grp && grp !== last) { html += `<h4 class="grp">${esc(grp)}</h4>`; last = grp; }
    const n = cart[i] || 0;
    html += `<div class="card dish">${m.img ? `<img class="th" src="images/menu/${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" onerror="this.remove()">` : ""}<h3>${esc(m.name)}</h3><div class="buy"><b>${fmt(m.price)}</b>${n
      ? `<div class="qty"><button type="button" data-i="${i}" data-d="-1" aria-label="Убрать">−</button><span>${n}</span><button type="button" data-i="${i}" data-d="1" aria-label="Добавить">+</button></div>`
      : `<button class="add" type="button" data-i="${i}" data-d="1">В корзину</button>`}</div></div>`;
  });
  $("#menuItems").innerHTML = html || `<p class="note">Ничего не найдено.</p>`;
  [...$("#tabs").children].forEach(b => b.classList.toggle("on", !q && b.textContent === curCat));
}
if (S.menu.length) {
  $("#menuStatic").hidden = true; $("#menuApp").hidden = false;
  const cats = [...new Set(S.menu.map(m => m.cat))]; curCat = cats[0];
  $("#tabs").innerHTML = cats.map(c => `<button type="button">${esc(c)}</button>`).join("");
  $("#tabs").onclick = e => { if (e.target.tagName !== "BUTTON") return; curCat = e.target.textContent; $("#q").value = ""; renderMenu(); };
  $("#q").oninput = renderMenu;
  $("#menuItems").onclick = e => { const b = e.target.closest("button[data-i]"); if (b) change(+b.dataset.i, +b.dataset.d); };
  $("#cartBtn").onclick = openCart;
  renderMenu(); updateBar();
}

function openCart() {
  if (!count()) return;
  const c = lsGet(CUST, {}), v = k => esc(c[k] || "");
  showDlg(`<h3>Ваш заказ</h3><div id="cl"></div>
  <form id="of"><div class="seg"><label><input type="radio" name="mode" value="Доставка" checked>Доставка</label><label><input type="radio" name="mode" value="Самовывоз">Самовывоз</label></div>
  <label>Имя<input name="n" required autocomplete="name" value="${v("n")}"></label>
  <label>Телефон<input name="p" type="tel" required autocomplete="tel" inputmode="tel" placeholder="+7 7__ ___ __ __" value="${v("p")}"></label>
  <div id="addr"><label>Адрес доставки<input name="a" required autocomplete="street-address" placeholder="Улица, дом, квартира" value="${v("a")}"></label>
  <label>Подъезд, этаж, домофон<input name="e" placeholder="необязательно" value="${v("e")}"></label></div>
  <p class="pick" hidden>Самовывоз: Актау, 28-й микрорайон, 53.</p>
  <label>Ко времени<input name="t" type="time"></label>
  <label>Комментарий<textarea name="c" rows="2" placeholder="Например: без лука, меньше острого"></textarea></label>
  <p class="hint">Стоимость доставки и время подтвердит администратор. Заказ уйдёт в WhatsApp кафе.</p>
  <button class="btn" type="submit">Отправить заказ в WhatsApp</button></form>`);
  const f = $("#of");
  const renderList = () => { const L = lines(); if (!L.length) return dlg.close();
    $("#cl").innerHTML = L.map(l => `<div class="cr"><div><b>${esc(l.m.name)}</b><small>${fmt(l.m.price)} × ${l.n} = ${fmt(l.m.price * l.n)}</small></div><div class="qty"><button type="button" data-ci="${l.i}" data-d="-1" aria-label="Убрать">−</button><span>${l.n}</span><button type="button" data-ci="${l.i}" data-d="1" aria-label="Добавить">+</button></div></div>`).join("")
      + `<div class="tot"><span>Блюда</span><b>${fmt(sum())}</b></div>`; };
  renderList();
  body.onclick = e => { const b = e.target.closest("[data-ci]"); if (b) { change(+b.dataset.ci, +b.dataset.d); renderList(); } };
  f.onchange = e => { if (e.target.name !== "mode") return; const d = f.mode.value === "Доставка"; $("#addr").hidden = !d; f.querySelector(".pick").hidden = d; f.a.required = d; };
  f.p.oninput = () => f.p.setCustomValidity("");
  f.onsubmit = e => { e.preventDefault();
    const dg = f.p.value.replace(/\D/g, "");
    if (!(dg.length === 10 || (dg.length === 11 && "78".includes(dg[0])))) { f.p.setCustomValidity("Введите номер, например +7 777 123 45 67"); return f.p.reportValidity(); }
    const x = Object.fromEntries(new FormData(f)), del = x.mode === "Доставка"; lsSet(CUST, { n: x.n, p: x.p, a: x.a, e: x.e });
    const msg = ["Здравствуйте! Новый заказ с сайта.", `Имя: ${x.n}`, `Телефон: ${x.p}`, `Получение: ${x.mode}`,
      del ? `Адрес: ${x.a}${x.e ? ", " + x.e : ""}` : "Самовывоз: 28-й мкр, 53", x.t ? `Ко времени: ${x.t}` : "Время: как можно скорее", "", "Заказ:",
      ...lines().map(l => `• ${l.m.name} × ${l.n} — ${fmt(l.m.price * l.n)}`), `Сумма блюд: ${fmt(sum())}`, x.c ? `Комментарий: ${x.c}` : ""].join("\n").trim();
    const url = wa(msg), a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; document.body.append(a); a.click(); a.remove();
    showDlg(`<h3>Заказ готов к отправке</h3><p>Открылся WhatsApp с текстом вашего заказа. Нажмите «Отправить» в чате: пока вы этого не сделали, кафе заказ не получило.</p>
      <a class="btn" href="${url}" target="_blank" rel="noopener">Открыть WhatsApp ещё раз</a><button class="btn" type="button" id="cp">Скопировать текст заказа</button><button class="btn" type="button" id="cc">Очистить корзину</button>`);
    $("#cp").onclick = () => navigator.clipboard.writeText(msg).then(() => say("Заказ скопирован"), () => say("Не удалось скопировать"));
    $("#cc").onclick = () => { for (const k in cart) delete cart[k]; saveCart(); renderMenu(); updateBar(); dlg.close(); };
  };
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
