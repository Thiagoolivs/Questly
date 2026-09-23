import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Chip, Icon } from '../design-system/components/index.js'
import Sheet from './Sheet.jsx'

/**
 * Lista de opções prontas para marcar e adicionar de uma vez.
 *
 * Existe porque a tela em branco com o teclado do celular é onde a maioria
 * desiste: escolher cinco hábitos de uma lista leva seis toques, escrevê-los
 * leva cinco minutos. Nada aqui substitui o campo livre — as telas continuam
 * com "criar do zero" ao lado, e o que entra por aqui é editável depois.
 */
export default function EscolherProntos({
  titulo,
  explicacao,
  itens,
  categorias,
  // Como desenhar cada item: { nome, detalhe }.
  resumo,
  // Quais já existem (por rótulo) — marcados e travados, para não duplicar.
  jaExistem = [],
  multiplo = true,
  rotuloConfirmar = 'Adicionar',
  onConfirmar,
  onFechar,
}) {
  const [marcados, setMarcados] = useState([])
  const [categoria, setCategoria] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const existentes = useMemo(
    () => new Set(jaExistem.map((n) => String(n).trim().toLowerCase())),
    [jaExistem],
  )

  const visiveis = useMemo(
    () => (categoria ? itens.filter((i) => i.category === categoria) : itens),
    [itens, categoria],
  )

  // Trocar de categoria não pode carregar seleção que sumiu da tela: a pessoa
  // confirmaria coisas que não vê.
  useEffect(() => {
    setMarcados((atual) => atual.filter((k) => visiveis.some((i) => i.key === k)))
  }, [visiveis])

  const alternar = (chave) =>
    setMarcados((atual) =>
      multiplo
        ? atual.includes(chave) ? atual.filter((k) => k !== chave) : [...atual, chave]
        : atual.includes(chave) ? [] : [chave],
    )

  const confirmar = async () => {
    if (ocupado || marcados.length === 0) return
    setOcupado(true)
    setErro('')
    try {
      await onConfirmar(itens.filter((i) => marcados.includes(i.key)))
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title={titulo}
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={confirmar} disabled={ocupado || marcados.length === 0}>
            {ocupado ? 'Adicionando…' : `${rotuloConfirmar}${marcados.length ? ` (${marcados.length})` : ''}`}
          </Button>
        </>
      }
    >
      {explicacao ? (
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
          {explicacao}
        </p>
      ) : null}

      {categorias?.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Chip selected={categoria === ''} onClick={() => setCategoria('')}>
            Tudo
          </Chip>
          {categorias.map((c) => (
            <Chip key={c.value} selected={categoria === c.value} onClick={() => setCategoria(c.value)}>
              {c.label}
            </Chip>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {visiveis.map((item) => {
          const { nome, detalhe } = resumo(item)
          const existe = existentes.has(String(nome).trim().toLowerCase())
          const marcado = marcados.includes(item.key)
          return (
            <Card
              key={item.key}
              pad="var(--space-5)"
              style={{
                opacity: existe ? 0.45 : 1,
                border: marcado ? '1px solid var(--blue-glow)' : undefined,
              }}
            >
              <button
                type="button"
                disabled={existe}
                onClick={() => alternar(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-5)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  textAlign: 'left',
                  cursor: existe ? 'default' : 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon
                  name={marcado || existe ? 'check-circle' : 'circle'}
                  size={20}
                  color={marcado || existe ? 'var(--blue-glow)' : 'var(--text-tertiary)'}
                />
                {item.icon ? <Icon name={item.icon} size={16} color="var(--text-tertiary)" /> : null}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--fs-body)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {nome}
                  </span>
                  {detalhe ? (
                    <span
                      style={{
                        display: 'block',
                        marginTop: 2,
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--fs-body-sm)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {existe ? 'Você já tem este' : detalhe}
                    </span>
                  ) : null}
                </span>
              </button>
            </Card>
          )
        })}
        {visiveis.length === 0 ? (
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            Nada nesta categoria.
          </p>
        ) : null}
      </div>

      {erro ? <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p> : null}
    </Sheet>
  )
}
