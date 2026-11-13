import { lerStorage, salvarStorage } from "@/lib/storage";

// Study sessions (RF05) are still kept in the browser: the 1st-stage API only
// covers auth, subjects and tasks (section 8.4). The sessao_estudo table already
// exists in the database, so the 2nd stage only swaps this module for POST /sessoes.
export interface SessaoEstudo {
  id: string;
  disciplinaId: string;
  minutos: number;
  data: string; // ISO timestamp of when the session was saved
}

const chave = (usuarioId: string) => `estuda:sessoes:${usuarioId}`;

export const sessoesStorage = {
  listar: (usuarioId: string): SessaoEstudo[] => lerStorage<SessaoEstudo[]>(chave(usuarioId), []),
  salvar: (usuarioId: string, sessoes: SessaoEstudo[]): void => salvarStorage(chave(usuarioId), sessoes),
};
