# Estuda+ — Plataforma de organização de estudos

Front-end do projeto da disciplina **Web 2** (Engenharia de Computação — IFSP Piracicaba, 2026).
Integrantes: Eduardo Mambelli Serotini, Gabriel Henrique Lima, Ryan Alberto Santos e Victor Gimenes Vianna.

## Como abrir

Não precisa instalar nada: dê dois cliques em `index.html` (ou sirva a pasta com qualquer servidor estático).
Crie uma conta na tela inicial; a conta já vem com disciplinas, tarefas e sessões de exemplo.

### Com Docker

```bash
docker build -t estuda-mais .
docker run --rm -p 8080:80 estuda-mais
```

Depois abra <http://localhost:8080>. A imagem é um nginx servindo os arquivos estáticos (`nginx.conf`).

> Versão de demonstração: os dados ficam salvos no `localStorage` do navegador.
> A camada `js/store.js` foi escrita como "repositórios" para ser trocada pelas chamadas à API NestJS (seção 8.4 do documento).

## Estrutura

```
index.html        página única (SPA com rotas por hash: #/dashboard, #/tarefas...)
css/styles.css    style guide: #5B4BDB, #2EC4B6, #F4F5F7, #1F2430, Inter + Poppins, raio 12px
js/icons.js       ícones no estilo Lucide
js/store.js       autenticação, repositórios, estatísticas (Strategy) e grupos
js/app.js         telas e interações
```

## Requisitos atendidos

| Requisito | Tela | O que faz |
|---|---|---|
| RF01 | Login / Cadastro | Conta com e-mail e senha (senha guardada com hash) |
| RF02 | Disciplinas | Criar, listar, editar (nome, professor, cor) e excluir |
| RF03 | Tarefas | Quadro Pendente / Fazendo / Concluída, prazo, prioridade, tipo, filtros por disciplina e status, arrastar e soltar |
| RF04 | Calendário | Provas e entregas no mês; clique num dia para criar tarefa |
| RF05 | Pomodoro | Foco 25 min / pausa 5 min, sessão salva com disciplina e duração |
| RF06 | Dashboard | Horas na semana, horas por dia (barras), por disciplina (rosca), próximos prazos |
| RF07 | Grupos | Criar grupo, entrar por código de convite, meta e materiais (links ou títulos) |
| RF08 (prévia) | Sino no topo | Prazos dos próximos 3 dias e atrasados |
| RF09 (prévia) | Lua/sol no topo | Modo escuro/claro |
| RNF01 | Todas | Layout responsivo com menu lateral recolhível no celular |
| RNF04 | Tarefas | Nova tarefa em 3 cliques: "Nova tarefa" → preencher → "Criar tarefa" |

Para testar convites de grupo, crie duas contas no mesmo navegador: o código de um grupo criado por uma conta funciona na outra. O grupo de exemplo usa o código `WEB2-7K`.
