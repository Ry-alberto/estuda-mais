import { useState, type FormEvent } from "react";
import { useDados } from "@/app/DadosProvider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { mensagemDeErro } from "@/lib/api";
import { addDays, isoDate } from "@/lib/datas";
import { PRIORIDADES, STATUS, TIPOS, type Prioridade, type StatusTarefa, type Tarefa, type TipoTarefa } from "./tarefas.service";

export interface EstadoDialogTarefa {
  aberto: boolean;
  tarefa?: Tarefa; // present = edit, absent = create
  prazo?: string; // preset deadline (clicking a day on the calendar)
  disciplinaId?: string;
}

interface Props {
  estado: EstadoDialogTarefa;
  onClose: () => void;
}

// RNF04: creating a task takes 3 clicks — "Nova tarefa" -> fill in -> "Criar tarefa".
// Every field except the title comes pre-filled with a sensible default.
export function TarefaDialog({ estado, onClose }: Props) {
  return (
    <Dialog open={estado.aberto} onOpenChange={(aberto) => !aberto && onClose()} title={estado.tarefa ? "Editar tarefa" : "Nova tarefa"}>
      {/* key remounts the form so defaults reset each time the dialog opens */}
      {estado.aberto && <FormTarefa key={estado.tarefa?.id ?? `nova-${estado.prazo ?? ""}`} estado={estado} onClose={onClose} />}
    </Dialog>
  );
}

function FormTarefa({ estado, onClose }: Props) {
  const { disciplinas, criarTarefa, atualizarTarefa } = useDados();
  const toast = useToast();
  const [salvando, setSalvando] = useState(false);
  const t = estado.tarefa;

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const dados = {
      titulo: String(form.get("titulo") ?? "").trim(),
      disciplinaId: String(form.get("disciplinaId")),
      prazo: String(form.get("prazo")),
      tipo: String(form.get("tipo")) as TipoTarefa,
      prioridade: String(form.get("prioridade")) as Prioridade,
      status: String(form.get("status")) as StatusTarefa,
    };
    if (!dados.titulo || !dados.prazo) return toast("Preencha título e prazo.");

    setSalvando(true);
    try {
      if (t) await atualizarTarefa(t.id, dados);
      else await criarTarefa(dados);
      toast(t ? "Tarefa atualizada." : "Tarefa criada.");
      onClose();
    } catch (ex) {
      toast(mensagemDeErro(ex));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <Label htmlFor="t-titulo">Título</Label>
        <Input id="t-titulo" name="titulo" required maxLength={80} defaultValue={t?.titulo} placeholder="Ex.: Lista de exercícios 3" autoFocus />
      </div>
      <div>
        <Label htmlFor="t-disciplina">Disciplina</Label>
        <Select id="t-disciplina" name="disciplinaId" defaultValue={t?.disciplinaId ?? estado.disciplinaId ?? disciplinas[0]?.id}>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="t-prazo">Prazo</Label>
          <Input id="t-prazo" name="prazo" type="date" required defaultValue={t?.prazo ?? estado.prazo ?? isoDate(addDays(new Date(), 7))} />
        </div>
        <div>
          <Label htmlFor="t-tipo">Tipo</Label>
          <Select id="t-tipo" name="tipo" defaultValue={t?.tipo ?? "TAREFA"}>
            {TIPOS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="t-prioridade">Prioridade</Label>
          <Select id="t-prioridade" name="prioridade" defaultValue={t?.prioridade ?? "MEDIA"}>
            {PRIORIDADES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="t-status">Status</Label>
          <Select id="t-status" name="status" defaultValue={t?.status ?? "PENDENTE"}>
            {STATUS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {t ? "Salvar" : "Criar tarefa"}
        </Button>
      </div>
    </form>
  );
}
