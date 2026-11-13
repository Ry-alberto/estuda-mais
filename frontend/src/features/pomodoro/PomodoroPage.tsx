import { Check, Pause, Play, RotateCcw, X } from "lucide-react";
import { useDados } from "@/app/DadosProvider";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { fmtClock, isoDate } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { DURACOES, usePomodoro, type ModoPomodoro } from "./PomodoroProvider";

const RAIO = 108;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

const MODOS: { id: ModoPomodoro; label: string }[] = [
  { id: "foco", label: "Foco · 25" },
  { id: "pausa", label: "Pausa · 5" },
];

// RF05 / US04: 25/5 Pomodoro; each finished focus block is saved with subject and duration.
export function PomodoroPage() {
  const { disciplinas, disciplina, sessoes, removerSessao } = useDados();
  const p = usePomodoro();
  const total = DURACOES[p.modo];
  const emAndamento = p.restante < total;

  const hoje = isoDate(new Date());
  const sessoesHoje = sessoes.filter((s) => isoDate(new Date(s.data)) === hoje).sort((a, b) => b.data.localeCompare(a.data));
  const minutosHoje = sessoesHoje.reduce((soma, s) => soma + s.minutos, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card className="flex flex-col items-center gap-5 py-8">
        <div className="flex rounded-lg bg-surface-2 p-1" role="tablist">
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={p.modo === m.id}
              onClick={() => p.trocarModo(m.id)}
              className={cn(
                "cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                p.modo === m.id ? "bg-surface text-foreground shadow-card" : "text-muted",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="relative size-60">
          <svg viewBox="0 0 240 240" className="size-full -rotate-90">
            <circle cx="120" cy="120" r={RAIO} fill="none" strokeWidth="12" stroke="var(--surface-2)" />
            <circle
              cx="120"
              cy="120"
              r={RAIO}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              stroke={p.modo === "foco" ? "var(--primary)" : "var(--success)"}
              strokeDasharray={CIRCUNFERENCIA}
              strokeDashoffset={CIRCUNFERENCIA * (p.restante / total)}
              className="transition-[stroke-dashoffset] duration-300"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center font-heading text-5xl font-semibold tabular-nums">
            {fmtClock(p.restante)}
          </div>
        </div>

        <Select
          className="w-64"
          value={p.disciplinaId}
          onChange={(e) => p.setDisciplinaId(e.target.value)}
          disabled={p.rodando || disciplinas.length === 0}
          aria-label="Disciplina da sessão"
        >
          {disciplinas.length === 0 && <option value="">Cadastre uma disciplina</option>}
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </Select>

        <div className="flex gap-2">
          <Button onClick={p.rodando ? p.pausar : p.iniciar} className="w-36">
            {p.rodando ? <Pause /> : <Play />}
            {p.rodando ? "Pausar" : emAndamento ? "Continuar" : "Iniciar"}
          </Button>
          <Button variant="outline" size="icon" onClick={p.reiniciar} aria-label="Reiniciar" title="Reiniciar">
            <RotateCcw />
          </Button>
        </div>

        {p.modo === "foco" && emAndamento && (
          <Button variant="ghost" size="sm" onClick={p.encerrarESalvar}>
            <Check /> Encerrar e registrar sessão
          </Button>
        )}
        <span className="text-xs text-muted">
          {p.ciclos} {p.ciclos === 1 ? "ciclo concluído" : "ciclos concluídos"} nesta visita
        </span>
      </Card>

      <Card>
        <CardTitle className="mb-0">Sessões de hoje</CardTitle>
        <div className="mb-4 font-heading text-3xl font-semibold text-success">{minutosHoje} min</div>
        {sessoesHoje.length === 0 ? (
          <p className="py-6 text-center text-muted">Nenhuma sessão hoje. Que tal começar agora?</p>
        ) : (
          <ul className="space-y-1.5">
            {sessoesHoje.map((s) => {
              const d = disciplina(s.disciplinaId);
              return (
                <li key={s.id} className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
                  <span className="size-2 rounded-full" style={{ background: d?.cor ?? "var(--muted)" }} />
                  <span className="flex-1 truncate">{d?.nome ?? "—"}</span>
                  <span className="font-medium">{s.minutos}m</span>
                  <Button variant="danger" size="icon-sm" onClick={() => removerSessao(s.id)} aria-label="Remover sessão">
                    <X />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
