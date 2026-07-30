export async function shareContent(title: string, text: string, url?: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return true
    } catch {
      return false
    }
  }

  const fullText = url ? `${text}\n\n${url}` : text
  try {
    await navigator.clipboard.writeText(fullText)
    return true
  } catch {
    return false
  }
}

export function getShareText(params: {
  dayNumber: number
  title: string
  book: string
  chapters?: string
  sectionName?: string
}): string {
  const { dayNumber, title, book, chapters, sectionName } = params
  let text = `📖 Leitura da Bíblia — Dia ${dayNumber}\n${title}`
  if (chapters) text += `\n📚 ${book} ${chapters}`
  if (sectionName) text += `\n📂 ${sectionName}`
  text += `\n\n🔗 Leia em: https://leitura-da-biblia.vercel.app/ler/${dayNumber}`
  return text
}

export function getShareNoteText(params: {
  dayNumber: number
  noteContent: string
}): string {
  const { dayNumber, noteContent } = params
  return `📝 Minha anotação — Dia ${dayNumber}\n\n"${noteContent}"\n\n📖 Leitura da Bíblia em 1 Ano`
}

export async function generateProgressImage(params: {
  streak: number
  daysRead: number
  unreadDays: number
  longestStreak: number
  percentage: number
}): Promise<Blob | null> {
  const { streak, daysRead, unreadDays, longestStreak, percentage } = params

  const canvas = document.createElement('canvas')
  canvas.width = 540
  canvas.height = 540
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const bg = '#1a1a2e'
  const accent = '#3b82f6'
  const text = '#f0f0f5'
  const muted = '#94a3b8'

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = accent
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Meu Progresso - Leitura da Bíblia', canvas.width / 2, 50)

  const startY = 110
  const boxH = 70
  const gap = 14
  const cols = 2
  const boxW = (canvas.width - 60 - gap) / cols

  const items = [
    { label: 'Sequência Atual', value: `${streak} dias`, color: '#f97316' },
    { label: 'Dias Lidos', value: `${daysRead}`, color: '#22c55e' },
    { label: 'Não Lidos', value: `${unreadDays}`, color: '#f97316' },
    { label: 'Melhor Sequência', value: `${longestStreak} dias`, color: '#22c55e' },
  ]

  items.forEach((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = 30 + col * (boxW + gap)
    const y = startY + row * (boxH + gap)

    ctx.fillStyle = '#252540'
    ctx.beginPath()
    ctx.roundRect(x, y, boxW, boxH, 12)
    ctx.fill()

    ctx.fillStyle = muted
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(item.label, x + 14, y + 26)

    ctx.fillStyle = item.color
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(item.value, x + 14, y + 58)
  })

  const progY = startY + 2 * (boxH + gap) + 20
  ctx.fillStyle = text
  ctx.font = 'bold 18px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Progresso Geral', canvas.width / 2, progY)

  const barX = 40
  const barW = canvas.width - 80
  const barY = progY + 16
  const barH = 20

  ctx.fillStyle = '#1e3050'
  ctx.beginPath()
  ctx.roundRect(barX, barY, barW, barH, 10)
  ctx.fill()

  const grad = ctx.createLinearGradient(barX, barY, barX + barW * (percentage / 100), barY)
  grad.addColorStop(0, accent)
  grad.addColorStop(1, '#a855f7')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(barX, barY, barW * (percentage / 100), barH, 10)
  ctx.fill()

  ctx.fillStyle = text
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${percentage}%`, canvas.width / 2, barY + barH + 28)

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png')
  })
}
