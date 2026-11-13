import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDados } from "@/app/DadosProvider";
import { Button } from "@/components/ui/button";
import { daysUntil, fmtDate, prazoRelativo } from "@/lib/datas";
import { cn } from "@/lib/utils";

// RF08 preview: open tasks due in the next 3 days or overdue, computed on the client.
// The 2nd stage moves this to the API (Observer + Factory, section 10.1).
export function NotificacoesMenu() {
  const { tarefas, disciplina } = useDados();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const alertas = tarefas
    .filter((t) => t.status !== "CONCLUIDA" && daysUntil(t.prazo) <= 3)
    .sort((a, b) => a.prazo.localeCompare(b.prazo));

  useEffect(() => {
    if (!aberto) return;
    const fecharFora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    const fecharEsc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fecharFora);
    document.addEventListener("keydown", fecharEsc);
    return () => {
      document.removeEventListener("mousedown", fecharFora);
      document.removeEventListener("keydown", fecharEsc);
    };
  }, [aberto]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" onClick={() => setAberto((a) => !a)} aria-label="Notificações" aria-expanded={aberto}>
        <Bell />
        {alertas.length > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-surface" />}
      </Button>
      {aberto && (
        <div className="absolute right-0 top-11 z-30 w-80 max-w-[calc(100vw-32px)] rounded-card border border-border bg-surface p-3 shadow-xl">
          <h4 className="mb-2 px-1 text-sm font-semibold">Prazos próximos</h4>
          {alertas.length === 0 ? (
            <p className="px-1 py-4 text-center text-muted">Nenhum prazo nos próximos 3 dias. 🎉</p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {alertas.map((t) => {
                const d = disciplina(t.disciplinaId);
                const rel = prazoRelativo(t.prazo);
                return (
                  <li key={t.id}>
                    <Link to="/tarefas" onClick={() => setAberto(false)} className="flex gap-2.5 rounded-lg p-2 hover:bg-surface-2">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: d?.cor ?? "var(--muted)" }} />
                      <span className="min-w-0">
                        <strong className="block truncate font-medium">{t.titulo}</strong>
                        <span className="text-xs text-muted">
                          {d?.nome} · {fmtDate(t.prazo)} ·{" "}
                          <span className={cn(rel?.urgencia === "late" ? "text-danger" : "text-warning-text")}>{rel?.texto}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
