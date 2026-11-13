import { BookOpen, CalendarDays, LayoutDashboard, ListTodo, LogOut, Menu, Timer, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useDados } from "@/app/DadosProvider";
import { useAuth, useUsuario } from "@/features/auth/AuthProvider";
import { usePomodoro } from "@/features/pomodoro/PomodoroProvider";
import { Button } from "@/components/ui/button";
import { fmtClock } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { NotificacoesMenu } from "./NotificacoesMenu";
import { ThemeToggle } from "./ThemeToggle";

export const ROTAS = [
  { path: "/dashboard", titulo: "Dashboard", icone: LayoutDashboard },
  { path: "/disciplinas", titulo: "Disciplinas", icone: BookOpen },
  { path: "/tarefas", titulo: "Tarefas", icone: ListTodo },
  { path: "/calendario", titulo: "Calendário", icone: CalendarDays },
  { path: "/pomodoro", titulo: "Pomodoro", icone: Timer },
  { path: "/grupos", titulo: "Grupos", icone: Users },
] as const;

const FRASES = [
  "O segredo de progredir é começar.",
  "Pequenos passos todos os dias levam longe.",
  "Disciplina é escolher o que você quer mais.",
  "Foco no processo, o resultado vem.",
  "Estudar hoje é investir no seu amanhã.",
];

export function AppLayout() {
  const usuario = useUsuario();
  const { sair } = useAuth();
  const { rodando, restante, modo } = usePomodoro();
  const { carregando, erro, recarregar } = useDados();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const rota = ROTAS.find((r) => pathname.startsWith(r.path)) ?? ROTAS[0];
  const frase = FRASES[new Date().getDate() % FRASES.length];

  // While the Pomodoro runs, the tab title shows the countdown on any page.
  useEffect(() => {
    document.title = rodando
      ? `${fmtClock(restante)} · ${modo === "foco" ? "Foco" : "Pausa"} · Estuda+`
      : `${rota.titulo} · Estuda+`;
  }, [rodando, restante, modo, rota.titulo]);

  return (
    <div className="flex min-h-full">
      {/* Sidebar: fixed on desktop, slide-in drawer on mobile (RNF01 mobile first). */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-58 flex-col gap-6 border-r border-border bg-surface p-4 transition-transform lg:translate-x-0",
          menuAberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <NavLink to="/dashboard" className="px-2 pt-1">
          <Logo />
        </NavLink>
        <nav className="flex flex-col gap-1">
          {ROTAS.map(({ path, titulo, icone: Icone }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors [&_svg]:size-4.5",
                  isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground",
                )
              }
            >
              <Icone />
              {titulo}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-card bg-linear-to-br from-primary to-[#3f8de0] p-4 text-sm text-white">
          “{frase}”
          <small className="mt-2 block opacity-75">Frase do dia</small>
        </div>
      </aside>
      {menuAberto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuAberto(false)} />}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-58">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-surface/90 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
            <Menu />
          </Button>
          <h1 className="flex-1 truncate text-base font-semibold">{rota.titulo}</h1>
          <NotificacoesMenu />
          <ThemeToggle />
          <span className="ml-1 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-primary-soft font-semibold text-primary">
              {usuario.nome.charAt(0).toUpperCase()}
            </span>
            <span className="hidden font-medium sm:inline">{usuario.nome.split(" ")[0]}</span>
          </span>
          <Button variant="ghost" size="icon" onClick={sair} aria-label="Sair" title="Sair">
            <LogOut />
          </Button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
          {erro ? (
            <div className="rounded-card border border-danger/30 bg-danger-soft p-5 text-danger">
              <p className="font-medium">Não foi possível carregar seus dados.</p>
              <p className="mt-1 text-sm">{erro}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={recarregar}>
                Tentar de novo
              </Button>
            </div>
          ) : carregando ? (
            <p className="py-16 text-center text-muted">Carregando seus dados…</p>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
