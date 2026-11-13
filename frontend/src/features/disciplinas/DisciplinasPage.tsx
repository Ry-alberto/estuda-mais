import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useDados } from "@/app/DadosProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { estrategias } from "@/features/dashboard/estatisticas";
import { mensagemDeErro } from "@/lib/api";
import { fmtHours } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { CORES_DISCIPLINA, type Disciplina } from "./disciplinas.service";

function SeletorCor({ valor, onChange }: { valor: string; onChange: (cor: string) => void }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Cor da disciplina">
      {CORES_DISCIPLINA.map((cor) => (
        <button
          key={cor}
          type="button"
          role="radio"
          aria-checked={cor === valor}
          aria-label={`Cor ${cor}`}
          onClick={() => onChange(cor)}
          className={cn(
            "grid size-6 cursor-pointer place-items-center rounded-full text-white transition-transform hover:scale-110",
            cor === valor && "ring-2 ring-foreground/30 ring-offset-2 ring-offset-surface",
          )}
          style={{ background: cor }}
        >
          {cor === valor && <Check className="size-3.5" />}
        </button>
      ))}
    </div>
  );
}

function FormEdicao({ disciplina, onFim }: { disciplina: Disciplina; onFim: () => void }) {
  const { atualizarDisciplina } = useDados();
  const toast = useToast();
  const [cor, setCor] = useState(disciplina.cor);

  const salvar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nome = String(form.get("nome") ?? "").trim();
    if (!nome) return toast("Informe o nome da disciplina.");
    try {
      await atualizarDisciplina(disciplina.id, { nome, professor: String(form.get("professor") ?? "").trim() || null, cor });
      toast("Disciplina atualizada.");
      onFim();
    } catch (ex) {
      toast(mensagemDeErro(ex));
    }
  };

  return (
    <form onSubmit={salvar} className="space-y-3">
      <Input name="nome" defaultValue={disciplina.nome} maxLength={60} aria-label="Nome" autoFocus />
      <Input name="professor" defaultValue={disciplina.professor ?? ""} maxLength={60} placeholder="Professor(a)" aria-label="Professor(a)" />
      <SeletorCor valor={cor} onChange={setCor} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onFim}>
          Cancelar
        </Button>
        <Button type="submit" size="sm">
          Salvar
        </Button>
      </div>
    </form>
  );
}

// RF02 / US02: create, list, edit and delete subjects.
export function DisciplinasPage() {
  const { disciplinas, tarefas, sessoes, criarDisciplina, excluirDisciplina } = useDados();
  const toast = useToast();
  const [cor, setCor] = useState(CORES_DISCIPLINA[disciplinas.length % CORES_DISCIPLINA.length]);
  const [editando, setEditando] = useState<string | null>(null);
  const horas = estrategias.porDisciplina(sessoes, disciplinas);

  const adicionar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const nome = String(form.get("nome") ?? "").trim();
    if (!nome) return;
    try {
      await criarDisciplina({ nome, professor: String(form.get("professor") ?? "").trim() || null, cor });
      formEl.reset();
      setCor(CORES_DISCIPLINA[(disciplinas.length + 1) % CORES_DISCIPLINA.length]);
      toast("Disciplina adicionada.");
    } catch (ex) {
      toast(mensagemDeErro(ex));
    }
  };

  const excluir = async (d: Disciplina) => {
    if (!confirm(`Excluir "${d.nome}"? As tarefas e sessões desta disciplina também serão removidas.`)) return;
    try {
      await excluirDisciplina(d.id);
      toast("Disciplina excluída.");
    } catch (ex) {
      toast(mensagemDeErro(ex));
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <form onSubmit={adicionar} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input name="nome" placeholder="Nome da disciplina" required maxLength={60} aria-label="Nome da disciplina" />
          <Input name="professor" placeholder="Professor(a)" maxLength={60} aria-label="Professor(a)" />
          <SeletorCor valor={cor} onChange={setCor} />
          <Button type="submit" className="shrink-0">
            <Plus /> Adicionar
          </Button>
        </form>
      </Card>

      {disciplinas.length === 0 ? (
        <Card className="py-10 text-center text-muted">Cadastre sua primeira disciplina acima.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {disciplinas.map((d) => {
            const daDisciplina = tarefas.filter((t) => t.disciplinaId === d.id);
            const concluidas = daDisciplina.filter((t) => t.status === "CONCLUIDA").length;
            const pct = daDisciplina.length ? Math.round((concluidas / daDisciplina.length) * 100) : 0;
            return (
              <Card key={d.id} className="border-t-4" style={{ borderTopColor: d.cor }}>
                {editando === d.id ? (
                  <FormEdicao disciplina={d} onFim={() => setEditando(null)} />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{d.nome}</h3>
                        <p className="text-xs text-muted">{d.professor ?? "—"}</p>
                      </div>
                      <div className="flex shrink-0">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditando(d.id)} aria-label={`Editar ${d.nome}`}>
                          <Pencil />
                        </Button>
                        <Button variant="danger" size="icon-sm" onClick={() => excluir(d)} aria-label={`Excluir ${d.nome}`}>
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between text-xs text-muted">
                      <span>
                        {daDisciplina.length} {daDisciplina.length === 1 ? "tarefa" : "tarefas"}
                      </span>
                      <span>{fmtHours(horas.find((h) => h.id === d.id)?.horas ?? 0)} estudadas</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <small className="mt-1.5 block text-xs text-muted">{pct}% concluído</small>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
