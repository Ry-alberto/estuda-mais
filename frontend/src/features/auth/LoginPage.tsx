import { ChartColumn, ListTodo, LogIn, Timer, UserPlus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { mensagemDeErro } from "@/lib/api";
import { useAuth } from "./AuthProvider";

const DESTAQUES = [
  { icone: ListTodo, texto: "Tarefas com prazo, prioridade e status" },
  { icone: Timer, texto: "Timer Pomodoro com registro de sessões" },
  { icone: ChartColumn, texto: "Horas estudadas por disciplina e semana" },
  { icone: Users, texto: "Grupos de estudo com materiais" },
];

export function LoginPage() {
  const { usuario, entrar, cadastrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const ehLogin = modo === "login";

  if (usuario) return <Navigate to="/dashboard" replace />;

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const nome = String(form.get("nome") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const senha = String(form.get("senha") ?? "");

    // Quick client-side checks for instant feedback; the API validates again.
    if (!ehLogin && !nome) return setErro("Informe seu nome.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErro("Informe um e-mail válido.");
    if (!ehLogin && senha.length < 6) return setErro("A senha precisa ter pelo menos 6 caracteres.");
    if (!senha) return setErro("Informe sua senha.");

    setEnviando(true);
    setErro(null);
    try {
      if (ehLogin) await entrar(email, senha);
      else await cadastrar(nome, email, senha);
      const destino = (location.state as { de?: string } | null)?.de ?? "/dashboard";
      navigate(destino, { replace: true });
    } catch (ex) {
      setErro(mensagemDeErro(ex));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-linear-to-br from-primary to-[#3f8de0] p-12 text-white lg:flex">
        <Logo claro />
        <div>
          <h1 className="max-w-md text-4xl font-bold leading-tight">Organize seus estudos em um só lugar.</h1>
          <p className="mt-4 max-w-md text-white/85">
            Disciplinas, tarefas, provas, Pomodoro e estatísticas do seu tempo de estudo — tudo integrado.
          </p>
          <ul className="mt-8 space-y-3">
            {DESTAQUES.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg bg-white/15">
                  <Icone className="size-4" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <small className="opacity-75">IFSP · Piracicaba · 2026</small>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />
          <h2 className="text-2xl font-semibold">{ehLogin ? "Entrar" : "Criar conta"}</h2>
          <p className="mt-1 text-muted">
            {ehLogin ? "Bem-vindo de volta! Acesse sua conta." : "Comece a organizar sua rotina de estudos."}
          </p>

          <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
            {erro && (
              <div role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {erro}
              </div>
            )}
            {!ehLogin && (
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" autoComplete="name" placeholder="Seu nome" maxLength={100} />
              </div>
            )}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="voce@email.com" />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                autoComplete={ehLogin ? "current-password" : "new-password"}
                placeholder="Mínimo de 6 caracteres"
                maxLength={72}
              />
            </div>
            <Button type="submit" className="w-full" disabled={enviando}>
              {ehLogin ? <LogIn /> : <UserPlus />}
              {enviando ? "Aguarde…" : ehLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-muted">
            {ehLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              className="cursor-pointer font-medium text-primary hover:underline"
              onClick={() => {
                setModo(ehLogin ? "cadastro" : "login");
                setErro(null);
              }}
            >
              {ehLogin ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
