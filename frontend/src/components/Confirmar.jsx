import { useState } from 'react'
import { Button } from '../design-system/components/index.js'
import Sheet from './Sheet.jsx'

/**
 * Confirmação para o que não dá para desfazer depois.
 *
 * A regra do app é: se a ação tem volta, ela acontece na hora e o aviso do
 * rodapé oferece "Desfazer". Só o que apaga histórico junto — hábito, rotina,
 * plano de treino, publicação — passa por aqui, e o texto diz o que vai embora,
 * porque "Tem certeza?" não informa nada.
 */
export default function Confirmar({
  titulo,
  descricao,
  rotuloConfirmar = 'Apagar',
  onConfirmar,
  onFechar,
}) {
  const [ocupado, setOcupado] = useState(false)

  const confirmar = async () => {
    if (ocupado) return
    setOcupado(true)
    try {
      await onConfirmar()
      onFechar()
    } catch {
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title={titulo}
      onClose={ocupado ? () => {} : onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button
            variant="accent"
            fullWidth
            onClick={confirmar}
            disabled={ocupado}
            style={{ background: 'var(--danger)' }}
          >
            {ocupado ? 'Apagando…' : rotuloConfirmar}
          </Button>
        </>
      }
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--fs-body-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {descricao}
      </p>
    </Sheet>
  )
}
