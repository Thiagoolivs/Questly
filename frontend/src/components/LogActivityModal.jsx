import { useState } from 'react'
import { api } from '../api.js'
import { useApp } from '../store.jsx'
import Icon from './Icon.jsx'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'

const MODALITIES = [
  { id: 'corrida', label: 'Corrida', emoji: '🏃', fields: ['distance', 'duration', 'intensity'] },
  { id: 'caminhada', label: 'Caminhada', emoji: '🚶', fields: ['distance', 'duration', 'intensity'] },
  { id: 'ciclismo', label: 'Ciclismo', emoji: '🚴', fields: ['distance', 'duration', 'intensity'] },
  { id: 'musculacao', label: 'Musculação', emoji: '🏋️', fields: ['duration', 'intensity'] },
  { id: 'jiu-jitsu', label: 'Jiu-Jitsu', emoji: '🥋', fields: ['duration', 'rolas', 'intensity'] },
]

export default function LogActivityModal({ onClose, onSuccess }) {
  const { currentGroup, refreshFeed } = useApp()
  const [modality, setModality] = useState(MODALITIES[0].id)
  
  // yyyy-mm-dd
  const [date, setDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState('moderado')
  const [rolas, setRolas] = useState('')
  const [proofImage, setProofImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const activeModality = MODALITIES.find((m) => m.id === modality)

  async function handlePickImage() {
    const f = await pickImage()
    if (!f) return
    const compressed = await fileToCompressedDataURL(f)
    setProofImage(compressed)
  }

  async function submit(e) {
    e.preventDefault()
    if (busy || !currentGroup) return
    setBusy(true)
    setErr('')
    
    try {
      const params = {}
      if (activeModality.fields.includes('distance')) params.distance = Number(distance)
      if (activeModality.fields.includes('duration')) params.duration = Number(duration)
      if (activeModality.fields.includes('intensity')) params.intensity = intensity
      if (activeModality.fields.includes('rolas')) params.rolas = Number(rolas)

      const payload = {
        date,
        modality,
        category: 'fitness', // default for now
        params,
        proof_image: proofImage
      }

      await api.createActivityRecord(currentGroup.id, payload)
      if (refreshFeed) refreshFeed()
      if (onSuccess) onSuccess()
      onClose()
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar Atividade</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={20} /></button>
        </div>

        <form onSubmit={submit} className="modal-body form-stack">
          <label className="field">
            <span>Modalidade</span>
            <div className="tabs inline-tabs">
              {MODALITIES.map(m => (
                <button 
                  key={m.id} 
                  type="button"
                  className={modality === m.id ? 'active' : ''} 
                  onClick={() => setModality(m.id)}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>
          </label>

          <label className="field">
            <span>Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>

          {activeModality?.fields.includes('distance') && (
            <label className="field">
              <span>Distância (km)</span>
              <input type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="Ex: 5.2" required />
            </label>
          )}

          {activeModality?.fields.includes('duration') && (
            <label className="field">
              <span>Duração (minutos)</span>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Ex: 45" required />
            </label>
          )}

          {activeModality?.fields.includes('rolas') && (
            <label className="field">
              <span>Número de Rolas</span>
              <input type="number" value={rolas} onChange={(e) => setRolas(e.target.value)} placeholder="Ex: 5" required />
            </label>
          )}

          {activeModality?.fields.includes('intensity') && (
            <label className="field">
              <span>Intensidade</span>
              <select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
                <option value="leve">Leve</option>
                <option value="moderado">Moderado</option>
                <option value="intenso">Intenso</option>
                <option value="extremo">Extremo</option>
              </select>
            </label>
          )}

          <label className="field">
            <span>Foto da Atividade (opcional)</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {proofImage && <img src={proofImage} alt="Preview" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />}
              <button type="button" className="btn ghost" onClick={handlePickImage}>
                <Icon name="image" size={16} /> Escolher Foto
              </button>
              {proofImage && (
                <button type="button" className="btn ghost icon-btn" onClick={() => setProofImage(null)}>
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>
          </label>

          {err && <div className="err-msg">{err}</div>}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
