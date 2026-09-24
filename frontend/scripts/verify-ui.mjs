/**
 * Varredura da interface com o app rodando de verdade.
 *
 * O build não pega o que quebra em tempo de execução. Esta varredura já achou,
 * por exemplo: compromisso com horário estourando 500, a TabBar bloqueando o
 * botão do tour, e campo saindo da tela num telefone estreito.
 *
 * Para cada rota confere: erro de console, tela em branco, emoji na interface
 * (só as reações do feed e o chat podem ter) e vazamento horizontal.
 *
 * Como rodar:
 *   cd backend && QUESTLY_DB=/tmp/questly-ui.db python -m uvicorn app.main:app --port 8099
 *   cd frontend && npm run build && npm run verify:ui
 *
 * QUESTLY_BASE muda o endereço (o CI sobe o backend noutra porta).
 */
import { existsSync, mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const BASE = process.env.QUESTLY_BASE || 'http://127.0.0.1:8099'
// O ambiente do agente traz o Chromium num caminho fixo; no CI e na máquina de
// quem desenvolve, quem acha o navegador é o próprio Playwright.
const CHROMIUM = '/opt/pw-browsers/chromium'
const lancar = () => chromium.launch(existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {})
// Onde as capturas da varredura saem. Sobrescreva com QUESTLY_UI_OUT.
const SAIDA = process.env.QUESTLY_UI_OUT || '/tmp/questly-ui'
mkdirSync(SAIDA, { recursive: true })

const ROTAS = ['/', '/agenda', '/registrar', '/desafio', '/plano', '/treino', '/nutricao',
               '/rotinas', '/habitos', '/grupo', '/grupo/config', '/feed', '/mural',
               '/perfil', '/config', '/tarefas', '/conquistas', '/semana', '/chat']

const browser = await lancar()
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const erros = []
page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()) })
page.on('pageerror', (e) => erros.push('pageerror: ' + e.message))

// --- 1) Usuário NOVO: o tour tem de aparecer sozinho -----------------------
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(async (base) => {
  const r = await fetch(base + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `t${Date.now()}@q.app`, password: 'secret123', name: 'Thiago Silva', avatar: '' }) })
  localStorage.setItem('questly.token', (await r.json()).token)
}, BASE)
await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
const tourVisivel = await page.locator('.tour-card').count() > 0
console.log('tour aparece para usuário novo:', tourVisivel)
if (tourVisivel) {
  const passos = []
  for (let i = 0; i < 7; i++) {
    passos.push((await page.locator('.tour-title').innerText()).trim())
    const prox = page.getByRole('button', { name: /Próximo|Tudo certo/ })
    if (!(await prox.count())) break
    await prox.click(); await page.waitForTimeout(450)
  }
  console.log('passos:', passos.join(' > '))
  const aindaAberto = await page.locator('.tour-card').count() > 0
  console.log('tour fecha no fim:', !aindaAberto)
}

// --- 2) Dados de exemplo + varredura de rotas ------------------------------
await page.evaluate(async (base) => {
  localStorage.setItem('questly.tour.v3', '1')
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('questly.token') }
  const g = await (await fetch(base + '/api/groups', { method: 'POST', headers: H,
    body: JSON.stringify({ name: 'Time do Thiago', group_type: 'group' }) })).json()
  await fetch(base + '/api/habits', { method: 'POST', headers: H, body: JSON.stringify({ name: 'Beber 3L de água', frequency: 'daily', time: '08:00' }) })
  await fetch(base + '/api/routines', { method: 'POST', headers: H, body: JSON.stringify({
    name: 'Manhã', frequency: { type: 'daily' }, time_slot: 'morning',
    steps: [{ name: 'Alongar', duration_min: 5 }, { name: 'Planejar o dia', duration_min: 5 }] }) })
  const d = new Date(); const p = (n) => String(n).padStart(2, '0')
  await fetch(base + '/api/calendar', { method: 'POST', headers: H, body: JSON.stringify({
    title: 'Treino de Jiu-Jitsu', category: 'treino', duration_min: 90,
    start_datetime: `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T19:00:00`, reminder_minutes: [30] }) })
  await fetch(base + `/api/groups/${g.id}/activity-record`, { method: 'POST', headers: H,
    body: JSON.stringify({ modality: 'corrida', category: 'fitness', params: { distance: 8, duration: 42, intensity: 'intenso' } }) })
}, BASE)

let falhas = 0
for (const rota of ROTAS) {
  erros.length = 0
  await page.goto(BASE + rota, { waitUntil: 'networkidle' })
  await page.waitForTimeout(450)
  const txt = (await page.locator('body').innerText()).trim()
  const emoji = await page.evaluate(() => (document.body.innerText.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || []).join(''))
  // Nada pode vazar para fora da largura do telefone: campo cortado é campo
  // que o usuário não preenche.
  const vaza = await page.evaluate(() => {
    const larg = document.documentElement.clientWidth
    if (document.documentElement.scrollWidth > larg + 1) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && (r.right > larg + 1 || r.left < -1)) {
          return `${el.tagName.toLowerCase()} "${(el.textContent || '').trim().slice(0, 24)}"`
        }
      }
      return 'algum elemento'
    }
    return null
  })
  const ok = erros.length === 0 && txt.length > 5 && !emoji && !vaza
  if (!ok) falhas++
  console.log(`${ok ? 'ok   ' : 'FALHA'} ${rota.padEnd(14)} ${emoji ? 'EMOJI:' + emoji + ' ' : ''}${vaza ? 'VAZA: ' + vaza + ' ' : ''}${txt.split('\n')[0].slice(0, 26)}`)
  for (const e of erros.slice(0, 2)) console.log(`        ${e.slice(0, 110)}`)
}
for (const [r, n] of [['/perfil', 'perfil'], ['/config', 'config'], ['/plano', 'meu-plano']]) {
  await page.goto(BASE + r, { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
  await page.screenshot({ path: `${SAIDA}/${n}.png` })
}

// --- 3) Escolher prontos: a seleção atravessa o filtro de categoria ---------
// Um `useEffect` que limpava o que não estava à vista fazia a seleção sumir a
// cada troca de categoria — bug invisível para o build e para a varredura de
// rotas, porque só aparece depois de dois toques dentro de uma folha.
erros.length = 0
await page.goto(BASE + '/habitos', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.getByRole('button', { name: /Escolher prontos/i }).first().click()
await page.waitForTimeout(500)

const marcados = async () =>
  Number((await page.getByRole('button', { name: /^Adicionar/ }).innerText()).match(/\((\d+)\)/)?.[1] ?? 0)
const marcar = async (nome) => {
  await page.locator('button').filter({ hasText: nome }).first().click()
  await page.waitForTimeout(250)
}
const filtrar = async (nome) => {
  await page.getByText(nome, { exact: true }).first().click()
  await page.waitForTimeout(350)
}

await filtrar('Corpo')
await marcar('Caminhar 8 mil passos')
const antes = await marcados()
await filtrar('Sono')
const depois = await marcados()
await marcar('Dormir antes das 23h')
const somados = await marcados()

const selecaoOk = antes === 1 && depois === 1 && somados === 2 && erros.length === 0
if (!selecaoOk) falhas++
console.log(
  `${selecaoOk ? 'ok   ' : 'FALHA'} prontos        seleção sobrevive à troca de categoria ` +
  `(${antes} → ${depois} → ${somados}, esperado 1 → 1 → 2)`,
)
for (const e of erros.slice(0, 2)) console.log(`        ${e.slice(0, 110)}`)

console.log(falhas ? `\n${falhas} verificações com problema` : '\ntudo ok')
// Sem isto a varredura sempre saía 0: o job do CI ficava verde imprimindo
// "N rotas com problema" logo acima. O verify:props já reprovava; este não.
if (falhas) process.exitCode = 1
await browser.close()
