import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Avatar, Button, Card, Chip, Icon, IconButton, Input, ListRow, Select } from '../design-system/components/index.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'

/**
 * Perfil — quem você é e o que você quer.
 *
 * As configurações do aplicativo e as do grupo saíram daqui: misturadas com os
 * dados pessoais, era impossível achar qualquer uma das três.
 */
const SEXOS = [
  { value: '', label: 'Prefiro não dizer' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
]

const NIVEIS = [
  { value: '', label: 'Não informado' },
  { value: 'sedentario', label: 'Sedentário' },
  { value: 'leve', label: 'Levemente ativo' },
  { value: 'moderado', label: 'Moderadamente ativo' },
  { value: 'intenso', label: 'Muito ativo' },
]

const OBJETIVOS = [
  { value: '', label: 'Não informado' },
  { value: 'perder', label: 'Perder peso' },
  { value: 'manter', label: 'Manter' },
  { value: 'ganhar', label: 'Ganhar massa' },
]

const numOuNulo = (v) => (v === '' || v == null ? null : Number(v))

export default function Perfil() {
  const { user, updateUser, group } = useApp()
  const [form, setForm] = useState(null)
  const [progresso, setProgresso] = useState(null)
  const [salvo, setSalvo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name ?? '',
      photo: user.photo ?? null,
      objetivo: user.objetivo ?? '',
      peso: user.peso ?? '',
      altura_cm: user.altura_cm ?? '',
      idade: user.idade ?? '',
      sexo: user.sexo ?? '',
      nivel_atividade: user.nivel_atividade ?? '',
      objetivo_tipo: user.objetivo_tipo ?? '',
    })
  }, [user?.id])

  useEffect(() => {
    api.today().then((d) => setProgresso(d.summary)).catch(() => {})
  }, [])

  if (!user || !form) return <div className="screen center muted">Carregando…</div>

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const trocarFoto = async () => {
    const f = await pickImage()
    if (!f) return
    setOcupado(true)
    try {
      const foto = await fileToCompressedDataURL(f)
      set({ photo: foto })
      await updateUser({ photo: foto })
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const salvar = async () => {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      await updateUser({
        name: form.name.trim(),
        objetivo: form.objetivo.trim(),
        peso: numOuNulo(form.peso),
        altura_cm: numOuNulo(form.altura_cm),
        idade: numOuNulo(form.idade),
        sexo: form.sexo || null,
        nivel_atividade: form.nivel_atividade || null,
        objetivo_tipo: form.objetivo_tipo || null,
      })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 1800)
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div
      className="screen"
      style={{
        paddingTop: 'var(--space-7)',
        paddingLeft: 'var(--gutter-screen)',
        paddingRight: 'var(--gutter-screen)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-7)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
        <div style={{ position: 'relative' }}>
          <Avatar src={form.photo} name={form.name} size={72} />
          <div style={{ position: 'absolute', right: -4, bottom: -4 }}>
            <IconButton icon="camera" label="Trocar foto" size={28} tone="light" onClick={trocarFoto} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-2)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--text-primary)',
            }}
          >
            {user.name}
          </h1>
          {progresso && (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
              <Chip>Nível {progresso.level}</Chip>
              <Chip>{progresso.xp} XP</Chip>
            </div>
          )}
        </div>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <Titulo>Meus dados</Titulo>
        <Input label="Nome" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        <Input
          label="Objetivo"
          placeholder="O que você quer conquistar"
          value={form.objetivo}
          onChange={(e) => set({ objetivo: e.target.value })}
        />
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
          A IA usa seu objetivo ao montar plano de treino, então vale escrever.
        </p>

        {/* Três campos lado a lado não cabem num telefone estreito — a unidade
            some e o terceiro sai da tela. Duas colunas que quebram resolvem. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-5)' }}>
          <Input label="Peso" type="number" inputMode="decimal" unit="kg" value={form.peso} onChange={(e) => set({ peso: e.target.value })} />
          <Input label="Altura" type="number" inputMode="numeric" unit="cm" value={form.altura_cm} onChange={(e) => set({ altura_cm: e.target.value })} />
          <Input label="Idade" type="number" inputMode="numeric" unit="anos" value={form.idade} onChange={(e) => set({ idade: e.target.value })} />
        </div>

        <Select label="Sexo" value={form.sexo} onChange={(e) => set({ sexo: e.target.value })} options={SEXOS} />
        <Select
          label="Nível de atividade"
          value={form.nivel_atividade}
          onChange={(e) => set({ nivel_atividade: e.target.value })}
          options={NIVEIS}
        />
        <Select
          label="Meta de peso"
          value={form.objetivo_tipo}
          onChange={(e) => set({ objetivo_tipo: e.target.value })}
          options={OBJETIVOS}
        />

        {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}

        <Button variant="accent" fullWidth onClick={salvar} disabled={ocupado}>
          {salvo ? 'Salvo' : ocupado ? 'Salvando…' : 'Salvar'}
        </Button>
      </section>

      {/* Uma porta por assunto: o app se configura aqui, o grupo se configura
          na engrenagem do próprio grupo. Antes as duas coisas apareciam em
          três lugares diferentes e nenhum deles dizia qual era qual. */}
      <section>
        <Titulo>Ajustes</Titulo>
        <Card pad="0 var(--pad-card)" style={{ marginTop: 'var(--space-5)' }}>
          <Link to="/config" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow
              icon="settings"
              title="Configurações do app"
              subtitle="Lembretes, tour e atualização"
              onClick={() => {}}
              divider={false}
            />
          </Link>
        </Card>
        <p
          style={{
            margin: 'var(--space-4) 0 0',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--text-tertiary)',
          }}
        >
          Suas metas de calorias, macros e água saem dos dados acima. As regras
          {group ? ` de ${group.name}` : ' do seu espaço'} ficam na engrenagem da aba Grupo.
        </p>
      </section>
    </div>
  )
}

function Titulo({ children }) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--fs-micro)',
        fontWeight: 'var(--fw-bold)',
        letterSpacing: 'var(--ls-caps)',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
      }}
    >
      {children}
    </h2>
  )
}
