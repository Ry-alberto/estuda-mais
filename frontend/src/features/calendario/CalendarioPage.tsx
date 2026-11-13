import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDados } from "@/app/DadosProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { TarefaDialog, type EstadoDialogTarefa } from "@/features/tarefas/TarefaDialog";
import type { Tarefa } from "@/features/tarefas/tarefas.service";
import { isoDate } from "@/lib/datas";
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const corEvento: Record<Tarefa["tipo"], string> = {
  PROVA: "bg-primary text-white",
  ENTREGA: "bg-success-soft text-success",
  TAREFA: "bg-surface-2 text-foreground border border-border",
};

function primeiroDoMes(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// RF04: month view of exams and deliveries; click a day to add a task on that date.
export function CalendarioPage() {
  const { tarefas, disciplinas } = useDados();
  const toast = useToast();
  const navigate = useNavigate();
  const [mes, setMes] = useState(() => primeiroDoMes(new Date()));
  const [dialog, setDialog] = useState<EstadoDialogTarefa>({ aberto: false });

  const ano = mes.getFullYear();
  const indiceMes = mes.getMonth();
  const vaziosAntes = new Date(ano, indiceMes, 1).getDay();
  const diasNoMes = new Date(ano, indiceMes + 1, 0).getDate();
  const hoje = isoDate(new Date());
  const tituloBruto = mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  // Only the first letter: CSS `capitalize` would also turn "de" into "De".
  const titulo = tituloBruto.charAt(0).toUpperCase() + tituloBruto.slice(1);

  const porDia = new Map<string, Tarefa[]>();
  for (const t of tarefas) porDia.set(t.prazo, [...(porDia.get(t.prazo) ?? []), t]);

  const abrirDia = (prazo: string) => {
    if (disciplinas.length === 0) {
      toast("Cadastre uma disciplina antes de criar tarefas.");
      navigate("/disciplinas");
      return;
    }
    setDialog({ aberto: true, prazo });
  };

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setMes(new Date(ano, indiceMes - 1, 1))} aria-label="Mês anterior">
          <ChevronLeft />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <Button variant="ghost" size="sm" onClick={() => setMes(primeiroDoMes(new Date()))}>
            Hoje
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={() => setMes(new Date(ano, indiceMes + 1, 1))} aria-label="Próximo mês">
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
        {Array.from({ length: vaziosAntes }, (_, i) => (
          <div key={`vazio-${i}`} />
        ))}
        {Array.from({ length: diasNoMes }, (_, i) => {
          const dia = i + 1;
          const iso = isoDate(new Date(ano, indiceMes, dia));
          // Exams first: they matter most on a busy day.
          const eventos = [...(porDia.get(iso) ?? [])].sort((a, b) => Number(b.tipo === "PROVA") - Number(a.tipo === "PROVA"));
          return (
            <div
              key={iso}
              role="button"
              tabIndex={0}
              onClick={() => abrirDia(iso)}
              onKeyDown={(e) => e.key === "Enter" && abrirDia(iso)}
              title="Clique para adicionar uma tarefa"
              className={cn(
                "flex min-h-16 cursor-pointer flex-col gap-1 overflow-hidden rounded-lg border border-border p-1 transition-colors hover:bg-surface-2 sm:min-h-24 sm:p-1.5",
                iso === hoje && "border-primary bg-primary-soft/40",
              )}
            >
              <span className={cn("text-xs", iso === hoje ? "font-bold text-primary" : "text-muted")}>{dia}</span>
              {eventos.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialog({ aberto: true, tarefa: t });
                  }}
                  title={t.titulo}
                  className={cn(
                    "cursor-pointer truncate rounded px-1 py-0.5 text-left text-[10px] font-medium sm:text-[11px]",
                    corEvento[t.tipo],
                    t.status === "CONCLUIDA" && "line-through opacity-60",
                  )}
                >
                  {t.titulo}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-primary" /> Prova
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-full bg-success" /> Entrega
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2.5 rounded-full border border-border bg-surface-2" /> Tarefa
        </span>
      </div>

      <TarefaDialog estado={dialog} onClose={() => setDialog({ aberto: false })} />
    </Card>
  );
}
