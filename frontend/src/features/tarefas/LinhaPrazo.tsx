import { useDados } from "@/app/DadosProvider";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { mensagemDeErro } from "@/lib/api";
import { fmtDate, prazoRelativo } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { PRIORIDADES, rotulo, TIPOS, type Tarefa } from "./tarefas.service";

// One row of the "upcoming deadlines" list, with a checkbox that completes the task.
export function LinhaPrazo({ tarefa }: { tarefa: Tarefa }) {
  const { disciplina, atualizarTarefa } = useDados();
  const toast = useToast();
  const d = disciplina(tarefa.disciplinaId);
  const rel = prazoRelativo(tarefa.prazo);

  const concluir = async () => {
    try {
      await atualizarTarefa(tarefa.id, { status: "CONCLUIDA" });
      toast("Tarefa concluída! ✅");
    } catch (e) {
      toast(mensagemDeErro(e));
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <input
        type="checkbox"
        className="size-4 shrink-0 cursor-pointer accent-[var(--primary)]"
        onChange={concluir}
        aria-label={`Concluir ${tarefa.titulo}`}
      />
      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: d?.cor ?? "var(--border)" }} />
      <div className="min-w-0 flex-1">
        <strong className="block truncate font-medium">{tarefa.titulo}</strong>
        <span className="text-xs text-muted">
          {d?.nome ?? "Sem disciplina"} · {fmtDate(tarefa.prazo)}
          {rel && (
            <>
              {" · "}
              <span className={cn(rel.urgencia === "late" ? "text-danger" : "text-warning-text")}>{rel.texto}</span>
            </>
          )}
        </span>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {tarefa.tipo !== "TAREFA" && <Badge variant={tarefa.tipo}>{rotulo(TIPOS, tarefa.tipo)}</Badge>}
        <Badge variant={tarefa.prioridade}>{rotulo(PRIORIDADES, tarefa.prioridade)}</Badge>
      </div>
    </div>
  );
}
