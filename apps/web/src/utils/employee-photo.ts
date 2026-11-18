const TARGET_WIDTH = 300
const TARGET_HEIGHT = 400
const TARGET_ASPECT_RATIO = TARGET_WIDTH / TARGET_HEIGHT // 3:4 (0.75)
const MAX_RAW_FILE_BYTES = 8 * 1024 * 1024 // 8 MB input file limit

const ALLOWED_INPUT_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

/**
 * Processa qualquer imagem selecionada pelo usuário no navegador:
 * 1. Valida formato (JPEG, PNG, WebP) e tamanho bruto (até 8 MB);
 * 2. Realiza o corte centralizado automático na proporção oficial 3:4 (priorizando o enquadramento de retrato);
 * 3. Redimensiona para 300x400px em Canvas com alta nitidez e fundo branco;
 * 4. Comprime para JPEG (qualidade 0.86), gerando um Data URI leve (~15 KB a 28 KB) compatível com PostgreSQL e @react-pdf/renderer.
 */
export async function processImageTo3x4DataUrl(file: File): Promise<string> {
  if (!ALLOWED_INPUT_TYPES.has(file.type.toLowerCase())) {
    throw new Error(
      'Formato de arquivo não suportado. Selecione uma imagem JPG, PNG ou WebP.'
    )
  }

  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new Error(
      'A imagem selecionada é muito grande (máximo 8 MB). Escolha outra imagem.'
    )
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () =>
        reject(new Error('Não foi possível carregar a imagem selecionada.'))
      image.src = objectUrl
    })

    const srcWidth = img.naturalWidth || img.width
    const srcHeight = img.naturalHeight || img.height

    if (!srcWidth || !srcHeight) {
      throw new Error('Dimensões da imagem inválidas.')
    }

    const srcRatio = srcWidth / srcHeight

    let cropWidth = srcWidth
    let cropHeight = srcHeight
    let cropX = 0
    let cropY = 0

    if (srcRatio > TARGET_ASPECT_RATIO) {
      // Imagem mais larga que 3:4 -> corta as laterais centralizando
      cropHeight = srcHeight
      cropWidth = Math.round(srcHeight * TARGET_ASPECT_RATIO)
      cropX = Math.round((srcWidth - cropWidth) / 2)
      cropY = 0
    } else if (srcRatio < TARGET_ASPECT_RATIO) {
      // Imagem mais alta que 3:4 -> corta topo/base priorizando a região do rosto (35% do topo)
      cropWidth = srcWidth
      cropHeight = Math.round(srcWidth / TARGET_ASPECT_RATIO)
      cropX = 0
      cropY = Math.round((srcHeight - cropHeight) * 0.35)
    }

    const canvas = document.createElement('canvas')
    canvas.width = TARGET_WIDTH
    canvas.height = TARGET_HEIGHT

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Não foi possível inicializar o processador de imagem.')
    }

    // Fundo branco para evitar transparência preta ao converter PNG transparente para JPEG
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT)

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT
    )

    return canvas.toDataURL('image/jpeg', 0.86)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
