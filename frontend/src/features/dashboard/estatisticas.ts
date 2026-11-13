import type { Disciplina } from "@/features/disciplinas/disciplinas.service";
import type { SessaoEstudo } from "@/features/pomodoro/sessoes.storage";
import { addDays, hojeMeiaNoite, isoDate } from "@/lib/datas";

// Strategy pattern (section 10.1): each statistic is an interchangeable function
// over the same input (study sessions). The dashboard picks strategies by name,
// so a new statistic is added here without touching the page (open/closed).

export interface PontoPorDia {
  label: string;
  data: string;
  horas: number;
}

export interface FatiaPorDisciplina {
  id: string;
  nome: string;
  cor: string;
  horas: number;
}

const somarHoras = (sessoes: SessaoEstudo[]) => sessoes.reduce((total, s) => total + s.minutos, 0) / 60;

export const estrategias = {
  // Hours per day for the last `dias` days, oldest first.
  porDia(sessoes: SessaoEstudo[], dias = 7): PontoPorDia[] {
    const hoje = hojeMeiaNoite();
    return Array.from({ length: dias }, (_, i) => {
      const dia = addDays(hoje, i - (dias - 1));
      const data = isoDate(dia);
      return {
        label: dia.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        data,
        horas: somarHoras(sessoes.filter((s) => isoDate(new Date(s.data)) === data)),
      };
    });
  },

  // Total hours per subject, biggest first.
  porDisciplina(sessoes: SessaoEstudo[], disciplinas: Disciplina[]): FatiaPorDisciplina[] {
    return disciplinas
      .map((d) => ({ id: d.id, nome: d.nome, cor: d.cor, horas: somarHoras(sessoes.filter((s) => s.disciplinaId === d.id)) }))
      .sort((a, b) => b.horas - a.horas);
  },

  // Hours in the last 7 days (rolling week).
  horasSemana(sessoes: SessaoEstudo[]): number {
    const limite = addDays(new Date(), -7);
    return somarHoras(sessoes.filter((s) => new Date(s.data) >= limite));
  },
};
