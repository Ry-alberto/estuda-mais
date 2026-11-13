import { api } from "@/lib/api";

export interface Disciplina {
  id: string;
  nome: string;
  professor: string | null;
  cor: string;
}

export interface DisciplinaInput {
  nome: string;
  professor?: string | null;
  cor?: string;
}

export const CORES_DISCIPLINA = ["#5b4bdb", "#2ec4b6", "#f2a33a", "#d946b0", "#3f8de0", "#e5484d", "#16a34a"];

// RF02 endpoints (section 8.4).
export const disciplinasService = {
  listar: () => api<Disciplina[]>("/disciplinas"),
  criar: (dados: DisciplinaInput) => api<Disciplina>("/disciplinas", { method: "POST", body: dados }),
  atualizar: (id: string, dados: Partial<DisciplinaInput>) =>
    api<Disciplina>(`/disciplinas/${id}`, { method: "PATCH", body: dados }),
  excluir: (id: string) => api<void>(`/disciplinas/${id}`, { method: "DELETE" }),
};
