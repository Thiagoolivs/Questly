import { useNavigate } from 'react-router-dom'
import { IconButton } from '../design-system/components/index.js'

/**
 * Botão de voltar das sub-páginas.
 *
 * A TabBar só aparece nas cinco abas principais, então uma sub-página sem isto
 * é um beco sem saída: não há barra embaixo nem seta em cima.
 */
export default function VoltarPara({ para = -1, label = 'Voltar' }) {
  const navigate = useNavigate()
  return <IconButton icon="arrow-left" label={label} onClick={() => navigate(para)} />
}
