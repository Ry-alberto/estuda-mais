// =========================================================
// Camada de dados do front-end.
// Nesta versão estática os dados ficam no localStorage do navegador,
// organizados como "repositórios" (seção 10 do documento). Na integração
// com a API NestJS, basta trocar a implementação destes métodos por
// chamadas fetch aos endpoints /auth, /disciplinas, /tarefas etc.
// =========================================================

const KEYS = {
  users: "estuda:users",
  session: "estuda:session",
  data: (email) => `estuda:data:${email}`,
  groups: "estuda:groups",
  theme: "estuda:theme",
};

const SUBJECT_COLORS = ["#5b4bdb", "#2ec4b6", "#f2a33a", "#d946b0", "#3f8de0", "#e5484d", "#16a34a"];

// ---------- Utilidades ----------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento indisponível */ }
}
function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function daysUntil(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((parseDate(iso) - today) / 86400000);
}

// Hash da senha (no back-end real: bcrypt — RNF02).
async function hashPassword(password, salt) {
  const text = `${salt}:${password}`;
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// ---------- Dados de exemplo ----------
function seedData() {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = (n) => isoDate(addDays(t, n));
  const subjects = [
    { id: uid(), nome: "Programação Web 2", professor: "Prof. Marcos", cor: SUBJECT_COLORS[0] },
    { id: uid(), nome: "Banco de Dados", professor: "Profa. Lúcia", cor: SUBJECT_COLORS[1] },
    { id: uid(), nome: "Engenharia de Software", professor: "Prof. André", cor: SUBJECT_COLORS[2] },
    { id: uid(), nome: "Estatística", professor: "Profa. Helena", cor: SUBJECT_COLORS[3] },
  ];
  const [web, bd, es, est] = subjects.map((s) => s.id);
  const tasks = [
    { id: uid(), titulo: "Modelar MER", disciplinaId: bd, prazo: d(1), prioridade: "alta", status: "pendente", tipo: "entrega" },
    { id: uid(), titulo: "Entrega da 1ª etapa do projeto", disciplinaId: web, prazo: d(2), prioridade: "alta", status: "fazendo", tipo: "entrega" },
    { id: uid(), titulo: "Prova P1", disciplinaId: est, prazo: d(6), prioridade: "media", status: "pendente", tipo: "prova" },
    { id: uid(), titulo: "Diagrama de casos de uso", disciplinaId: es, prazo: d(9), prioridade: "baixa", status: "pendente", tipo: "entrega" },
    { id: uid(), titulo: "Prova de Banco de Dados", disciplinaId: bd, prazo: d(13), prioridade: "alta", status: "pendente", tipo: "prova" },
    { id: uid(), titulo: "Lista de exercícios SQL", disciplinaId: bd, prazo: d(-1), prioridade: "media", status: "concluida", tipo: "entrega" },
  ];
  // Sessões dos últimos 7 dias (minutos por disciplina)
  const plan = [
    [-6, web, 100], [-6, bd, 50],
    [-5, bd, 60], [-5, est, 40],
    [-4, es, 50],
    [-3, web, 120], [-3, bd, 55],
    [-2, web, 90], [-2, es, 60],
    [-1, bd, 75], [-1, est, 50],
    [0, web, 25],
  ];
  const sessions = plan.map(([off, disciplinaId, minutos]) => {
    const when = addDays(t, off); when.setHours(19, 0, 0, 0);
    return { id: uid(), disciplinaId, minutos, data: when.toISOString() };
  });
  return { subjects, tasks, sessions };
}

// ---------- Auth (RF01) ----------
const Auth = {
  current() {
    const email = load(KEYS.session, null);
    if (!email) return null;
    const users = load(KEYS.users, {});
    return users[email] ? { email, nome: users[email].nome } : null;
  },
  async register(nome, email, senha) {
    email = email.trim().toLowerCase();
    const users = load(KEYS.users, {});
    if (users[email]) throw new Error("Já existe uma conta com este e-mail.");
    if (senha.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres.");
    const salt = uid();
    users[email] = { nome: nome.trim(), salt, senhaHash: await hashPassword(senha, salt) };
    save(KEYS.users, users);
    save(KEYS.data(email), seedData());
    Groups.ensureDemoGroup(email, nome.trim());
    save(KEYS.session, email);
    return this.current();
  },
  async login(email, senha) {
    email = email.trim().toLowerCase();
    const users = load(KEYS.users, {});
    const u = users[email];
    if (!u || (await hashPassword(senha, u.salt)) !== u.senhaHash) {
      throw new Error("E-mail ou senha inválidos.");
    }
    save(KEYS.session, email);
    return this.current();
  },
  logout() {
    localStorage.removeItem(KEYS.session);
  },
};

// ---------- Repositório do usuário (RF02–RF06) ----------
const Store = {
  _email: null,
  _data: null,
  open(email) {
    this._email = email;
    this._data = load(KEYS.data(email), null) || seedData();
  },
  persist() { save(KEYS.data(this._email), this._data); },

  // Disciplinas
  subjects() { return this._data.subjects; },
  subject(id) { return this._data.subjects.find((s) => s.id === id); },
  addSubject(nome, professor, cor) {
    const s = { id: uid(), nome, professor, cor: cor || SUBJECT_COLORS[this._data.subjects.length % SUBJECT_COLORS.length] };
    this._data.subjects.push(s); this.persist(); return s;
  },
  updateSubject(id, patch) { Object.assign(this.subject(id), patch); this.persist(); },
  removeSubject(id) {
    this._data.subjects = this._data.subjects.filter((s) => s.id !== id);
    this._data.tasks = this._data.tasks.filter((t) => t.disciplinaId !== id);
    this._data.sessions = this._data.sessions.filter((s) => s.disciplinaId !== id);
    this.persist();
  },

  // Tarefas
  tasks() { return this._data.tasks; },
  task(id) { return this._data.tasks.find((t) => t.id === id); },
  addTask(data) { const t = { id: uid(), status: "pendente", ...data }; this._data.tasks.push(t); this.persist(); return t; },
  updateTask(id, patch) { Object.assign(this.task(id), patch); this.persist(); },
  removeTask(id) { this._data.tasks = this._data.tasks.filter((t) => t.id !== id); this.persist(); },

  // Sessões de estudo (RF05)
  sessions() { return this._data.sessions; },
  addSession(disciplinaId, minutos) {
    const s = { id: uid(), disciplinaId, minutos, data: new Date().toISOString() };
    this._data.sessions.push(s); this.persist(); return s;
  },
  removeSession(id) { this._data.sessions = this._data.sessions.filter((s) => s.id !== id); this.persist(); },
};

// ---------- Estatísticas (Strategy — seção 10.1) ----------
const StatsStrategies = {
  porDia(sessions, days = 7) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      const key = isoDate(day);
      const min = sessions.filter((s) => isoDate(new Date(s.data)) === key).reduce((a, s) => a + s.minutos, 0);
      out.push({ label: day.toLocaleDateString("pt-BR", { weekday: "short" }), date: key, horas: min / 60 });
    }
    return out;
  },
  porDisciplina(sessions, subjects) {
    return subjects
      .map((s) => ({
        ...s,
        horas: sessions.filter((x) => x.disciplinaId === s.id).reduce((a, x) => a + x.minutos, 0) / 60,
      }))
      .sort((a, b) => b.horas - a.horas);
  },
  horasSemana(sessions) {
    const limit = addDays(new Date(), -7);
    return sessions.filter((s) => new Date(s.data) >= limit).reduce((a, s) => a + s.minutos, 0) / 60;
  },
};

// ---------- Grupos de estudo (RF07) ----------
// Compartilhados entre as contas deste navegador, para simular convites.
const Groups = {
  all() { return load(KEYS.groups, []); },
  saveAll(list) { save(KEYS.groups, list); },
  mine(email) { return this.all().filter((g) => g.membros.some((m) => m.email === email)); },
  code() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c = "";
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return `${c.slice(0, 3)}-${c.slice(3)}`;
  },
  create(nome, email, userName) {
    const list = this.all();
    const g = { id: uid(), nome, meta: "Definir meta do grupo", codigo: this.code(), membros: [{ email, nome: userName }], materiais: [] };
    list.push(g); this.saveAll(list); return g;
  },
  join(codigo, email, userName) {
    const list = this.all();
    const g = list.find((x) => x.codigo.toUpperCase() === codigo.trim().toUpperCase());
    if (!g) throw new Error("Código de convite não encontrado.");
    if (g.membros.some((m) => m.email === email)) throw new Error("Você já participa deste grupo.");
    g.membros.push({ email, nome: userName });
    this.saveAll(list); return g;
  },
  update(id, fn) {
    const list = this.all();
    const g = list.find((x) => x.id === id);
    if (g) { fn(g); this.saveAll(list); }
  },
  leave(id, email) {
    let list = this.all();
    const g = list.find((x) => x.id === id);
    if (!g) return;
    g.membros = g.membros.filter((m) => m.email !== email);
    if (!g.membros.some((m) => m.email)) list = list.filter((x) => x.id !== id);
    this.saveAll(list);
  },
  ensureDemoGroup(email, userName) {
    const list = this.all();
    let g = list.find((x) => x.codigo === "WEB2-7K");
    if (!g) {
      g = {
        id: uid(), nome: "Squad Web 2", meta: "Finalizar backlog da sprint 2", codigo: "WEB2-7K",
        membros: [{ nome: "Victor" }, { nome: "Ryan" }, { nome: "Eduardo" }, { nome: "Gabriel" }],
        materiais: [
          { id: uid(), titulo: "Documentação NestJS", url: "https://docs.nestjs.com" },
          { id: uid(), titulo: "Guia do Prisma", url: "https://www.prisma.io/docs" },
        ],
      };
      list.push(g);
    }
    if (!g.membros.some((m) => m.email === email)) g.membros.push({ email, nome: userName });
    this.saveAll(list);
  },
};
