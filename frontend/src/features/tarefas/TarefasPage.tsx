import { Plus, Trash2 } from "lucide-react";
import { useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDados } from "@/app/DadosProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErro } from "@/lib/api";
import { fmtDate, prazoRelativo } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { TarefaDialog, type EstadoDialogTarefa } from "./TarefaDialog";
import { PRIORIDADES, rotulo, STATUS, TIPOS, type StatusTarefa, type Tarefa } from "./tarefas.service";

// RF03 / US03: board grouped by status, filters by subject and status, drag and drop.
export function TarefasPage() {
  const { tarefas, disciplinas, disciplina, atualizarTarefa, excluirTarefa } = useDados();
  const toast = useToast();
  const navigate = useNavigate();
  const [filtroDisciplina, setFiltroDisciplina] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusTarefa | "">("");
  const [dialog, setDialog] = useState<EstadoDialogTarefa>({ aberto: false });
  const [colunaAlvo, setColunaAlvo] = useState<StatusTarefa | null>(null);

  const visiveis = tarefas
    .filter((t) => (!filtroDisciplina || t.disciplinaId === filtroDisciplina) && (!filtroStatus || t.status === filtroStatus))
    .sort((a, b) => a.prazo.localeCompare(b.prazo));

  const novaTarefa = () => {
    if (disciplinas.length === 0) {
      toast("Cadastre uma disciplina antes de criar tarefas.");
      navigate("/disciplinas");
      return;
    }
    setDialog({ aberto: true, disciplinaId: filtroDisciplina || undefined });
  };

  const mover = async (tarefa: Tarefa, status: StatusTarefa) => {
    if (tarefa.status === status) return;
    try {
      await atualizarTarefa(tarefa.id, { status });
    } catch (e) {
      toast(mensagemDeErro(e));
    }
  };

  const excluir = async (tarefa: Tarefa) => {
    if (!confirm(`Excluir a tarefa "${tarefa.titulo}"?`)) return;
    try {
      await excluirTarefa(tarefa.id);
      toast("Tarefa excluída.");
    } catch (e) {
      toast(mensagemDeErro(e));
    }
  };

  const soltar = (e: DragEvent<HTMLElement>, status: StatusTarefa) => {
    e.preventDefault();
    setColunaAlvo(null);
    const tarefa = tarefas.find((t) => t.id === e.dataTransfer.getData("text/plain"));
    if (tarefa) void mover(tarefa, status);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="mr-auto text-muted">
          {visiveis.length} {visiveis.length === 1 ? "tarefa" : "tarefas"} {filtroDisciplina || filtroStatus ? "no filtro" : "no total"}
        </span>
        <Select className="w-auto" value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)} aria-label="Filtrar por disciplina">
          <option value="">Todas as disciplinas</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusTarefa | "")}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {STATUS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        <Button onClick={novaTarefa}>
          <Plus /> Nova tarefa
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STATUS.map((coluna) => {
          const lista = visiveis.filter((t) => t.status === coluna.id);
          return (
            <section
              key={coluna.id}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaAlvo(coluna.id);
              }}
              onDragLeave={() => setColunaAlvo(null)}
              onDrop={(e) => soltar(e, coluna.id)}
              className={cn(
                "min-h-40 rounded-card bg-surface-2 p-3 transition-colors",
                colunaAlvo === coluna.id && "bg-primary-soft ring-2 ring-primary/40",
              )}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{coluna.label}</h3>
                <span className="rounded-full bg-surface px-2 text-xs font-semibold text-muted">{lista.length}</span>
              </div>
              <div className="space-y-2.5">
                {lista.length === 0 && <p className="py-5 text-center text-muted">Nada por aqui.</p>}
                {lista.map((t) => {
                  const d = disciplina(t.disciplinaId);
                  const rel = t.status !== "CONCLUIDA" ? prazoRelativo(t.prazo) : null;
                  return (
                    <Card
                      key={t.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                      className="cursor-grab p-3.5 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          className="cursor-pointer text-left font-medium hover:text-primary"
                          onClick={() => setDialog({ aberto: true, tarefa: t })}
                          title="Editar"
                        >
                          {t.titulo}
                        </button>
                        <Button variant="danger" size="icon-sm" onClick={() => excluir(t)} aria-label={`Excluir ${t.titulo}`}>
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <span className="size-2 rounded-full" style={{ background: d?.cor ?? "var(--muted)" }} />
                        {d?.nome ?? "Sem disciplina"}
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <Badge variant={t.prioridade}>{rotulo(PRIORIDADES, t.prioridade)}</Badge>
                        {t.tipo !== "TAREFA" && <Badge variant={t.tipo}>{rotulo(TIPOS, t.tipo)}</Badge>}
                        <span
                          className={cn(
                            "ml-auto text-xs text-muted",
                            rel?.urgencia === "late" && "text-danger",
                            rel?.urgencia === "soon" && "text-warning-text",
                          )}
                        >
                          {fmtDate(t.prazo)}
                        </span>
                      </div>
                      {/* Buttons as a keyboard/touch alternative to drag and drop. */}
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {STATUS.filter((s) => s.id !== coluna.id).map((s) => (
                          <Button key={s.id} variant="outline" size="sm" onClick={() => mover(t, s.id)}>
                            → {s.label}
                          </Button>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <TarefaDialog estado={dialog} onClose={() => setDialog({ aberto: false })} />
    </div>
  );
}
