import { Copy, FileText, Link2, Pencil, Plus, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useUsuario } from "@/features/auth/AuthProvider";
import { CHAVE_GRUPOS, gruposStorage, type Grupo } from "./grupos.storage";

// RF07: create a group, join with an invite code, set a goal and share materials.
export function GruposPage() {
  const usuario = useUsuario();
  const toast = useToast();
  const membro = { email: usuario.email, nome: usuario.nome };
  const [grupos, setGrupos] = useState<Grupo[]>([]);

  const recarregar = useCallback(() => setGrupos(gruposStorage.meus(usuario.email)), [usuario.email]);

  useEffect(() => {
    gruposStorage.garantirGrupoDemo({ email: usuario.email, nome: usuario.nome });
    recarregar();
    // Another tab (another account) changed the groups: refresh.
    const aoMudar = (e: StorageEvent) => e.key === CHAVE_GRUPOS && recarregar();
    window.addEventListener("storage", aoMudar);
    return () => window.removeEventListener("storage", aoMudar);
  }, [usuario.email, usuario.nome, recarregar]);

  const enviarForm = (e: FormEvent<HTMLFormElement>, campo: string, acao: (valor: string) => void) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const valor = String(new FormData(formEl).get(campo) ?? "").trim();
    if (!valor) return;
    try {
      acao(valor);
      formEl.reset();
      recarregar();
    } catch (ex) {
      toast(ex instanceof Error ? ex.message : "Algo deu errado.");
    }
  };

  const copiar = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      toast("Código copiado!");
    } catch {
      toast(`Código: ${codigo}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Criar grupo</CardTitle>
          <form
            className="flex gap-2"
            onSubmit={(e) =>
              enviarForm(e, "nome", (nome) => toast(`Grupo criado! Código de convite: ${gruposStorage.criar(nome, membro).codigo}`))
            }
          >
            <Input name="nome" placeholder="Nome do grupo" required maxLength={50} aria-label="Nome do grupo" />
            <Button type="submit" size="icon" aria-label="Criar grupo">
              <Plus />
            </Button>
          </form>
        </Card>
        <Card>
          <CardTitle>Entrar por convite</CardTitle>
          <form
            className="flex gap-2"
            onSubmit={(e) => enviarForm(e, "codigo", (codigo) => toast(`Você entrou em "${gruposStorage.entrar(codigo, membro).nome}".`))}
          >
            <Input name="codigo" placeholder="Ex: WEB2-7K" required maxLength={10} className="uppercase" aria-label="Código de convite" />
            <Button type="submit" variant="soft">
              Entrar
            </Button>
          </form>
        </Card>
      </div>

      {grupos.length === 0 ? (
        <Card className="py-10 text-center text-muted">Você ainda não participa de nenhum grupo. Crie um ou entre com um código.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grupos.map((g) => (
            <Card key={g.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{g.nome}</h3>
                <button
                  type="button"
                  onClick={() => copiar(g.codigo)}
                  title="Copiar código de convite"
                  className="flex cursor-pointer items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-xs font-semibold text-primary"
                >
                  <Copy className="size-3" /> {g.codigo}
                </button>
              </div>

              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                🎯 <span>{g.meta}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar meta"
                  onClick={() => {
                    const meta = prompt("Meta do grupo:", g.meta)?.trim();
                    if (meta) {
                      gruposStorage.definirMeta(g.id, meta);
                      recarregar();
                    }
                  }}
                >
                  <Pencil />
                </Button>
              </div>

              <div className="mt-3 flex -space-x-2">
                {g.membros.map((m, i) => (
                  <span
                    key={`${m.email ?? m.nome}-${i}`}
                    title={m.nome}
                    className="grid size-8 place-items-center rounded-full border-2 border-surface bg-primary text-xs font-semibold text-white"
                  >
                    {m.nome.charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>

              <h4 className="mb-2 mt-4 text-sm font-semibold">Materiais</h4>
              {g.materiais.length === 0 ? (
                <p className="text-muted">Nenhum material compartilhado.</p>
              ) : (
                <ul className="space-y-1">
                  {g.materiais.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 text-sm">
                      {m.url ? <Link2 className="size-4 text-muted" /> : <FileText className="size-4 text-muted" />}
                      {m.url ? (
                        <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary hover:underline">
                          {m.titulo}
                        </a>
                      ) : (
                        <span className="flex-1 truncate">{m.titulo}</span>
                      )}
                      <Button
                        variant="danger"
                        size="icon-sm"
                        aria-label="Remover material"
                        onClick={() => {
                          gruposStorage.removerMaterial(g.id, m.id);
                          recarregar();
                        }}
                      >
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <form className="mt-3 flex gap-2" onSubmit={(e) => enviarForm(e, "material", (v) => gruposStorage.adicionarMaterial(g.id, v))}>
                <Input name="material" placeholder="Título ou link do material" required maxLength={200} aria-label="Título ou link do material" />
                <Button type="submit" variant="outline" size="icon" aria-label="Adicionar material">
                  <Plus />
                </Button>
              </form>

              <div className="mt-3 text-right">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (confirm("Sair deste grupo?")) {
                      gruposStorage.sair(g.id, usuario.email);
                      recarregar();
                    }
                  }}
                >
                  Sair do grupo
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
