import { lerStorage, salvarStorage } from "@/lib/storage";
import { uid } from "@/lib/utils";

// Study groups (RF07) are still browser-only: the 1st-stage API covers only auth,
// subjects and tasks (section 8.4). Groups are shared by every account in the same
// browser, which is enough to demo invite codes. The grupo_estudo, membro and
// material tables already exist, so the 2nd stage swaps this module for API calls.

export interface Membro {
  email?: string;
  nome: string;
}

export interface Material {
  id: string;
  titulo: string;
  url: string;
}

export interface Grupo {
  id: string;
  nome: string;
  meta: string;
  codigo: string;
  membros: Membro[];
  materiais: Material[];
}

const CHAVE = "estuda:grupos";
const CODIGO_DEMO = "WEB2-7K";

const todos = (): Grupo[] => lerStorage<Grupo[]>(CHAVE, []);
const salvarTodos = (grupos: Grupo[]) => salvarStorage(CHAVE, grupos);

// 6 chars without look-alikes (0/O, 1/I), shown as XXX-XXX.
function gerarCodigo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const c = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${c.slice(0, 3)}-${c.slice(3)}`;
}

function alterar(id: string, mudar: (g: Grupo) => void): void {
  const lista = todos();
  const grupo = lista.find((g) => g.id === id);
  if (grupo) {
    mudar(grupo);
    salvarTodos(lista);
  }
}

export const gruposStorage = {
  meus: (email: string): Grupo[] => todos().filter((g) => g.membros.some((m) => m.email === email)),

  criar(nome: string, membro: Membro): Grupo {
    const grupo: Grupo = { id: uid(), nome, meta: "Definir meta do grupo", codigo: gerarCodigo(), membros: [membro], materiais: [] };
    salvarTodos([...todos(), grupo]);
    return grupo;
  },

  entrar(codigo: string, membro: Membro): Grupo {
    const lista = todos();
    const grupo = lista.find((g) => g.codigo.toUpperCase() === codigo.trim().toUpperCase());
    if (!grupo) throw new Error("Código de convite não encontrado.");
    if (grupo.membros.some((m) => m.email === membro.email)) throw new Error("Você já participa deste grupo.");
    grupo.membros.push(membro);
    salvarTodos(lista);
    return grupo;
  },

  definirMeta: (id: string, meta: string) => alterar(id, (g) => (g.meta = meta)),

  adicionarMaterial(id: string, entrada: string): void {
    const ehUrl = /^https?:\/\/\S+$/i.test(entrada);
    let titulo = entrada;
    if (ehUrl) {
      try {
        const url = new URL(entrada);
        titulo = url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, "");
      } catch {
        /* keep raw text as title */
      }
    }
    alterar(id, (g) => g.materiais.push({ id: uid(), titulo, url: ehUrl ? entrada : "" }));
  },

  removerMaterial: (id: string, materialId: string) =>
    alterar(id, (g) => (g.materiais = g.materiais.filter((m) => m.id !== materialId))),

  sair(id: string, email: string): void {
    const lista = todos();
    const grupo = lista.find((g) => g.id === id);
    if (!grupo) return;
    grupo.membros = grupo.membros.filter((m) => m.email !== email);
    // A group with no real account left is deleted.
    salvarTodos(grupo.membros.some((m) => m.email) ? lista : lista.filter((g) => g.id !== id));
  },

  // Demo group of the presentation; every account joins it on first visit.
  garantirGrupoDemo(membro: Membro): void {
    const lista = todos();
    let grupo = lista.find((g) => g.codigo === CODIGO_DEMO);
    if (!grupo) {
      grupo = {
        id: uid(),
        nome: "Squad Web 2",
        meta: "Finalizar backlog da sprint 2",
        codigo: CODIGO_DEMO,
        membros: [{ nome: "Victor" }, { nome: "Ryan" }, { nome: "Eduardo" }, { nome: "Gabriel" }],
        materiais: [
          { id: uid(), titulo: "Documentação NestJS", url: "https://docs.nestjs.com" },
          { id: uid(), titulo: "Guia do Prisma", url: "https://www.prisma.io/docs" },
        ],
      };
      lista.push(grupo);
    }
    if (!grupo.membros.some((m) => m.email === membro.email)) grupo.membros.push(membro);
    salvarTodos(lista);
  },
};

export const CHAVE_GRUPOS = CHAVE;
