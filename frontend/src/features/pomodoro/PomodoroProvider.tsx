import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDados } from "@/app/DadosProvider";
import { useToast } from "@/components/ui/toast";

export type ModoPomodoro = "foco" | "pausa";
export const DURACOES: Record<ModoPomodoro, number> = { foco: 25 * 60, pausa: 5 * 60 };

interface PomodoroContextValue {
  modo: ModoPomodoro;
  restante: number;
  rodando: boolean;
  ciclos: number;
  disciplinaId: string;
  setDisciplinaId: (id: string) => void;
  iniciar: () => void;
  pausar: () => void;
  reiniciar: () => void;
  trocarModo: (modo: ModoPomodoro) => void;
  encerrarESalvar: () => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function beep(): void {
  try {
    const ctx = new AudioContext();
    [0, 0.25, 0.5].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch {
    /* no audio available */
  }
}

function notificar(titulo: string, corpo: string): void {
  try {
    if ("Notification" in window && Notification.permission === "granted") new Notification(titulo, { body: corpo });
  } catch {
    /* notifications blocked */
  }
}

// Lives above the routes so the timer keeps running while the user switches pages.
// The countdown is based on an absolute end time (fimEm), not on counting ticks,
// so it stays correct even when the browser throttles timers in background tabs.
export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { disciplinas, disciplina, registrarSessao } = useDados();
  const toast = useToast();
  const [modo, setModo] = useState<ModoPomodoro>("foco");
  const [restante, setRestante] = useState(DURACOES.foco);
  const [rodando, setRodando] = useState(false);
  const [ciclos, setCiclos] = useState(0);
  const [disciplinaEscolhida, setDisciplinaId] = useState("");
  const fimEm = useRef(0);

  // Falls back to the first subject when none is chosen or the chosen one was deleted.
  const disciplinaId = disciplina(disciplinaEscolhida) ? disciplinaEscolhida : (disciplinas[0]?.id ?? "");

  const trocarModo = useCallback((novo: ModoPomodoro) => {
    setRodando(false);
    setModo(novo);
    setRestante(DURACOES[novo]);
  }, []);

  const finalizar = useCallback(() => {
    beep();
    if (modo === "foco") {
      const minutos = DURACOES.foco / 60;
      registrarSessao(disciplinaId, minutos);
      setCiclos((c) => c + 1);
      toast(`Sessão de ${minutos} min de ${disciplina(disciplinaId)?.nome ?? "estudo"} registrada! Hora da pausa.`);
      notificar("Pomodoro concluído!", "Sessão registrada. Faça uma pausa de 5 minutos.");
      trocarModo("pausa");
    } else {
      toast("Pausa encerrada. Bora focar!");
      notificar("Pausa encerrada", "Hora de voltar aos estudos.");
      trocarModo("foco");
    }
  }, [modo, disciplinaId, disciplina, registrarSessao, toast, trocarModo]);

  // The interval is created once per run; it calls the latest `finalizar` through a ref.
  const finalizarRef = useRef(finalizar);
  useEffect(() => {
    finalizarRef.current = finalizar;
  }, [finalizar]);

  useEffect(() => {
    if (!rodando) return;
    const intervalo = setInterval(() => {
      const r = Math.max(0, Math.round((fimEm.current - Date.now()) / 1000));
      setRestante(r);
      if (r === 0) {
        clearInterval(intervalo);
        finalizarRef.current();
      }
    }, 250);
    return () => clearInterval(intervalo);
  }, [rodando]);

  const value = useMemo<PomodoroContextValue>(() => {
    const restanteAgora = () => (rodando ? Math.max(0, Math.round((fimEm.current - Date.now()) / 1000)) : restante);
    return {
      modo,
      restante,
      rodando,
      ciclos,
      disciplinaId,
      setDisciplinaId,
      iniciar: () => {
        if (modo === "foco" && !disciplinaId) {
          toast("Cadastre uma disciplina para registrar a sessão.");
          return;
        }
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission().catch(() => undefined);
        }
        fimEm.current = Date.now() + restante * 1000;
        setRodando(true);
      },
      pausar: () => {
        setRestante(restanteAgora());
        setRodando(false);
      },
      reiniciar: () => {
        setRodando(false);
        setRestante(DURACOES[modo]);
      },
      trocarModo,
      encerrarESalvar: () => {
        const minutos = Math.floor((DURACOES.foco - restanteAgora()) / 60);
        if (minutos < 1) {
          toast("Estude pelo menos 1 minuto para registrar a sessão.");
          return;
        }
        registrarSessao(disciplinaId, minutos);
        toast(`Sessão de ${minutos} min registrada.`);
        setRodando(false);
        setRestante(DURACOES.foco);
      },
    };
  }, [modo, restante, rodando, ciclos, disciplinaId, toast, trocarModo, registrarSessao]);

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro precisa estar dentro de <PomodoroProvider>.");
  return ctx;
}
