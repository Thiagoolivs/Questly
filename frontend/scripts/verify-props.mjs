/**
 * Confere que as páginas só passam props que os componentes do design system
 * realmente aceitam.
 *
 * Por que isto existe: prop desconhecida não dá erro nenhum. Ela cai no
 * `...rest`, vira atributo de um `<div>` e some. Foi assim que as linhas de
 * Tarefas ficaram sem caixa de marcação (`left`/`right` no ListRow), que a
 * lista de hábitos da config do grupo virou texto sem botão, e que o Card
 * ignorou `padding=`. Nada disso aparece no build nem no console.
 *
 * Também confere nome de ícone, que é o mesmo buraco com outra cara: o registro
 * do Icon é kebab-case e nome fora dele vira um vão vazio, sem erro. Foi assim
 * que o botão de enviar do chat ficou sem seta nenhuma (`arrowRight` em vez de
 * `send`) — o build passa, o console fica limpo e a varredura das telas não vê.
 *
 * O que ele NÃO pega: valor inválido num nome válido fora dos ícones
 * (`size="small"` no Button). Para isso os componentes caem no padrão em vez
 * de estourar. Nem nome de ícone vindo de variável (`name={x}`), que só o
 * runtime resolve.
 *
 * Como rodar:  npm run verify:props
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, basename, extname } from 'node:path'

const RAIZ = new URL('..', import.meta.url).pathname
const DS = join(RAIZ, 'src/design-system/components')
const CODIGO = join(RAIZ, 'src')

/** Atributos que qualquer componente repassa ao DOM pelo `...rest`. */
const PASSAM_DIRETO = new Set([
  'key', 'ref', 'id', 'className', 'style', 'role', 'tabIndex', 'hidden',
  'type', 'name', 'value', 'defaultValue', 'placeholder', 'disabled', 'required',
  'readOnly', 'checked', 'autoFocus', 'autoComplete', 'maxLength', 'minLength',
  'min', 'max', 'step', 'inputMode', 'pattern', 'rows', 'cols', 'multiple',
  'src', 'alt', 'href', 'target', 'rel', 'download', 'loading',
  'onClick', 'onChange', 'onInput', 'onSubmit', 'onFocus', 'onBlur',
  'onKeyDown', 'onKeyUp', 'onKeyPress', 'onPointerDown', 'onPointerUp',
  'onMouseEnter', 'onMouseLeave', 'onTouchStart', 'onTouchEnd',
])

const ehPassagem = (nome) =>
  PASSAM_DIRETO.has(nome) || nome.startsWith('data-') || nome.startsWith('aria-')

const ABRE = '([{'
const FECHA = ')]}'

function arquivos(dir, ext = ['.jsx', '.js']) {
  const saida = []
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho, ext))
    else if (ext.includes(extname(nome))) saida.push(caminho)
  }
  return saida
}

/** Separa por vírgula só no nível de cima (valor padrão pode ter as suas). */
function fatiar(texto) {
  const pedacos = []
  let profundidade = 0
  let atual = ''
  for (const ch of texto) {
    if (ABRE.includes(ch)) profundidade++
    else if (FECHA.includes(ch)) profundidade--

    if (ch === ',' && profundidade === 0) {
      pedacos.push(atual)
      atual = ''
    } else {
      atual += ch
    }
  }
  pedacos.push(atual)
  return pedacos
}

/**
 * Props aceitas por um componente, lidas da desestruturação da assinatura:
 *   export default function Card({ children, tone = "card", ...rest }) {
 * Devolve `null` quando a assinatura não é desestruturada — aí não dá para
 * afirmar nada e o componente fica de fora da checagem.
 */
function propsAceitas(fonte) {
  const m = fonte.match(/export default function \w+\(\s*\{([\s\S]*?)\}\s*(?:,|\))/)
  if (!m) return null

  const props = new Set()
  for (const pedaco of fatiar(m[1])) {
    // Só o nome interessa: o que vem depois de `=` é valor padrão.
    const nome = pedaco.split('=')[0].trim()
    if (nome && !nome.startsWith('...')) props.add(nome)
  }
  return props.size ? props : null
}

/**
 * Acha o `>` que fecha a tag de abertura iniciada em `inicio`.
 *
 * Não dá para fazer isso com expressão regular: um atributo pode conter JSX
 * (`left={<span>x</span>}`), string com `>` dentro, e quebras de linha. O
 * scanner anda caractere a caractere contando chaves e ignorando o que está
 * dentro de aspas.
 */
function fimDaTag(fonte, inicio) {
  let profundidade = 0
  let aspas = null
  for (let i = inicio; i < fonte.length; i++) {
    const ch = fonte[i]

    if (aspas) {
      if (ch === '\\') i++
      else if (ch === aspas) aspas = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      aspas = ch
      continue
    }
    if (ABRE.includes(ch)) profundidade++
    else if (FECHA.includes(ch)) profundidade--
    else if (ch === '>' && profundidade === 0) return i
  }
  return -1
}

/** Nomes de atributo do miolo da tag — só os do nível de cima. */
function atributosDe(miolo) {
  const nomes = []
  let profundidade = 0
  let aspas = null
  let palavra = ''

  const guardar = () => {
    if (/^[a-zA-Z][\w:-]*$/.test(palavra)) nomes.push(palavra)
    palavra = ''
  }

  for (let i = 0; i < miolo.length; i++) {
    const ch = miolo[i]

    if (aspas) {
      if (ch === '\\') i++
      else if (ch === aspas) aspas = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      aspas = ch
      palavra = ''
      continue
    }
    if (ABRE.includes(ch)) {
      profundidade++
      palavra = ''
      continue
    }
    if (FECHA.includes(ch)) {
      profundidade--
      palavra = ''
      continue
    }
    if (profundidade > 0) continue

    if (/[\w:-]/.test(ch)) {
      palavra += ch
    } else {
      // `=` fecha um atributo com valor; espaço fecha um booleano (`<Button pill>`).
      guardar()
    }
  }
  guardar()
  return nomes
}

// --- 1) o que cada componente do design system aceita ----------------------
const catalogo = new Map()
for (const caminho of arquivos(DS)) {
  const nome = basename(caminho, extname(caminho))
  if (nome === 'index') continue
  const aceitas = propsAceitas(readFileSync(caminho, 'utf8'))
  if (aceitas) catalogo.set(nome, aceitas)
}

// --- 2) o que as telas passam ----------------------------------------------
const problemas = []
for (const caminho of arquivos(CODIGO)) {
  if (caminho.startsWith(DS)) continue
  const fonte = readFileSync(caminho, 'utf8')

  // Só vale para componentes importados do design system neste arquivo.
  const importados = new Set()
  for (const imp of fonte.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*design-system[^'"]*['"]/g)) {
    for (const nome of imp[1].split(',')) {
      const limpo = nome.trim().split(/\s+as\s+/).pop().trim()
      if (limpo) importados.add(limpo)
    }
  }
  if (!importados.size) continue

  for (const abre of fonte.matchAll(/<([A-Z]\w*)[\s/>]/g)) {
    const componente = abre[1]
    if (!importados.has(componente) || !catalogo.has(componente)) continue

    const inicioMiolo = abre.index + 1 + componente.length
    const fim = fimDaTag(fonte, inicioMiolo)
    if (fim === -1) continue

    const aceitas = catalogo.get(componente)
    const linha = fonte.slice(0, abre.index).split('\n').length
    for (const prop of atributosDe(fonte.slice(inicioMiolo, fim))) {
      if (aceitas.has(prop) || ehPassagem(prop)) continue
      problemas.push({
        arquivo: relative(RAIZ, caminho),
        linha,
        componente,
        prop,
        aceitas: [...aceitas].sort().join(', '),
      })
    }
  }
}

// --- 3) nomes de ícone -----------------------------------------------------
// O registro é explícito (kebab-case). Nome fora dele não quebra nada: o Icon
// devolve um <span> do tamanho certo e a tela fica com um buraco invisível.
const fonteIcon = readFileSync(join(DS, 'core/Icon.jsx'), 'utf8')
const blocoIcons = fonteIcon.slice(fonteIcon.indexOf('const ICONS'), fonteIcon.indexOf('export default'))
const registrados = new Set(
  [...blocoIcons.matchAll(/(?:"([\w-]+)"|^\s*([A-Za-z_]\w*))\s*:/gm)].map((m) => m[1] || m[2]),
)

const iconesRuins = []
for (const caminho of arquivos(CODIGO)) {
  const fonte = readFileSync(caminho, 'utf8')
  const anota = (nome, indice) => {
    if (registrados.has(nome)) return
    iconesRuins.push({
      arquivo: relative(RAIZ, caminho),
      linha: fonte.slice(0, indice).split('\n').length,
      nome,
    })
  }
  // <Icon name="..."> — só o name de dentro da tag do Icon, não o de um <input>.
  for (const abre of fonte.matchAll(/<Icon[\s/>]/g)) {
    const inicioMiolo = abre.index + 5
    const fim = fimDaTag(fonte, inicioMiolo)
    if (fim === -1) continue
    const m = fonte.slice(inicioMiolo, fim).match(/\bname="([^"]+)"/)
    if (m) anota(m[1], abre.index)
  }
  // icon="..." em qualquer componente (IconButton, TabBar…): `icon` não é
  // atributo de DOM, então literal aqui é sempre nome de ícone.
  for (const m of fonte.matchAll(/\bicon="([^"]+)"/g)) anota(m[1], m.index)
}

// --- 4) relatório -----------------------------------------------------------
console.log(`componentes conferidos: ${[...catalogo.keys()].sort().join(', ')}`)
console.log(`ícones registrados: ${registrados.size}\n`)

if (!problemas.length && !iconesRuins.length) {
  console.log('ok — nenhuma prop desconhecida, nenhum ícone fora do registro.')
  process.exit(0)
}

for (const i of iconesRuins) {
  console.log(`FALHA ${i.arquivo}:${i.linha}  ícone "${i.nome}" não está no registro`)
  console.log(`      o Icon devolve um vão vazio: some da tela sem dar erro\n`)
}

for (const p of problemas) {
  console.log(`FALHA ${p.arquivo}:${p.linha}  <${p.componente} ${p.prop}=…>`)
  console.log(`      ${p.componente} aceita: ${p.aceitas}\n`)
}
if (problemas.length) {
  console.log(`${problemas.length} prop(s) desconhecida(s). Elas somem no \`...rest\` sem dar erro.`)
}
if (iconesRuins.length) {
  console.log(`${iconesRuins.length} ícone(s) fora do registro.`)
}
process.exit(1)
