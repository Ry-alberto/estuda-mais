import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useUsuario } from "@/features/auth/AuthProvider";
import { disciplinasService, type Disciplina, type DisciplinaInput } from "@/features/disciplinas/disciplinas.service";
import { sessoesStorage, type SessaoEstudo } from "@/features/pomodoro/sessoes.storage";
import { tarefasService, type Tarefa, type TarefaInput } from "@/features/tarefas/tarefas.service";
import { mensagemDeErro } from "@/lib/api";
import { uid } from "@/lib/utils";

// Shared study data for every page (dashboard, board, calendar, bell...).
// Loaded once after login; each mutation calls the API first and only updates
// local state when the server confirms, so the screen never shows unsaved data.
interface DadosContextValue {
  disciplinas: Disciplina[];
  tarefas: Tarefa[];
  sessoes: SessaoEstudo[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
  disciplina: (id: string) => Disciplina | undefined;
  criarDisciplina: (dados: DisciplinaInput) => Promise<Disciplina>;
  atualizarDisciplina: (id: string, dados: Partial<DisciplinaInput>) => Promise<void>;
  excluirDisciplina: (id: string) => Promise<void>;
  criarTarefa: (dados: TarefaInput) => Promise<void>;
  atualizarTarefa: (id: string, dados: Partial<TarefaInput>) => Promise<void>;
  excluirTarefa: (id: string) => Promise<void>;
  registrarSessao: (disciplinaId: string, minutos: number) => void;
  removerSessao: (id: string) => void;
}

const DadosContext = createContext<DadosContextValue | null>(null);

export function DadosProvider({ children }: { children: ReactNode }) {
  const usuario = useUsuario();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [sessoes, setSessoes] = useState<SessaoEstudo[]>(() => sessoesStorage.listar(usuario.id));
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    Promise.all([disciplinasService.listar(), tarefasService.listar()])
      .then(([d, t]) => {
        if (cancelado) return;
        setDisciplinas(d);
        setTarefas(t);
      })
      .catch((e: unknown) => !cancelado && setErro(mensagemDeErro(e)))
      .finally(() => !cancelado && setCarregando(false));
    return () => {
      cancelado = true;
    };
  }, [usuario.id, versao]);

  const atualizarSessoes = useCallback(
    (calcular: (atual: SessaoEstudo[]) => SessaoEstudo[]) => {
      setSessoes((atual) => {
        const proximas = calcular(atual);
        sessoesStorage.salvar(usuario.id, proximas);
        return proximas;
      });
    },
    [usuario.id],
  );

  const value = useMemo<DadosContextValue>(
    () => ({
      disciplinas,
      tarefas,
      sessoes,
      carregando,
      erro,
      recarregar: () => setVersao((v) => v + 1),
      disciplina: (id) => disciplinas.find((d) => d.id === id),

      criarDisciplina: async (dados) => {
        const nova = await disciplinasService.criar(dados);
        setDisciplinas((atual) => [...atual, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
        return nova;
      },
      atualizarDisciplina: async (id, dados) => {
        const atualizada = await disciplinasService.atualizar(id, dados);
        setDisciplinas((atual) => atual.map((d) => (d.id === id ? atualizada : d)));
      },
      excluirDisciplina: async (id) => {
        await disciplinasService.excluir(id);
        // The database cascades to the subject's tasks; mirror that locally.
        setDisciplinas((atual) => atual.filter((d) => d.id !== id));
        setTarefas((atual) => atual.filter((t) => t.disciplinaId !== id));
        atualizarSessoes((atual) => atual.filter((s) => s.disciplinaId !== id));
      },

      criarTarefa: async (dados) => {
        const nova = await tarefasService.criar(dados);
        setTarefas((atual) => [...atual, nova]);
      },
      atualizarTarefa: async (id, dados) => {
        const atualizada = await tarefasService.atualizar(id, dados);
        setTarefas((atual) => atual.map((t) => (t.id === id ? atualizada : t)));
      },
      excluirTarefa: async (id) => {
        await tarefasService.excluir(id);
        setTarefas((atual) => atual.filter((t) => t.id !== id));
      },

      registrarSessao: (disciplinaId, minutos) =>
        atualizarSessoes((atual) => [...atual, { id: uid(), disciplinaId, minutos, data: new Date().toISOString() }]),
      removerSessao: (id) => atualizarSessoes((atual) => atual.filter((s) => s.id !== id)),
    }),
    [disciplinas, tarefas, sessoes, carregando, erro, atualizarSessoes],
  );

  return <DadosContext.Provider value={value}>{children}</DadosContext.Provider>;
}

export function useDados(): DadosContextValue {
  const ctx = useContext(DadosContext);
  if (!ctx) throw new Error("useDados precisa estar dentro de <DadosProvider>.");
  return ctx;
}
