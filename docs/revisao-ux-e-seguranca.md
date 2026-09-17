# Revisão completa: UX/UI e segurança

Prompt de trabalho para uma sessão de revisão do Questly. Cada item é uma
micro-tarefa: pequena o bastante para caber numa passada, com um critério de
pronto que não depende de opinião.

**Como usar:** abra uma sessão e diga *"siga `docs/revisao-ux-e-seguranca.md`,
parte A"* (ou B, ou um item específico como `A3`). Não é preciso fazer tudo de
uma vez — as partes são independentes, e dentro de cada parte os itens também.

---

## Contexto

Questly é um PWA de bem-estar em português do Brasil: planejar, executar,
registrar, evoluir, compartilhar e competir.

| | |
|---|---|
| Backend | FastAPI + SQLAlchemy 2.0, `backend/app/` |
| Frontend | React 18 + Vite + react-router-dom, `frontend/src/` |
| Design system | LGrow, vendorizado em `frontend/src/design-system/` |
| Banco | SQLite em dev, Postgres no Railway (`DATABASE_URL`) |
| Esquema | `init_db()` em `backend/app/seed.py`, no import do `main.py` |
| Testes | `backend/tests/`, 87 testes |

### Subir o ambiente

```bash
# dependências (uma vez)
python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt

# backend + frontend servidos juntos na 8100
cd frontend && npm install && npm run build
cd ../backend && QUESTLY_DB=/tmp/questly-rev.db \
  ../.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8100

# varredura das 18 rotas no Chromium (console, tela branca, emoji, overflow)
cd frontend && npm run verify:ui

# testes
cd backend && ../.venv/bin/python -m pytest tests/ -q
```

O Chromium já está em `/opt/pw-browsers/chromium`. **Não rode
`playwright install`.**

### Rotas

Abas: `/` `/plano` `/grupo` `/feed` `/perfil`
Sub-páginas: `/agenda` `/registrar` `/desafio` `/treino` `/nutricao`
`/rotinas` `/habitos` `/tarefas` `/chat` `/mural` `/conquistas` `/config`
`/grupo/config`

---

## Regras da revisão

1. **Auditar primeiro, corrigir depois.** Levante tudo, registre, só então
   conserte. Corrigir no meio da varredura faz você perder o fio e reabrir os
   mesmos arquivos três vezes.
2. **Um achado = uma linha** na tabela final, com arquivo e linha.
3. **Reproduzir antes de afirmar.** Um achado de segurança sem uma requisição
   que o demonstre é um palpite. Um achado de UX sem uma captura de tela é uma
   opinião.
4. **Severidade:** `crítico` (dá para roubar ou destruir dado de outra pessoa),
   `alto` (quebra a tela ou vaza informação), `médio` (atrapalha o uso),
   `baixo` (acabamento).
5. **Não alargue o escopo.** Achou algo fora da revisão? Anote na seção
   "Fora de escopo" e siga.
6. **Nunca desligue um teste para passar.** Se um teste estorva, ele está
   dizendo algo.

### Regras de marca que a revisão precisa fazer valer

- **Emoji só em reações do feed e mensagens do chat.** Em nenhum outro lugar
  da interface — o design system é explícito: *"emoji appear only inside
  celebratory or conversational copy — never as icons"*.
- **Doto (`--font-numeric`) só no numeral de manchete.** Número pequeno em
  Doto vira ruído ilegível. O resto usa `--font-ui` com
  `font-variant-numeric: tabular-nums`.
- **Nada de valor cru.** Cor, raio, espaço e fonte saem dos tokens em
  `frontend/src/design-system/tokens/`.

---

## Parte A — Segurança

### Pistas já levantadas (verifique e conserte, não presuma)

- `backend/app/auth.py:19` — `SECRET_KEY` tem reserva embutida
  (`"questly-dev-secret-change-me"`). Se o Railway não definir a variável,
  **qualquer pessoa que leia o repositório forja o token de qualquer usuário.**
- `backend/app/main.py:109` — CORS com `allow_origins=["*"]` e métodos e
  cabeçalhos abertos.
- Não há limitação de tentativas em nenhum endpoint de autenticação.
- Código de convite: 6 caracteres num alfabeto de 32 (`auth.py:105`).

#### A1. Segredo de produção

**Olhe:** `backend/app/auth.py`, `backend/app/database.py`, `Dockerfile`,
`railway.json`.
**Faça:** o app precisa **recusar subir** sem `SECRET_KEY` quando não for
desenvolvimento, em vez de cair numa reserva conhecida. Decida o sinal de
"produção" (`DATABASE_URL` definido é o mais honesto aqui) e documente a
variável no README.
**Pronto quando:** existe um teste que prova que a reserva não é usada em
produção, e o README lista a variável.

#### A2. Ciclo de vida do token

**Olhe:** `backend/app/auth.py` (`create_token`, `_decode_token`,
`TOKEN_TTL_DAYS`).
**Procure:** 60 dias sem revogação. O que acontece ao trocar a senha? Ao sair
da conta? Um token roubado vale dois meses.
**Pronto quando:** a troca de senha invalida os tokens anteriores (um campo de
versão no usuário, comparado no `sub`, resolve), com teste.

#### A3. Força bruta e enumeração de conta

**Olhe:** `/api/auth/login`, `/api/auth/register`,
`/api/auth/forgot-password`, `/api/groups/join`.
**Procure:** (a) tentativas ilimitadas; (b) mensagens que revelem se um e-mail
existe — compare a resposta de `forgot-password` para e-mail cadastrado e não
cadastrado, e o texto de erro do login.
**Pronto quando:** as respostas não distinguem conta existente de inexistente,
e há um teto de tentativas por IP e por conta nos quatro endpoints.

#### A4. Varredura de IDOR — recursos do usuário

**Olhe:** todo endpoint em `backend/app/main.py` que receba um id na URL e
**não** seja de grupo: `/api/habits/{id}`, `/api/routines/{id}`,
`/api/calendar/{id}`, `/api/training/plans/{id}`,
`/api/training/sessions/{id}`, `/api/rest-days/...`.
**Faça:** para cada um, escreva uma requisição com o token do usuário A contra
um recurso do usuário B.
**Pronto quando:** cada um responde 404 (não 403 — 403 confirma que o recurso
existe), com um teste por rota.

#### A5. Varredura de IDOR — recursos de grupo

**Olhe:** os endpoints `/api/groups/{gid}/...`.
**Procure:** os que confiam no `gid` da URL sem chamar `get_membership`, e os
que recebem um id de item (`meal_id`, `task_id`, `activity_id`, `cid`) sem
conferir que ele pertence àquele grupo **e** àquele membro.
**Pronto quando:** existe um teste que tenta ler, editar e apagar item de outro
grupo e de outro membro do mesmo grupo, e todos falham.

#### A6. Limites de conteúdo enviado

**Olhe:** `MAX_IMAGE_CHARS` e `validate_image` em `main.py`; os campos `Text`
em `models.py` (`image`, `photo`, mensagens, comentários).
**Procure:** campo sem teto de tamanho, e teto que só existe no frontend.
**Pronto quando:** todo campo que aceita texto ou data URL tem limite validado
no servidor, com teste do caso que estoura.

#### A7. Renderização de conteúdo de terceiros

**Olhe:** `frontend/src/pages/Chat.jsx`, `Feed.jsx`, `Mural.jsx`,
`Conquistas.jsx`.
**Procure:** `dangerouslySetInnerHTML`, `innerHTML`, `<img src>` vindo
direto de dado do usuário, link com `target="_blank"` sem
`rel="noopener noreferrer"`.
**Pronto quando:** nenhum caminho renderiza HTML de outro usuário, e as fotos
vêm de data URL validada (tipo e tamanho) ou de origem conhecida.

#### A8. A migração automática de esquema

**Olhe:** `backend/app/seed.py` — `_reset_legacy_schema()`, `_ensure_columns()`,
`_missing_from_models()`.
**Procure:** em que condição `_reset_legacy_schema` apaga tabelas, e se essa
condição pode acontecer com banco de produção cheio. O `ALTER TABLE` é montado
com f-string; confirme que nada ali vem de entrada de usuário (deve vir só do
metadata das models).
**Pronto quando:** o caminho destrutivo está provado impossível com dados
presentes, com teste, ou passa a exigir uma variável explícita.

#### A9. Segredos e credenciais

**Olhe:** `git log -p | grep -iE "api[_-]?key|secret|password|token"`, o
`Dockerfile`, o `railway.json`, e todo `os.getenv` de `app/ai.py` e
`app/mailer.py`.
**Procure:** chave commitada, chave em log, chave numa mensagem de erro
devolvida ao cliente.
**Pronto quando:** nenhuma chave aparece no repositório nem em resposta de
erro, e o README lista todas as variáveis necessárias.

#### A10. Superfície de rede que sai do servidor

**Olhe:** `backend/app/openfoodfacts.py`, `backend/app/ai.py`,
`backend/app/mailer.py`, `backend/app/push.py`.
**Procure:** host montado a partir de entrada do usuário (SSRF), ausência de
timeout, resposta externa usada sem validação de tipo.
**Pronto quando:** todo destino é host fixo, toda chamada tem timeout, e a
falha de cada uma está coberta por teste (o Open Food Facts já tem —
`test_alimentos.py`).

#### A11. CORS e cabeçalhos

**Olhe:** `backend/app/main.py:105-113` e a resposta do
`FileResponse` do frontend.
**Decida:** o token é Bearer, não cookie, então `allow_origins=["*"]` não abre
CSRF — mas continua sendo mais largo que o necessário. Restrinja à origem real.
**Pronto quando:** a origem está numa variável de ambiente, e a resposta HTML
traz `X-Content-Type-Options`, `Referrer-Policy` e uma CSP que o app aguente.

#### A12. Dependências

**Faça:** `pip list --outdated` no backend e `npm audit` no frontend.
**Pronto quando:** nenhuma vulnerabilidade de severidade alta em dependência
direta, ou cada uma tem uma linha explicando por que não se aplica.

---

## Parte B — UX/UI

Cada item desta parte vale para **as 18 rotas**. Use o Chromium a 390×844 e
capture a tela — a captura é a prova.

#### B1. Os quatro estados de cada tela

**Faça:** para cada rota, veja os quatro: carregando, vazia, com dados, com
erro. Para o estado vazio, use conta nova; para o de erro, derrube o backend.
**Procure:** tela branca, "Carregando…" eterno, vazio sem saída (todo estado
vazio precisa dizer o que fazer e ter o botão que faz), erro que só aparece no
console.
**Pronto quando:** existe uma captura dos quatro estados de cada rota e nenhum
deles é uma tela sem texto.

#### B2. Alvos de toque

**Procure:** qualquer elemento clicável com menos de 44×44 px.
**Como:** no Chromium, percorra `document.querySelectorAll('button, a,
[role="button"], input, select')` e liste os que têm
`getBoundingClientRect()` menor que 44 em qualquer eixo.
**Pronto quando:** a lista está vazia, ou cada exceção tem área de toque
ampliada por padding.

#### B3. Contraste

**Faça:** meça o contraste de cada par texto/fundo dos tokens em
`design-system/tokens/colors.css`.
**Alvo:** 4,5:1 para texto normal, 3:1 para texto grande e para os limites de
componentes.
**Suspeitos conhecidos:** `--text-tertiary` (`#78787B`) sobre
`--surface-card` (`#121212`); `--text-secondary` dentro de `Chip`.
**Pronto quando:** cada par abaixo do alvo foi corrigido ou está registrado com
a razão.

#### B4. Área segura e recorte

**Olhe:** `frontend/src/App.jsx` (`<main>`), a TabBar, o `Sheet`, os cabeçalhos
de sub-página.
**Procure:** conteúdo sob a barra de status (o app usa `viewport-fit=cover`) ou
atrás da TabBar; rodapé colado no recorte inferior.
**Pronto quando:** em 390×844 com `env(safe-area-inset-*)` simulado, nenhum
texto ou controle fica coberto.

#### B5. Vazamento horizontal

**Faça:** em cada rota, confirme
`document.documentElement.scrollWidth <= clientWidth`.
**Pronto quando:** nenhuma rota rola de lado em 390 px, nem com nome de grupo
longo, nome de pessoa longo ou 50 participantes.

#### B6. Dados extremos

**Faça:** semeie nome de grupo de 60 caracteres, nome de pessoa com 4 sobrenomes,
tarefa com 200 caracteres, 50 participantes, 0 participantes, número de 6
dígitos no placar.
**Procure:** texto estourando, truncamento sem reticências, layout que pula.
**Pronto quando:** cada tela aguenta o extremo sem quebrar.

#### B7. Teclado e leitor de tela

**Faça:** navegue cada tela só com Tab e Enter.
**Procure:** foco invisível, ordem de foco que pula, `Sheet` que não prende o
foco nem devolve ao fechar, `IconButton` sem `label`, imagem sem `alt`,
`role`/`aria-*` faltando em controle feito à mão.
**Pronto quando:** dá para completar as três ações principais (marcar hábito,
registrar refeição, criar tarefa) sem mouse.

#### B8. Sem emoji fora do permitido

**Faça:** varra o texto renderizado de cada rota procurando emoji.
**Permitido:** só as reações do feed (`FEED_REACTIONS`) e as mensagens do chat.
**Pronto quando:** a varredura acusa zero fora desses dois lugares. A varredura
já existe em `frontend/scripts/verify-ui.mjs` — confirme que continua valendo.

#### B9. Doto no lugar certo

**Faça:** liste todo uso de `--font-numeric` / `--fs-num-*`.
**Regra:** só o numeral de manchete de uma tela. Tudo mais é `--font-ui` com
`tabular-nums`.
**Pronto quando:** cada uso restante é um número de manchete e está legível na
captura.

#### B10. API dos componentes do design system

**Faça:** para cada componente em `design-system/components/`, extraia os nomes
de props aceitos e compare com o que as páginas passam.
**Por quê:** foi a causa de quase todas as telas quebradas até agora — prop que
não existe cai no `...rest` e some sem erro. Casos já vistos: `left`/`right`/
`borderBottom` no `ListRow`, `padding` no `Card`, `size="small"` no `Button`,
`full`/`block`/`icon` no `Button`, `photo`/`avatar` no `Avatar`.
**Pronto quando:** existe um script (ou teste) que falha quando uma página
passa prop desconhecida a um componente do design system.

#### B11. Tokens de CSS que não existem

**Faça:** extraia todo `var(--...)` do `frontend/src/` e confronte com os
tokens declarados em `design-system/tokens/*.css` e `styles.css`.
**Procure também:** nome declarado nos dois lugares — `styles.css` é importada
**depois** dos tokens, então o que ela declara vence. Isso já sobrescreveu sete
tokens em silêncio.
**Pronto quando:** zero referências a token inexistente e zero nomes
duplicados entre as duas folhas, verificado por script.

#### B12. Navegação

**Faça:** de cada sub-página, tente voltar.
**Procure:** beco sem saída (sub-página não tem TabBar; sem botão de voltar não
há saída), botão de voltar que leva ao lugar errado, dois caminhos para a mesma
tela com nomes diferentes, aba que perde a rolagem ao voltar.
**Pronto quando:** toda rota tem saída, e cada destino tem um único nome no app
inteiro.

#### B13. Ações destrutivas

**Faça:** liste tudo que apaga: tarefa, refeição, hábito, rotina, comentário,
plano de treino, sair do grupo.
**Procure:** apagar sem confirmação, confirmação com `confirm()` do navegador
(destoa do resto), ausência de desfazer onde o dado não é recuperável.
**Pronto quando:** toda ação destrutiva tem confirmação no padrão do design
system e diz o que exatamente vai sumir.

#### B14. Formulários

**Faça:** submeta cada formulário vazio, com espaço em branco e com o limite
estourado.
**Procure:** erro só no `alert()`, erro que some antes de ser lido, botão que
continua ativo durante o envio (duplica registro), campo que perde o valor
digitado ao dar erro.
**Pronto quando:** cada erro aparece junto do campo, em português, e nenhum
envio duplo é possível.

#### B15. Texto da interface

**Faça:** leia toda a interface como quem nunca viu o app.
**Procure:** termo diferente para a mesma coisa ("espaço" × "grupo" ×
"perfil"), rótulo que descreve o sistema e não a ação, mensagem de erro que
devolve jargão do backend, número sem unidade, data em formato de máquina.
**Pronto quando:** existe um glossário curto no fim deste documento e a
interface o segue.

#### B16. PWA e offline

**Faça:** instale o app, desligue a rede, abra.
**Procure:** tela branca sem rede, versão velha presa pelo service worker
(há um "Buscar atualização" em `/config` — confirme que funciona), ícone e
`manifest` corretos.
**Pronto quando:** sem rede o app abre e explica o que não dá para fazer.

---

## Parte C — Entrega

### 1. Relatório

Uma tabela, ordenada por severidade:

| # | Parte | Severidade | Achado | Arquivo:linha | Como reproduzir |
|---|-------|-----------|--------|---------------|-----------------|

### 2. Correções

- Um commit por grupo de achados relacionados, com a mensagem explicando **por
  que** aquilo era um problema — não o que a linha faz.
- Todo achado `crítico` ou `alto` vira teste antes da correção; o teste falha
  antes e passa depois.
- Achado de UX vira captura antes/depois.

### 3. Antes de abrir o PR

```bash
cd backend && ../.venv/bin/python -m pytest tests/ -q   # 87+ passando
cd frontend && npm run build && npm run verify:ui        # 18 rotas limpas
```

### 4. Fora de escopo

Anote aqui o que apareceu e não foi tratado, para não se perder.

---

## Anexo: o que esta revisão **não** cobre

- Carga e desempenho sob concorrência.
- Retenção e exclusão de dados (LGPD) — merece uma passada própria.
- Custo e limite de uso dos provedores de IA.
- Acessibilidade além de teclado e contraste (leitores de tela reais, tamanho
  de fonte do sistema).
