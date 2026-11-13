import { api } from "@/lib/api";

export type TipoTarefa = "TAREFA" | "PROVA" | "ENTREGA";
export type Prioridade = "BAIXA" | "MEDIA" | "ALTA";
export type StatusTarefa = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA";

export interface Tarefa {
  id: string;
  titulo: string;
  tipo: TipoTarefa;
  prazo: string; // YYYY-MM-DD
  prioridade: Prioridade;
  status: StatusTarefa;
  disciplinaId: string;
}

export type TarefaInput = Omit<Tarefa, "id">;

export const TIPOS: { id: TipoTarefa; label: string }[] = [
  { id: "TAREFA", label: "Tarefa" },
  { id: "ENTREGA", label: "Entrega" },
  { id: "PROVA", label: "Prova" },
];

export const PRIORIDADES: { id: Prioridade; label: string }[] = [
  { id: "ALTA", label: "Alta" },
  { id: "MEDIA", label: "Média" },
  { id: "BAIXA", label: "Baixa" },
];

export const STATUS: { id: StatusTarefa; label: string }[] = [
  { id: "PENDENTE", label: "Pendente" },
  { id: "EM_ANDAMENTO", label: "Fazendo" },
  { id: "CONCLUIDA", label: "Concluída" },
];

export const rotulo = <T extends string>(lista: { id: T; label: string }[], id: T): string =>
  lista.find((item) => item.id === id)?.label ?? id;

// RF03 endpoints (section 8.4). Filtering by subject/status is done on the
// client because the board already holds every task; the API also supports
// ?disciplinaId=&status= for other clients.
export const tarefasService = {
  listar: () => api<Tarefa[]>("/tarefas"),
  criar: (dados: TarefaInput) => api<Tarefa>("/tarefas", { method: "POST", body: dados }),
  atualizar: (id: string, dados: Partial<TarefaInput>) =>
    api<Tarefa>(`/tarefas/${id}`, { method: "PATCH", body: dados }),
  excluir: (id: string) => api<void>(`/tarefas/${id}`, { method: "DELETE" }),
};
