// Abre o seletor de imagem e devolve o File escolhido (ou null).
// source: 'camera' força tirar na hora; 'library'/undefined deixa o sistema
// oferecer galeria + câmera (padrão — permite escolher a origem).
export function pickImage({ source } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (source === 'camera') input.capture = 'environment'
    input.onchange = () => resolve(input.files?.[0] || null)
    input.click()
  })
}

// Redimensiona uma imagem para um data URL JPEG compacto (bom para enviar por JSON).
export function fileToCompressedDataURL(file, maxSize = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const img = new Image()
    reader.onload = () => {
      img.src = reader.result
    }
    reader.onerror = reject
    img.onload = () => {
      let { width, height } = img
      if (width >= height && width > maxSize) {
        height = Math.round((height * maxSize) / width)
        width = maxSize
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height)
        height = maxSize
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    reader.readAsDataURL(file)
  })
}
