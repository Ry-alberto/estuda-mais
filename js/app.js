// =========================================================
// Estuda+ — aplicação (SPA com rotas por hash)
// Telas: Login/Cadastro, Dashboard, Disciplinas, Tarefas,
// Calendário, Pomodoro e Grupos.
// =========================================================

const app = document.getElementById("app");

const ROUTES = [
  { path: "dashboard", title: "Dashboard", icon: "dashboard", render: renderDashboard },
  { path: "disciplinas", title: "Disciplinas", icon: "book", render: renderSubjects },
  { path: "tarefas", title: "Tarefas", icon: "tasks", render: renderTasks },
  { path: "calendario", title: "Calendário", icon: "calendar", render: renderCalendar },
  { path: "pomodoro", title: "Pomodoro", icon: "timer", render: renderPomodoro },
  { path: "grupos", title: "Grupos", icon: "users", render: renderGroups },
];

const QUOTES = [
  "O segredo de progredir é começar.",
  "Pequenos passos todos os dias levam longe.",
  "Disciplina é escolher o que você quer mais.",
  "Foco no processo, o resultado vem.",
  "Estudar hoje é investir no seu amanhã.",
];

const PRIORITY_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" };
const STATUS = [
  { id: "pendente", label: "Pendente" },
  { id: "fazendo", label: "Fazendo" },
  { id: "concluida", label: "Concluída" },
];

const state = {
  user: null,
  authMode: "login",
  taskFilter: { disciplina: "", status: "" },
  calMonth: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })(),
  editingSubject: null,
  pomo: { mode: "foco", durations: { foco: 25 * 60, pausa: 5 * 60 }, remaining: 25 * 60, running: false, endAt: 0, disciplinaId: "", cycles: 0 },
};

// ---------- Helpers ----------
function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtDate(iso) {
  return parseDate(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "") ;
}
function fmtHours(h) {
  return `${(Math.round(h * 10) / 10).toString().replace(".", ",")}h`;
}
function fmtClock(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function relative(iso) {
  const n = daysUntil(iso);
  if (n < 0) return { text: `atrasada ${-n}d`, cls: "late" };
  if (n === 0) return { text: "hoje", cls: "soon" };
  if (n <= 3) return { text: `em ${n}d`, cls: "soon" };
  return null;
}
function toast(msg) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}
function currentRoute() {
  const p = location.hash.replace(/^#\/?/, "");
  return ROUTES.find((r) => r.path === p) || ROUTES[0];
}
function upcomingAlerts() {
  return Store.tasks()
    .filter((t) => t.status !== "concluida" && daysUntil(t.prazo) <= 3)
    .sort((a, b) => a.prazo.localeCompare(b.prazo));
}

// ---------- Tema (RF09) ----------
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  save(KEYS.theme, theme);
}
applyTheme(load(KEYS.theme, "light"));

// =========================================================
// Login e cadastro (RF01)
// =========================================================
function renderAuth() {
  const isLogin = state.authMode === "login";
  app.innerHTML = `
    <div class="auth">
      <section class="auth-hero">
        <div class="brand"><div class="brand-logo">${icon("logo")}</div><span class="brand-name">Estuda<span class="brand-plus">+</span></span></div>
        <div>
          <h1>Organize seus estudos em um só lugar.</h1>
          <p>Disciplinas, tarefas, provas, Pomodoro e estatísticas do seu tempo de estudo — tudo integrado.</p>
          <ul>
            <li><span class="ic">${icon("tasks")}</span> Tarefas com prazo, prioridade e status</li>
            <li><span class="ic">${icon("timer")}</span> Timer Pomodoro com registro de sessões</li>
            <li><span class="ic">${icon("chart")}</span> Horas estudadas por disciplina e semana</li>
            <li><span class="ic">${icon("users")}</span> Grupos de estudo com materiais</li>
          </ul>
        </div>
        <small style="opacity:.75">IFSP · Piracicaba · 2026</small>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          <h2>${isLogin ? "Entrar" : "Criar conta"}</h2>
          <p class="muted">${isLogin ? "Bem-vindo de volta! Acesse sua conta." : "Comece a organizar sua rotina de estudos."}</p>
          <form id="auth-form" novalidate>
            <div id="auth-error" class="form-error hidden"></div>
            ${isLogin ? "" : `<div class="field"><label for="nome">Nome</label><input class="input" id="nome" name="nome" required autocomplete="name" placeholder="Seu nome"></div>`}
            <div class="field"><label for="email">E-mail</label><input class="input" id="email" name="email" type="email" required autocomplete="email" placeholder="voce@email.com"></div>
            <div class="field"><label for="senha">Senha</label><input class="input" id="senha" name="senha" type="password" required minlength="6" autocomplete="${isLogin ? "current-password" : "new-password"}" placeholder="Mínimo de 6 caracteres"></div>
            <button class="btn btn-primary btn-block" type="submit">${icon(isLogin ? "logIn" : "plus")} ${isLogin ? "Entrar" : "Criar conta"}</button>
          </form>
          <div class="auth-switch">${isLogin ? "Não tem conta?" : "Já tem conta?"} <button type="button" id="auth-toggle">${isLogin ? "Cadastre-se" : "Entrar"}</button></div>
          <p class="auth-hint">Versão de demonstração: os dados ficam salvos neste navegador.</p>
        </div>
      </section>
    </div>`;

  document.getElementById("auth-toggle").onclick = () => {
    state.authMode = isLogin ? "register" : "login";
    renderAuth();
  };
  document.getElementById("auth-form").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const err = document.getElementById("auth-error");
    const email = f.email.value.trim();
    const senha = f.senha.value;
    try {
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Informe um e-mail válido.");
      if (!senha) throw new Error("Informe sua senha.");
      if (isLogin) {
        state.user = await Auth.login(email, senha);
      } else {
        if (!f.nome.value.trim()) throw new Error("Informe seu nome.");
        state.user = await Auth.register(f.nome.value, email, senha);
      }
      startApp();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove("hidden");
    }
  };
}

// =========================================================
// Estrutura (sidebar + topbar)
// =========================================================
function startApp() {
  Store.open(state.user.email);
  if (!state.pomo.disciplinaId && Store.subjects()[0]) state.pomo.disciplinaId = Store.subjects()[0].id;
  if (!location.hash) location.hash = "#/dashboard";
  renderShell();
}

function renderShell() {
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar" id="sidebar">
        <a class="brand" href="#/dashboard" style="text-decoration:none"><div class="brand-logo">${icon("logo")}</div><span class="brand-name">Estuda<span class="brand-plus">+</span></span></a>
        <nav class="nav" id="nav">
          ${ROUTES.map((r) => `<a href="#/${r.path}" data-path="${r.path}">${icon(r.icon)}<span>${r.title}</span></a>`).join("")}
        </nav>
        <div class="quote">"${esc(quote)}"<small>Frase do dia</small></div>
      </aside>
      <div class="backdrop hidden" id="backdrop"></div>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn menu-btn" id="menu-btn" aria-label="Abrir menu">${icon("menu")}</button>
          <h1 id="page-title"></h1>
          <div class="topbar-actions">
            <button class="icon-btn bell" id="bell-btn" aria-label="Notificações">${icon("bell")}<span class="ping hidden" id="ping"></span></button>
            <button class="icon-btn" id="theme-btn" aria-label="Alternar tema"></button>
            <div class="user-chip"><span class="avatar">${esc(state.user.nome.charAt(0))}</span><span class="name">${esc(state.user.nome.split(" ")[0])}</span></div>
            <button class="icon-btn" id="logout-btn" aria-label="Sair" title="Sair">${icon("logout")}</button>
          </div>
          <div class="dropdown hidden" id="notif-dd"></div>
        </header>
        <main class="content" id="content"></main>
      </div>
    </div>`;

  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const closeMenu = () => { sidebar.classList.remove("open"); backdrop.classList.add("hidden"); };
  document.getElementById("menu-btn").onclick = () => { sidebar.classList.add("open"); backdrop.classList.remove("hidden"); };
  backdrop.onclick = closeMenu;
  document.getElementById("nav").addEventListener("click", closeMenu);

  const themeBtn = document.getElementById("theme-btn");
  const paintTheme = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    themeBtn.innerHTML = icon(dark ? "sun" : "moon");
    themeBtn.title = dark ? "Modo claro" : "Modo escuro";
  };
  paintTheme();
  themeBtn.onclick = () => {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    paintTheme();
    renderPage();
  };

  const dd = document.getElementById("notif-dd");
  document.getElementById("bell-btn").onclick = (e) => {
    e.stopPropagation();
    if (dd.classList.contains("hidden")) { renderNotifications(); dd.classList.remove("hidden"); }
    else dd.classList.add("hidden");
  };
  document.addEventListener("click", (e) => { if (!dd.contains(e.target)) dd.classList.add("hidden"); });

  document.getElementById("logout-btn").onclick = () => {
    pomoPause();
    Auth.logout();
    state.user = null;
    state.authMode = "login";
    location.hash = "";
    renderAuth();
  };

  renderPage();
}

function renderNotifications() {
  const dd = document.getElementById("notif-dd");
  const list = upcomingAlerts();
  dd.innerHTML = `<h4>Prazos próximos</h4>` + (list.length
    ? list.map((t) => {
        const s = Store.subject(t.disciplinaId);
        const r = relative(t.prazo);
        return `<a class="notif" href="#/tarefas" style="color:inherit;text-decoration:none">
          <span class="dot" style="background:${s ? s.cor : "var(--muted)"};margin-top:6px"></span>
          <div><strong>${esc(t.titulo)}</strong><span class="muted">${esc(s ? s.nome : "")} · ${fmtDate(t.prazo)} · <span style="color:${r && r.cls === "late" ? "var(--danger)" : "var(--warning)"}">${r ? r.text : ""}</span></span></div>
        </a>`;
      }).join("")
    : `<div class="notif-empty">Nenhum prazo nos próximos 3 dias. 🎉</div>`);
}

function renderPage() {
  if (!state.user) return;
  const route = currentRoute();
  document.getElementById("page-title").textContent = route.title;
  document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.path === route.path));
  document.getElementById("ping").classList.toggle("hidden", upcomingAlerts().length === 0);
  document.title = `${route.title} · Estuda+`;
  route.render(document.getElementById("content"));
}

// =========================================================
// Dashboard (RF06)
// =========================================================
function renderDashboard(el) {
  const tasks = Store.tasks();
  const sessions = Store.sessions();
  const subjects = Store.subjects();
  const perDay = StatsStrategies.porDia(sessions);
  const perSubject = StatsStrategies.porDisciplina(sessions, subjects).filter((s) => s.horas > 0);
  const upcoming = tasks.filter((t) => t.status !== "concluida").sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 6);
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  el.innerHTML = `
    <div class="greeting">
      <h2>${hello}, ${esc(state.user.nome.split(" ")[0])} 👋</h2>
      <p>Veja como está sua semana de estudos.</p>
    </div>
    <div class="stats">
      <div class="card stat"><div class="label">Horas na semana</div><div class="value">${fmtHours(StatsStrategies.horasSemana(sessions))}</div></div>
      <div class="card stat"><div class="label">Tarefas pendentes</div><div class="value">${tasks.filter((t) => t.status !== "concluida").length}</div></div>
      <div class="card stat"><div class="label">Concluídas</div><div class="value success">${tasks.filter((t) => t.status === "concluida").length}</div></div>
      <div class="card stat"><div class="label">Disciplinas</div><div class="value">${subjects.length}</div></div>
    </div>
    <div class="dash-grid">
      <div class="card"><h3 class="card-title">Horas por dia</h3>${barChart(perDay)}</div>
      <div class="card"><h3 class="card-title">Por disciplina</h3>
        ${perSubject.length ? `<div class="donut-wrap">${donut(perSubject)}
          <div class="legend">${perSubject.map((s) => `<div class="legend-row"><span class="dot" style="background:${s.cor}"></span><span class="name">${esc(s.nome)}</span><span class="val">${fmtHours(s.horas)}</span></div>`).join("")}</div>
        </div>` : `<div class="empty">Nenhuma sessão registrada ainda.<br><a href="#/pomodoro">Comece um Pomodoro</a></div>`}
      </div>
    </div>
    <div class="card">
      <h3 class="card-title">Próximos prazos</h3>
      <div class="deadlines">
        ${upcoming.length ? upcoming.map((t) => deadlineRow(t)).join("") : `<div class="empty">Tudo em dia! Nenhuma tarefa pendente.</div>`}
      </div>
    </div>`;

  el.querySelectorAll("[data-complete]").forEach((cb) => {
    cb.onchange = () => {
      Store.updateTask(cb.dataset.complete, { status: "concluida" });
      toast("Tarefa concluída! ✅");
      renderPage();
    };
  });
}

function deadlineRow(t) {
  const s = Store.subject(t.disciplinaId);
  const r = relative(t.prazo);
  return `<div class="deadline">
    <input type="checkbox" class="check" data-complete="${t.id}" aria-label="Concluir ${esc(t.titulo)}">
    <span class="bar-color" style="background:${s ? s.cor : "var(--border)"}"></span>
    <div class="info"><strong>${esc(t.titulo)}</strong>
      <span class="meta">${esc(s ? s.nome : "Sem disciplina")} · ${fmtDate(t.prazo)}${r ? ` · <span class="${r.cls}">${r.text}</span>` : ""}</span></div>
    <div class="tags">${t.tipo === "prova" ? `<span class="badge badge-prova">Prova</span>` : ""}<span class="badge badge-${t.prioridade}">${PRIORITY_LABEL[t.prioridade]}</span></div>
  </div>`;
}

function barChart(data) {
  const W = 560, H = 220, padL = 34, padB = 26, padT = 10;
  const max = Math.max(1, Math.ceil(Math.max(...data.map((d) => d.horas)) * 2) / 2);
  const ticks = 4;
  const innerW = W - padL - 8, innerH = H - padB - padT;
  const bw = (innerW / data.length) * 0.62;
  let svg = `<svg class="bar-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Horas estudadas por dia">`;
  for (let i = 0; i <= ticks; i++) {
    const v = (max / ticks) * i;
    const y = padT + innerH - (v / max) * innerH;
    svg += `<line class="grid" x1="${padL}" x2="${W - 8}" y1="${y}" y2="${y}"/><text x="${padL - 8}" y="${y + 4}" text-anchor="end">${Number(v.toFixed(2)).toString().replace(".", ",")}</text>`;
  }
  data.forEach((d, i) => {
    const cx = padL + (innerW / data.length) * (i + 0.5);
    const h = (d.horas / max) * innerH;
    const y = padT + innerH - h;
    svg += `<rect class="bar" x="${cx - bw / 2}" y="${y}" width="${bw}" height="${Math.max(h, 0)}" rx="5"><title>${d.label}: ${fmtHours(d.horas)}</title></rect>`;
    svg += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${d.label}</text>`;
  });
  return svg + `</svg>`;
}

function donut(items) {
  const total = items.reduce((a, s) => a + s.horas, 0);
  const r = 15.9155, c = 2 * Math.PI * r;
  let offset = 0;
  const gap = items.length > 1 ? 0.8 : 0;
  const arcs = items.map((s) => {
    const len = (s.horas / total) * c;
    const seg = `<circle cx="21" cy="21" r="${r}" fill="none" stroke="${s.cor}" stroke-width="6" stroke-dasharray="${Math.max(len - gap, 0)} ${c - Math.max(len - gap, 0)}" stroke-dashoffset="${-offset}"><title>${esc(s.nome)}: ${fmtHours(s.horas)}</title></circle>`;
    offset += len;
    return seg;
  }).join("");
  return `<svg class="donut" viewBox="0 0 42 42" style="transform:rotate(-90deg)" role="img" aria-label="Horas por disciplina">${arcs}</svg>`;
}

// =========================================================
// Disciplinas (RF02)
// =========================================================
function renderSubjects(el) {
  const subjects = Store.subjects();
  const tasks = Store.tasks();
  const per = StatsStrategies.porDisciplina(Store.sessions(), subjects);
  let pickedColor = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];

  el.innerHTML = `
    <form class="card add-bar" id="subject-form">
      <input class="input" name="nome" placeholder="Nome da disciplina" required maxlength="60" aria-label="Nome da disciplina">
      <input class="input" name="professor" placeholder="Professor(a)" maxlength="60" aria-label="Professor(a)">
      <div class="colors" id="color-pick">${SUBJECT_COLORS.map((c) => `<button type="button" class="color-swatch ${c === pickedColor ? "selected" : ""}" style="background:${c}" data-color="${c}" aria-label="Cor ${c}"></button>`).join("")}</div>
      <button class="btn btn-primary" type="submit">${icon("plus")} Adicionar</button>
    </form>
    <div class="subject-grid">
      ${subjects.length ? subjects.map((s) => {
        const st = tasks.filter((t) => t.disciplinaId === s.id);
        const done = st.filter((t) => t.status === "concluida").length;
        const pct = st.length ? Math.round((done / st.length) * 100) : 0;
        const horas = per.find((p) => p.id === s.id)?.horas || 0;
        if (state.editingSubject === s.id) {
          return `<div class="card subject" style="--c:${s.cor}">
            <form class="subject-edit" data-edit-form="${s.id}">
              <input class="input" name="nome" value="${esc(s.nome)}" required maxlength="60" aria-label="Nome">
              <input class="input" name="professor" value="${esc(s.professor)}" maxlength="60" aria-label="Professor(a)">
              <div class="colors">${SUBJECT_COLORS.map((c) => `<label><input type="radio" name="cor" value="${c}" ${c === s.cor ? "checked" : ""} hidden><span class="color-swatch ${c === s.cor ? "selected" : ""}" style="display:inline-block;background:${c}"></span></label>`).join("")}</div>
              <div class="actions"><button type="button" class="btn btn-outline btn-sm" data-cancel-edit>Cancelar</button><button class="btn btn-primary btn-sm" type="submit">Salvar</button></div>
            </form>
          </div>`;
        }
        return `<div class="card subject" style="--c:${s.cor}">
          <div class="subject-head">
            <div><h3>${esc(s.nome)}</h3><div class="prof">${esc(s.professor || "—")}</div></div>
            <div style="display:flex">
              <button class="icon-btn" data-edit="${s.id}" aria-label="Editar">${icon("edit")}</button>
              <button class="icon-btn danger" data-del="${s.id}" aria-label="Excluir">${icon("trash")}</button>
            </div>
          </div>
          <div class="row"><span>${st.length} ${st.length === 1 ? "tarefa" : "tarefas"}</span><span>${fmtHours(horas)} estudadas</span></div>
          <div class="progress"><div style="width:${pct}%"></div></div>
          <small>${pct}% concluído</small>
        </div>`;
      }).join("") : `<div class="card empty" style="grid-column:1/-1">Cadastre sua primeira disciplina acima.</div>`}
    </div>`;

  el.querySelector("#color-pick").onclick = (e) => {
    const b = e.target.closest("[data-color]");
    if (!b) return;
    pickedColor = b.dataset.color;
    el.querySelectorAll("#color-pick .color-swatch").forEach((x) => x.classList.toggle("selected", x === b));
  };
  el.querySelector("#subject-form").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.nome.value.trim()) return;
    Store.addSubject(f.nome.value.trim(), f.professor.value.trim(), pickedColor);
    toast("Disciplina adicionada.");
    renderPage();
  };
  el.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => { state.editingSubject = b.dataset.edit; renderPage(); }));
  el.querySelectorAll("[data-cancel-edit]").forEach((b) => (b.onclick = () => { state.editingSubject = null; renderPage(); }));
  el.querySelectorAll("[data-edit-form]").forEach((f) => {
    f.addEventListener("change", (e) => {
      if (e.target.name === "cor") f.querySelectorAll(".color-swatch").forEach((sw) => sw.classList.toggle("selected", sw.previousElementSibling.checked));
    });
    f.onsubmit = (e) => {
      e.preventDefault();
      Store.updateSubject(f.dataset.editForm, { nome: f.nome.value.trim(), professor: f.professor.value.trim(), cor: f.cor.value });
      state.editingSubject = null;
      toast("Disciplina atualizada.");
      renderPage();
    };
  });
  el.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => {
    const s = Store.subject(b.dataset.del);
    if (confirm(`Excluir "${s.nome}"? As tarefas e sessões desta disciplina também serão removidas.`)) {
      Store.removeSubject(s.id);
      toast("Disciplina excluída.");
      renderPage();
    }
  }));
}

// =========================================================
// Tarefas (RF03) — quadro com filtros
// =========================================================
function renderTasks(el) {
  const subjects = Store.subjects();
  const f = state.taskFilter;
  const tasks = Store.tasks()
    .filter((t) => (!f.disciplina || t.disciplinaId === f.disciplina) && (!f.status || t.status === f.status))
    .sort((a, b) => a.prazo.localeCompare(b.prazo));

  el.innerHTML = `
    <div class="toolbar">
      <span class="total">${tasks.length} ${tasks.length === 1 ? "tarefa" : "tarefas"} ${f.disciplina || f.status ? "no filtro" : "no total"}</span>
      <select class="select" id="f-disc" aria-label="Filtrar por disciplina">
        <option value="">Todas as disciplinas</option>
        ${subjects.map((s) => `<option value="${s.id}" ${f.disciplina === s.id ? "selected" : ""}>${esc(s.nome)}</option>`).join("")}
      </select>
      <select class="select" id="f-status" aria-label="Filtrar por status">
        <option value="">Todos os status</option>
        ${STATUS.map((s) => `<option value="${s.id}" ${f.status === s.id ? "selected" : ""}>${s.label}</option>`).join("")}
      </select>
      <button class="btn btn-primary" id="new-task">${icon("plus")} Nova tarefa</button>
    </div>
    <div class="kanban">
      ${STATUS.map((col) => {
        const list = tasks.filter((t) => t.status === col.id);
        return `<section class="column" data-col="${col.id}">
          <div class="column-head"><h3>${col.label}</h3><span class="count">${list.length}</span></div>
          ${list.map((t) => taskCard(t, col.id)).join("") || `<div class="empty" style="padding:20px 8px">Nada por aqui.</div>`}
        </section>`;
      }).join("")}
    </div>`;

  el.querySelector("#f-disc").onchange = (e) => { f.disciplina = e.target.value; renderPage(); };
  el.querySelector("#f-status").onchange = (e) => { f.status = e.target.value; renderPage(); };
  el.querySelector("#new-task").onclick = () => openTaskModal();
  el.querySelectorAll("[data-move]").forEach((b) => (b.onclick = () => {
    const [id, to] = b.dataset.move.split(":");
    Store.updateTask(id, { status: to });
    renderPage();
  }));
  el.querySelectorAll("[data-open]").forEach((b) => (b.onclick = () => openTaskModal(Store.task(b.dataset.open))));
  el.querySelectorAll("[data-del-task]").forEach((b) => (b.onclick = () => {
    const t = Store.task(b.dataset.delTask);
    if (confirm(`Excluir a tarefa "${t.titulo}"?`)) { Store.removeTask(t.id); toast("Tarefa excluída."); renderPage(); }
  }));

  // Arrastar e soltar entre colunas
  el.querySelectorAll(".task").forEach((card) => {
    card.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", card.dataset.id); card.classList.add("dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
  });
  el.querySelectorAll(".column").forEach((col) => {
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drag-over"); });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = e.dataTransfer.getData("text/plain");
      if (id && Store.task(id) && Store.task(id).status !== col.dataset.col) { Store.updateTask(id, { status: col.dataset.col }); renderPage(); }
    });
  });
}

function taskCard(t, colId) {
  const s = Store.subject(t.disciplinaId);
  const others = STATUS.filter((x) => x.id !== colId);
  const r = t.status !== "concluida" ? relative(t.prazo) : null;
  return `<article class="card task" draggable="true" data-id="${t.id}">
    <div class="task-head"><strong data-open="${t.id}" title="Editar">${esc(t.titulo)}</strong>
      <button class="icon-btn danger" data-del-task="${t.id}" aria-label="Excluir">${icon("trash")}</button></div>
    <div class="subj"><span class="dot" style="background:${s ? s.cor : "var(--muted)"}"></span>${esc(s ? s.nome : "Sem disciplina")}</div>
    <div class="mid">
      <span class="badge badge-${t.prioridade}">${PRIORITY_LABEL[t.prioridade]}</span>
      ${t.tipo === "prova" ? `<span class="badge badge-prova">Prova</span>` : ""}
      <span class="date" ${r ? `style="color:${r.cls === "late" ? "var(--danger)" : "var(--warning)"}"` : ""}>${fmtDate(t.prazo)}</span>
    </div>
    <div class="moves">${others.map((o) => `<button class="btn btn-outline" data-move="${t.id}:${o.id}">→ ${o.label}</button>`).join("")}</div>
  </article>`;
}

function openTaskModal(task = null, presetDate = null) {
  const subjects = Store.subjects();
  if (!subjects.length) { toast("Cadastre uma disciplina antes de criar tarefas."); location.hash = "#/disciplinas"; return; }
  const t = task || { titulo: "", disciplinaId: state.taskFilter.disciplina || subjects[0].id, prazo: presetDate || isoDate(addDays(new Date(), 7)), prioridade: "media", tipo: "entrega", status: "pendente" };
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h3 id="modal-title">${task ? "Editar tarefa" : "Nova tarefa"}</h3>
      <form id="task-form">
        <div class="field"><label for="t-titulo">Título</label><input class="input" id="t-titulo" name="titulo" required maxlength="80" value="${esc(t.titulo)}" placeholder="Ex.: Lista de exercícios 3"></div>
        <div class="field"><label for="t-disc">Disciplina</label><select class="select" id="t-disc" name="disciplinaId">${subjects.map((s) => `<option value="${s.id}" ${s.id === t.disciplinaId ? "selected" : ""}>${esc(s.nome)}</option>`).join("")}</select></div>
        <div class="row2">
          <div class="field"><label for="t-prazo">Prazo</label><input class="input" id="t-prazo" type="date" name="prazo" required value="${t.prazo}"></div>
          <div class="field"><label for="t-tipo">Tipo</label><select class="select" id="t-tipo" name="tipo"><option value="entrega" ${t.tipo === "entrega" ? "selected" : ""}>Entrega</option><option value="prova" ${t.tipo === "prova" ? "selected" : ""}>Prova</option></select></div>
        </div>
        <div class="row2">
          <div class="field"><label for="t-prio">Prioridade</label><select class="select" id="t-prio" name="prioridade">${Object.entries(PRIORITY_LABEL).map(([k, v]) => `<option value="${k}" ${k === t.prioridade ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="field"><label for="t-status">Status</label><select class="select" id="t-status" name="status">${STATUS.map((s) => `<option value="${s.id}" ${s.id === t.status ? "selected" : ""}>${s.label}</option>`).join("")}</select></div>
        </div>
        <div class="modal-actions"><button type="button" class="btn btn-outline" data-close>Cancelar</button><button class="btn btn-primary" type="submit">${task ? "Salvar" : "Criar tarefa"}</button></div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { overlay.remove(); document.removeEventListener("keydown", onKey); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });
  overlay.querySelector("[data-close]").onclick = close;
  overlay.querySelector("#t-titulo").focus();
  overlay.querySelector("#task-form").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    const data = { titulo: f.titulo.value.trim(), disciplinaId: f.disciplinaId.value, prazo: f.prazo.value, tipo: f.tipo.value, prioridade: f.prioridade.value, status: f.status.value };
    if (!data.titulo || !data.prazo) return;
    if (task) { Store.updateTask(task.id, data); toast("Tarefa atualizada."); }
    else { Store.addTask(data); toast("Tarefa criada."); }
    close();
    renderPage();
  };
}

// =========================================================
// Calendário (RF04)
// =========================================================
function renderCalendar(el) {
  const m = state.calMonth;
  const year = m.getFullYear(), month = m.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const todayIso = isoDate(new Date());
  const byDate = {};
  Store.tasks().forEach((t) => { (byDate[t.prazo] ||= []).push(t); });
  const rawLabel = m.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  let cells = "";
  for (let i = 0; i < first; i++) cells += `<div class="cal-day empty-cell"></div>`;
  for (let d = 1; d <= days; d++) {
    const iso = isoDate(new Date(year, month, d));
    const evs = (byDate[iso] || []).sort((a, b) => (a.tipo === "prova" ? -1 : 1));
    cells += `<div class="cal-day ${iso === todayIso ? "today" : ""}" data-day="${iso}" title="Clique para adicionar uma tarefa">
      <span class="num">${d}</span>
      ${evs.map((t) => `<div class="cal-ev ${t.tipo} ${t.status === "concluida" ? "done" : ""}" data-ev="${t.id}" title="${esc(t.titulo)}">${esc(t.titulo)}</div>`).join("")}
    </div>`;
  }

  el.innerHTML = `
    <div class="card">
      <div class="cal-head">
        <button class="btn btn-outline btn-icon" id="cal-prev" aria-label="Mês anterior">${icon("chevronLeft")}</button>
        <div style="text-align:center"><h2>${label}</h2><button class="btn btn-ghost btn-sm" id="cal-today">Hoje</button></div>
        <button class="btn btn-outline btn-icon" id="cal-next" aria-label="Próximo mês">${icon("chevronRight")}</button>
      </div>
      <div class="cal-grid">
        ${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}
        ${cells}
      </div>
      <div class="cal-legend"><span><i class="dot" style="background:var(--primary)"></i>Prova</span><span><i class="dot" style="background:var(--success)"></i>Entrega</span></div>
    </div>`;

  el.querySelector("#cal-prev").onclick = () => { state.calMonth = new Date(year, month - 1, 1); renderPage(); };
  el.querySelector("#cal-next").onclick = () => { state.calMonth = new Date(year, month + 1, 1); renderPage(); };
  el.querySelector("#cal-today").onclick = () => { const d = new Date(); state.calMonth = new Date(d.getFullYear(), d.getMonth(), 1); renderPage(); };
  el.querySelectorAll("[data-day]").forEach((c) => (c.onclick = (e) => {
    const ev = e.target.closest("[data-ev]");
    if (ev) openTaskModal(Store.task(ev.dataset.ev));
    else openTaskModal(null, c.dataset.day);
  }));
}

// =========================================================
// Pomodoro (RF05)
// =========================================================
let pomoInterval = null;

function pomoTick() {
  const p = state.pomo;
  if (!p.running) return;
  p.remaining = Math.max(0, Math.round((p.endAt - Date.now()) / 1000));
  if (p.remaining === 0) pomoFinish();
  paintPomo();
}
function pomoStart() {
  const p = state.pomo;
  if (p.mode === "foco" && !Store.subject(p.disciplinaId)) { toast("Selecione uma disciplina."); return; }
  p.running = true;
  p.endAt = Date.now() + p.remaining * 1000;
  clearInterval(pomoInterval);
  pomoInterval = setInterval(pomoTick, 250);
  paintPomo();
}
function pomoPause() {
  const p = state.pomo;
  if (p.running) p.remaining = Math.max(0, Math.round((p.endAt - Date.now()) / 1000));
  p.running = false;
  clearInterval(pomoInterval);
  paintPomo();
}
function pomoReset() {
  pomoPause();
  state.pomo.remaining = state.pomo.durations[state.pomo.mode];
  paintPomo();
}
function pomoSetMode(mode) {
  pomoPause();
  state.pomo.mode = mode;
  state.pomo.remaining = state.pomo.durations[mode];
  if (currentRoute().path === "pomodoro") renderPage();
}
function pomoFinish() {
  const p = state.pomo;
  pomoPause();
  beep();
  if (p.mode === "foco") {
    const min = Math.round(p.durations.foco / 60);
    Store.addSession(p.disciplinaId, min);
    p.cycles++;
    const s = Store.subject(p.disciplinaId);
    toast(`Sessão de ${min} min de ${s ? s.nome : "estudo"} registrada! Hora da pausa.`);
    notify("Pomodoro concluído!", "Sessão registrada. Faça uma pausa de 5 minutos.");
    pomoSetMode("pausa");
  } else {
    toast("Pausa encerrada. Bora focar!");
    notify("Pausa encerrada", "Hora de voltar aos estudos.");
    pomoSetMode("foco");
  }
  if (currentRoute().path === "pomodoro" || currentRoute().path === "dashboard") renderPage();
}
function pomoSaveEarly() {
  const p = state.pomo;
  const elapsed = p.durations.foco - (p.running ? Math.round((p.endAt - Date.now()) / 1000) : p.remaining);
  const min = Math.floor(elapsed / 60);
  if (min < 1) { toast("Estude pelo menos 1 minuto para registrar a sessão."); return; }
  Store.addSession(p.disciplinaId, min);
  toast(`Sessão de ${min} min registrada.`);
  pomoReset();
  renderPage();
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.15, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* sem áudio */ }
}
function notify(title, body) {
  try { if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body }); } catch { /* ignore */ }
}

function paintPomo() {
  const p = state.pomo;
  const total = p.durations[p.mode];
  document.title = p.running ? `${fmtClock(p.remaining)} · ${p.mode === "foco" ? "Foco" : "Pausa"} · Estuda+` : `${currentRoute().title} · Estuda+`;
  const time = document.getElementById("pomo-time");
  if (!time) return;
  time.textContent = fmtClock(p.remaining);
  const prog = document.getElementById("pomo-prog");
  const c = 2 * Math.PI * 108;
  prog.style.strokeDashoffset = c * (p.remaining / total);
  const btn = document.getElementById("pomo-toggle");
  btn.innerHTML = p.running ? `${icon("pauseIcon")} Pausar` : `${icon("play")} ${p.remaining < total ? "Continuar" : "Iniciar"}`;
  document.getElementById("pomo-disc").disabled = p.running;
  const early = document.getElementById("pomo-save");
  if (early) early.classList.toggle("hidden", !(p.mode === "foco" && p.remaining < total));
}

function renderPomodoro(el) {
  const p = state.pomo;
  const subjects = Store.subjects();
  if (!Store.subject(p.disciplinaId) && subjects[0]) p.disciplinaId = subjects[0].id;
  const todayIso = isoDate(new Date());
  const todays = Store.sessions().filter((s) => isoDate(new Date(s.data)) === todayIso).sort((a, b) => b.data.localeCompare(a.data));
  const totalMin = todays.reduce((a, s) => a + s.minutos, 0);
  const c = 2 * Math.PI * 108;

  el.innerHTML = `
    <div class="pomo-grid">
      <div class="card pomo">
        <div class="seg" role="tablist">
          <button class="${p.mode === "foco" ? "active" : ""}" data-mode="foco">Foco · 25</button>
          <button class="${p.mode === "pausa" ? "active" : ""}" data-mode="pausa">Pausa · 5</button>
        </div>
        <div class="ring ${p.mode}">
          <svg viewBox="0 0 240 240"><circle class="track" cx="120" cy="120" r="108" fill="none" stroke-width="12"/>
            <circle id="pomo-prog" class="prog" cx="120" cy="120" r="108" fill="none" stroke-width="12" stroke-dasharray="${c}" stroke-dashoffset="${c * (p.remaining / p.durations[p.mode])}"/></svg>
          <div class="time" id="pomo-time">${fmtClock(p.remaining)}</div>
        </div>
        <select class="select" id="pomo-disc" aria-label="Disciplina da sessão">
          ${subjects.length ? subjects.map((s) => `<option value="${s.id}" ${s.id === p.disciplinaId ? "selected" : ""}>${esc(s.nome)}</option>`).join("") : `<option>Cadastre uma disciplina</option>`}
        </select>
        <div class="pomo-actions">
          <button class="btn btn-primary" id="pomo-toggle"></button>
          <button class="btn btn-outline btn-icon" id="pomo-reset" aria-label="Reiniciar" title="Reiniciar">${icon("reset")}</button>
        </div>
        <button class="btn btn-ghost btn-sm hidden" id="pomo-save">${icon("check")} Encerrar e registrar sessão</button>
        <span class="pomo-cycles">${p.cycles} ${p.cycles === 1 ? "ciclo concluído" : "ciclos concluídos"} nesta visita</span>
      </div>
      <div class="card">
        <h3 class="card-title" style="margin-bottom:0">Sessões de hoje</h3>
        <div class="today-total">${totalMin} min</div>
        ${todays.length ? todays.map((s) => {
          const sub = Store.subject(s.disciplinaId);
          return `<div class="session-row"><span class="left"><span class="dot" style="background:${sub ? sub.cor : "var(--muted)"}"></span>${esc(sub ? sub.nome : "—")}</span>
            <span style="display:flex;align-items:center;gap:4px">${s.minutos}m <button class="icon-btn danger" data-del-session="${s.id}" aria-label="Remover sessão" style="width:26px;height:26px">${icon("close")}</button></span></div>`;
        }).join("") : `<div class="empty">Nenhuma sessão hoje. Que tal começar agora?</div>`}
      </div>
    </div>`;

  el.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => pomoSetMode(b.dataset.mode)));
  el.querySelector("#pomo-disc").onchange = (e) => { p.disciplinaId = e.target.value; };
  el.querySelector("#pomo-toggle").onclick = () => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    p.running ? pomoPause() : pomoStart();
  };
  el.querySelector("#pomo-reset").onclick = pomoReset;
  el.querySelector("#pomo-save").onclick = pomoSaveEarly;
  el.querySelectorAll("[data-del-session]").forEach((b) => (b.onclick = () => { Store.removeSession(b.dataset.delSession); renderPage(); }));
  paintPomo();
}

// =========================================================
// Grupos de estudo (RF07)
// =========================================================
function renderGroups(el) {
  const me = state.user;
  const groups = Groups.mine(me.email);

  el.innerHTML = `
    <div class="groups-top">
      <form class="card" id="g-create">
        <h3 class="card-title">Criar grupo</h3>
        <div class="inline-form"><input class="input" name="nome" placeholder="Nome do grupo" required maxlength="50" aria-label="Nome do grupo">
        <button class="btn btn-primary btn-icon" type="submit" aria-label="Criar grupo">${icon("plus")}</button></div>
      </form>
      <form class="card" id="g-join">
        <h3 class="card-title">Entrar por convite</h3>
        <div class="inline-form"><input class="input" name="codigo" placeholder="Ex: WEB2-7K" required maxlength="10" aria-label="Código de convite" style="text-transform:uppercase">
        <button class="btn btn-soft" type="submit">Entrar</button></div>
      </form>
    </div>
    <div class="groups-grid">
      ${groups.length ? groups.map((g) => `
        <div class="card">
          <div class="group-head">
            <h3>${esc(g.nome)}</h3>
            <button class="code-chip" data-copy="${esc(g.codigo)}" title="Copiar código de convite">${icon("copy")} ${esc(g.codigo)}</button>
          </div>
          <div class="goal">🎯 <span>${esc(g.meta)}</span><button data-goal="${g.id}" aria-label="Editar meta" title="Editar meta">${icon("edit")}</button></div>
          <div class="avatars">${g.membros.map((m) => `<span title="${esc(m.nome)}">${esc(m.nome.charAt(0))}</span>`).join("")}</div>
          <div class="materials">
            <h4>Materiais</h4>
            ${g.materiais.length ? g.materiais.map((mt) => `<div class="material">${icon(mt.url ? "link" : "file")}
              ${mt.url ? `<a href="${esc(mt.url)}" target="_blank" rel="noopener noreferrer">${esc(mt.titulo)}</a>` : `<span>${esc(mt.titulo)}</span>`}
              <button class="icon-btn danger" data-del-mat="${g.id}:${mt.id}" aria-label="Remover material">${icon("close")}</button></div>`).join("") : `<p class="muted" style="margin:0">Nenhum material compartilhado.</p>`}
            <form class="inline-form" data-add-mat="${g.id}">
              <input class="input" name="mat" placeholder="Título ou link do material" required maxlength="200" aria-label="Título ou link do material">
              <button class="btn btn-outline btn-icon" type="submit" aria-label="Adicionar material">${icon("plus")}</button>
            </form>
          </div>
          <div style="text-align:right;margin-top:12px"><button class="btn btn-ghost btn-sm" data-leave="${g.id}" style="color:var(--danger)">Sair do grupo</button></div>
        </div>`).join("") : `<div class="card empty" style="grid-column:1/-1">Você ainda não participa de nenhum grupo. Crie um ou entre com um código.</div>`}
    </div>`;

  el.querySelector("#g-create").onsubmit = (e) => {
    e.preventDefault();
    const g = Groups.create(e.target.nome.value.trim(), me.email, me.nome);
    toast(`Grupo criado! Código de convite: ${g.codigo}`);
    renderPage();
  };
  el.querySelector("#g-join").onsubmit = (e) => {
    e.preventDefault();
    try { const g = Groups.join(e.target.codigo.value, me.email, me.nome); toast(`Você entrou em "${g.nome}".`); renderPage(); }
    catch (ex) { toast(ex.message); }
  };
  el.querySelectorAll("[data-copy]").forEach((b) => (b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast("Código copiado!"); }
    catch { toast(`Código: ${b.dataset.copy}`); }
  }));
  el.querySelectorAll("[data-goal]").forEach((b) => (b.onclick = () => {
    const g = groups.find((x) => x.id === b.dataset.goal);
    const meta = prompt("Meta do grupo:", g.meta);
    if (meta && meta.trim()) { Groups.update(g.id, (x) => (x.meta = meta.trim())); renderPage(); }
  }));
  el.querySelectorAll("[data-add-mat]").forEach((f) => (f.onsubmit = (e) => {
    e.preventDefault();
    const v = f.mat.value.trim();
    const isUrl = /^https?:\/\/\S+$/i.test(v);
    let titulo = v;
    if (isUrl) { try { titulo = new URL(v).hostname.replace(/^www\./, "") + new URL(v).pathname.replace(/\/$/, ""); } catch { /* mantém */ } }
    Groups.update(f.dataset.addMat, (g) => g.materiais.push({ id: uid(), titulo, url: isUrl ? v : "" }));
    renderPage();
  }));
  el.querySelectorAll("[data-del-mat]").forEach((b) => (b.onclick = () => {
    const [gid, mid] = b.dataset.delMat.split(":");
    Groups.update(gid, (g) => (g.materiais = g.materiais.filter((m) => m.id !== mid)));
    renderPage();
  }));
  el.querySelectorAll("[data-leave]").forEach((b) => (b.onclick = () => {
    if (confirm("Sair deste grupo?")) { Groups.leave(b.dataset.leave, me.email); renderPage(); }
  }));
}

// =========================================================
// Inicialização
// =========================================================
window.addEventListener("hashchange", () => {
  if (!state.user) return;
  state.editingSubject = null;
  renderPage();
});
window.addEventListener("storage", (e) => {
  if (state.user && e.key === KEYS.groups && currentRoute().path === "grupos") renderPage();
});

state.user = Auth.current();
if (state.user) startApp();
else renderAuth();
