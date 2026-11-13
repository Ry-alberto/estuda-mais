import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDados } from "@/app/DadosProvider";
import { Card, CardTitle } from "@/components/ui/card";
import { useUsuario } from "@/features/auth/AuthProvider";
import { LinhaPrazo } from "@/features/tarefas/LinhaPrazo";
import { fmtHours } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { estrategias } from "./estatisticas";

function saudacao(): string {
  const hora = new Date().getHours();
  return hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
}

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
};

// RF06 / US05: charts computed from the recorded study sessions.
export function DashboardPage() {
  const usuario = useUsuario();
  const { tarefas, sessoes, disciplinas } = useDados();
  const porDia = estrategias.porDia(sessoes);
  const porDisciplina = estrategias.porDisciplina(sessoes, disciplinas).filter((d) => d.horas > 0);
  const pendentes = tarefas.filter((t) => t.status !== "CONCLUIDA");
  const proximas = [...pendentes].sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 6);

  const indicadores = [
    { label: "Horas na semana", valor: fmtHours(estrategias.horasSemana(sessoes)) },
    { label: "Tarefas pendentes", valor: pendentes.length },
    { label: "Concluídas", valor: tarefas.length - pendentes.length, destaque: true },
    { label: "Disciplinas", valor: disciplinas.length },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">
          {saudacao()}, {usuario.nome.split(" ")[0]} 👋
        </h2>
        <p className="text-muted">Veja como está sua semana de estudos.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {indicadores.map((i) => (
          <Card key={i.label} className="p-4">
            <div className="text-xs text-muted">{i.label}</div>
            <div className={cn("mt-1 font-heading text-2xl font-semibold", i.destaque && "text-success")}>{i.valor}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardTitle>Horas por dia</CardTitle>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porDia} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} allowDecimals tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  contentStyle={tooltipStyle}
                  formatter={(valor) => [fmtHours(Number(valor)), "Estudado"]}
                />
                <Bar dataKey="horas" fill="var(--primary)" radius={[5, 5, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Por disciplina</CardTitle>
          {porDisciplina.length === 0 ? (
            <p className="py-10 text-center text-muted">
              Nenhuma sessão registrada ainda.
              <br />
              <Link to="/pomodoro" className="font-medium text-primary hover:underline">
                Comece um Pomodoro
              </Link>
            </p>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
              <div className="size-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={porDisciplina} dataKey="horas" nameKey="nome" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
                      {porDisciplina.map((d) => (
                        <Cell key={d.id} fill={d.cor} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(valor) => fmtHours(Number(valor))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2">
                {porDisciplina.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-sm">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: d.cor }} />
                    <span className="flex-1 truncate">{d.nome}</span>
                    <span className="font-medium">{fmtHours(d.horas)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle>Próximos prazos</CardTitle>
        {proximas.length === 0 ? (
          <p className="py-6 text-center text-muted">Tudo em dia! Nenhuma tarefa pendente.</p>
        ) : (
          <div className="space-y-2">
            {proximas.map((t) => (
              <LinhaPrazo key={t.id} tarefa={t} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
