import type { ReadingDay, Section } from '../types'

export const sections: Section[] = [
  { id: 'moses', name: 'Escritos de Moisés', color: '#d4a853', icon: 'scroll' },
  { id: 'terra-prometida', name: 'Israel Entra na Terra Prometida', color: '#c0842f', icon: 'cookie' },
  { id: 'reis', name: 'Quando os Reis Governavam Israel', color: '#f59e0b', icon: 'crown' },
  { id: 'exilio', name: 'Os Judeus Retornam do Exílio', color: '#dc2626', icon: 'house' },
  { id: 'cantico-sabedoria', name: 'Cânticos e Sabedoria Prática', color: '#ef4444', icon: 'music' },
  { id: 'profetas', name: 'Os Profetas', color: '#22c55e', icon: 'message-square' },
  { id: 'jesus', name: 'Relatos da Vida de Jesus', color: '#3b82f6', icon: 'dove' },
  { id: 'congregacao', name: 'Crescimento da Congregação', color: '#6366f1', icon: 'users' },
  { id: 'cartas-paulo', name: 'As Cartas de Paulo', color: '#a855f7', icon: 'mail' },
  { id: 'outros-apostolos', name: 'Escritos de Outros Apóstolos', color: '#f97316', icon: 'pen-tool' },
  { id: 'tratos-israel', name: '🔸Tratos de Deus com os Israelitas', color: '#f97316', icon: 'scroll' },
  { id: 'congregacao-crista', name: '🔹Desenvolvimento da Congregação Cristã', color: '#3b82f6', icon: 'dove' },
]

const bookSectionMap: Record<number, Section> = {
  1: sections[0], 2: sections[0], 3: sections[0], 4: sections[0], 5: sections[0], 18: sections[0],
  6: sections[1], 7: sections[1], 8: sections[1],
  9: sections[2], 10: sections[2], 11: sections[2], 12: sections[2], 13: sections[2], 14: sections[2],
  15: sections[3], 16: sections[3], 17: sections[3],
  19: sections[4], 20: sections[4], 21: sections[4], 22: sections[4],
  23: sections[5], 24: sections[5], 25: sections[5], 26: sections[5], 27: sections[5],
  28: sections[5], 29: sections[5], 30: sections[5], 31: sections[5], 32: sections[5],
  33: sections[5], 34: sections[5], 35: sections[5], 36: sections[5], 37: sections[5],
  38: sections[5], 39: sections[5],
  40: sections[6], 41: sections[6], 42: sections[6], 43: sections[6],
  44: sections[7],
  45: sections[8], 46: sections[8], 47: sections[8], 48: sections[8], 49: sections[8],
  50: sections[8], 51: sections[8], 52: sections[8], 53: sections[8], 54: sections[8],
  55: sections[8], 56: sections[8], 57: sections[8], 58: sections[8],
  59: sections[9], 60: sections[9], 61: sections[9], 62: sections[9], 63: sections[9],
  64: sections[9], 65: sections[9], 66: sections[9],
}

function sec(bookNum: number): Section {
  return bookSectionMap[bookNum] || sections[0]
}

const O = '🔸' as const
const B = '🔹' as const
const N = '' as const

const _rawPlan: Omit<ReadingDay, 'section'>[] = [
  { day: 1, book: 'Gênesis', bookNum: 1, title: 'Gênesis 1–3', chapters: '1–3', marker: N },
  { day: 2, book: 'Gênesis', bookNum: 1, title: 'Gênesis 4–7', chapters: '4–7', marker: N },
  { day: 3, book: 'Gênesis', bookNum: 1, title: 'Gênesis 8–11', chapters: '8–11', marker: N },
  { day: 4, book: 'Gênesis', bookNum: 1, title: 'Gênesis 12–15', chapters: '12–15', marker: O },
  { day: 5, book: 'Gênesis', bookNum: 1, title: 'Gênesis 16–18', chapters: '16–18', marker: O },
  { day: 6, book: 'Gênesis', bookNum: 1, title: 'Gênesis 19–22', chapters: '19–22', marker: O },
  { day: 7, book: 'Gênesis', bookNum: 1, title: 'Gênesis 23–24', chapters: '23–24', marker: O },
  { day: 8, book: 'Gênesis', bookNum: 1, title: 'Gênesis 25–27', chapters: '25–27', marker: O },
  { day: 9, book: 'Gênesis', bookNum: 1, title: 'Gênesis 28–30', chapters: '28–30', marker: O },
  { day: 10, book: 'Gênesis', bookNum: 1, title: 'Gênesis 31–32', chapters: '31–32', marker: O },
  { day: 11, book: 'Gênesis', bookNum: 1, title: 'Gênesis 33–34', chapters: '33–34', marker: O },
  { day: 12, book: 'Gênesis', bookNum: 1, title: 'Gênesis 35–37', chapters: '35–37', marker: O },
  { day: 13, book: 'Gênesis', bookNum: 1, title: 'Gênesis 38–40', chapters: '38–40', marker: O },
  { day: 14, book: 'Gênesis', bookNum: 1, title: 'Gênesis 41–42', chapters: '41–42', marker: O },
  { day: 15, book: 'Gênesis', bookNum: 1, title: 'Gênesis 43–45', chapters: '43–45', marker: O },
  { day: 16, book: 'Gênesis', bookNum: 1, title: 'Gênesis 46–48', chapters: '46–48', marker: O },
  { day: 17, book: 'Gênesis', bookNum: 1, title: 'Gênesis 49–50', chapters: '49–50', marker: O },
  { day: 18, book: 'Êxodo', bookNum: 2, title: 'Êxodo 1–4', chapters: '1–4', marker: O },
  { day: 19, book: 'Êxodo', bookNum: 2, title: 'Êxodo 5–7', chapters: '5–7', marker: O },
  { day: 20, book: 'Êxodo', bookNum: 2, title: 'Êxodo 8–10', chapters: '8–10', marker: O },
  { day: 21, book: 'Êxodo', bookNum: 2, title: 'Êxodo 11–13', chapters: '11–13', marker: O },
  { day: 22, book: 'Êxodo', bookNum: 2, title: 'Êxodo 14–15', chapters: '14–15', marker: O },
  { day: 23, book: 'Êxodo', bookNum: 2, title: 'Êxodo 16–18', chapters: '16–18', marker: O },
  { day: 24, book: 'Êxodo', bookNum: 2, title: 'Êxodo 19–21', chapters: '19–21', marker: O },
  { day: 25, book: 'Êxodo', bookNum: 2, title: 'Êxodo 22–25', chapters: '22–25', marker: N },
  { day: 26, book: 'Êxodo', bookNum: 2, title: 'Êxodo 26–28', chapters: '26–28', marker: N },
  { day: 27, book: 'Êxodo', bookNum: 2, title: 'Êxodo 29–30', chapters: '29–30', marker: N },
  { day: 28, book: 'Êxodo', bookNum: 2, title: 'Êxodo 31–33', chapters: '31–33', marker: O },
  { day: 29, book: 'Êxodo', bookNum: 2, title: 'Êxodo 34–35', chapters: '34–35', marker: O },
  { day: 30, book: 'Êxodo', bookNum: 2, title: 'Êxodo 36–38', chapters: '36–38', marker: N },
  { day: 31, book: 'Êxodo', bookNum: 2, title: 'Êxodo 39–40', chapters: '39–40', marker: N },
  { day: 32, book: 'Levítico', bookNum: 3, title: 'Levítico 1–4', chapters: '1–4', marker: N },
  { day: 33, book: 'Levítico', bookNum: 3, title: 'Levítico 5–7', chapters: '5–7', marker: N },
  { day: 34, book: 'Levítico', bookNum: 3, title: 'Levítico 8–10', chapters: '8–10', marker: N },
  { day: 35, book: 'Levítico', bookNum: 3, title: 'Levítico 11–13', chapters: '11–13', marker: N },
  { day: 36, book: 'Levítico', bookNum: 3, title: 'Levítico 14–15', chapters: '14–15', marker: N },
  { day: 37, book: 'Levítico', bookNum: 3, title: 'Levítico 16–18', chapters: '16–18', marker: N },
  { day: 38, book: 'Levítico', bookNum: 3, title: 'Levítico 19–21', chapters: '19–21', marker: N },
  { day: 39, book: 'Levítico', bookNum: 3, title: 'Levítico 22–23', chapters: '22–23', marker: N },
  { day: 40, book: 'Levítico', bookNum: 3, title: 'Levítico 24–25', chapters: '24–25', marker: N },
  { day: 41, book: 'Levítico', bookNum: 3, title: 'Levítico 26–27', chapters: '26–27', marker: N },
  { day: 42, book: 'Números', bookNum: 4, title: 'Números 1–3', chapters: '1–3', marker: N },
  { day: 43, book: 'Números', bookNum: 4, title: 'Números 4–6', chapters: '4–6', marker: N },
  { day: 44, book: 'Números', bookNum: 4, title: 'Números 7–9', chapters: '7–9', marker: N },
  { day: 45, book: 'Números', bookNum: 4, title: 'Números 10–12', chapters: '10–12', marker: O },
  { day: 46, book: 'Números', bookNum: 4, title: 'Números 13–15', chapters: '13–15', marker: O },
  { day: 47, book: 'Números', bookNum: 4, title: 'Números 16–18', chapters: '16–18', marker: O },
  { day: 48, book: 'Números', bookNum: 4, title: 'Números 19–21', chapters: '19–21', marker: O },
  { day: 49, book: 'Números', bookNum: 4, title: 'Números 22–24', chapters: '22–24', marker: O },
  { day: 50, book: 'Números', bookNum: 4, title: 'Números 25–27', chapters: '25–27', marker: O },
  { day: 51, book: 'Números', bookNum: 4, title: 'Números 28–30', chapters: '28–30', marker: N },
  { day: 52, book: 'Números', bookNum: 4, title: 'Números 31–32', chapters: '31–32', marker: O },
  { day: 53, book: 'Números', bookNum: 4, title: 'Números 33–36', chapters: '33–36', marker: O },
  { day: 54, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 1–2', chapters: '1–2', marker: N },
  { day: 55, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 3–4', chapters: '3–4', marker: O },
  { day: 56, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 5–7', chapters: '5–7', marker: N },
  { day: 57, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 8–10', chapters: '8–10', marker: N },
  { day: 58, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 11–13', chapters: '11–13', marker: N },
  { day: 59, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 14–16', chapters: '14–16', marker: N },
  { day: 60, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 17–19', chapters: '17–19', marker: O },
  { day: 61, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 20–22', chapters: '20–22', marker: N },
  { day: 62, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 23–26', chapters: '23–26', marker: N },
  { day: 63, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 27–28', chapters: '27–28', marker: N },
  { day: 64, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 29–31', chapters: '29–31', marker: O },
  { day: 65, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 32', chapters: '32', marker: O },
  { day: 66, book: 'Deuteronômio', bookNum: 5, title: 'Deuteronômio 33–34', chapters: '33–34', marker: O },
  { day: 67, book: 'Josué', bookNum: 6, title: 'Josué 1–4', chapters: '1–4', marker: O },
  { day: 68, book: 'Josué', bookNum: 6, title: 'Josué 5–7', chapters: '5–7', marker: O },
  { day: 69, book: 'Josué', bookNum: 6, title: 'Josué 8–9', chapters: '8–9', marker: O },
  { day: 70, book: 'Josué', bookNum: 6, title: 'Josué 10–12', chapters: '10–12', marker: O },
  { day: 71, book: 'Josué', bookNum: 6, title: 'Josué 13–15', chapters: '13–15', marker: O },
  { day: 72, book: 'Josué', bookNum: 6, title: 'Josué 16–18', chapters: '16–18', marker: O },
  { day: 73, book: 'Josué', bookNum: 6, title: 'Josué 19–21', chapters: '19–21', marker: O },
  { day: 74, book: 'Josué', bookNum: 6, title: 'Josué 22–24', chapters: '22–24', marker: O },
  { day: 75, book: 'Juízes', bookNum: 7, title: 'Juízes 1–2', chapters: '1–2', marker: O },
  { day: 76, book: 'Juízes', bookNum: 7, title: 'Juízes 3–5', chapters: '3–5', marker: O },
  { day: 77, book: 'Juízes', bookNum: 7, title: 'Juízes 6–7', chapters: '6–7', marker: O },
  { day: 78, book: 'Juízes', bookNum: 7, title: 'Juízes 8–9', chapters: '8–9', marker: O },
  { day: 79, book: 'Juízes', bookNum: 7, title: 'Juízes 10–11', chapters: '10–11', marker: O },
  { day: 80, book: 'Juízes', bookNum: 7, title: 'Juízes 12–13', chapters: '12–13', marker: O },
  { day: 81, book: 'Juízes', bookNum: 7, title: 'Juízes 14–16', chapters: '14–16', marker: O },
  { day: 82, book: 'Juízes', bookNum: 7, title: 'Juízes 17–19', chapters: '17–19', marker: O },
  { day: 83, book: 'Juízes', bookNum: 7, title: 'Juízes 20–21', chapters: '20–21', marker: O },
  { day: 84, book: 'Rute', bookNum: 8, title: 'Rute 1–4', chapters: '1–4', marker: O },
  { day: 85, book: '1 Samuel', bookNum: 9, title: '1 Samuel 1–2', chapters: '1–2', marker: O },
  { day: 86, book: '1 Samuel', bookNum: 9, title: '1 Samuel 3–6', chapters: '3–6', marker: O },
  { day: 87, book: '1 Samuel', bookNum: 9, title: '1 Samuel 7–9', chapters: '7–9', marker: O },
  { day: 88, book: '1 Samuel', bookNum: 9, title: '1 Samuel 10–12', chapters: '10–12', marker: O },
  { day: 89, book: '1 Samuel', bookNum: 9, title: '1 Samuel 13–14', chapters: '13–14', marker: O },
  { day: 90, book: '1 Samuel', bookNum: 9, title: '1 Samuel 15–16', chapters: '15–16', marker: O },
  { day: 91, book: '1 Samuel', bookNum: 9, title: '1 Samuel 17–18', chapters: '17–18', marker: O },
  { day: 92, book: '1 Samuel', bookNum: 9, title: '1 Samuel 19–21', chapters: '19–21', marker: O },
  { day: 93, book: '1 Samuel', bookNum: 9, title: '1 Samuel 22–24', chapters: '22–24', marker: O },
  { day: 94, book: '1 Samuel', bookNum: 9, title: '1 Samuel 25–27', chapters: '25–27', marker: O },
  { day: 95, book: '1 Samuel', bookNum: 9, title: '1 Samuel 28–31', chapters: '28–31', marker: O },
  { day: 96, book: '2 Samuel', bookNum: 10, title: '2 Samuel 1–2', chapters: '1–2', marker: O },
  { day: 97, book: '2 Samuel', bookNum: 10, title: '2 Samuel 3–5', chapters: '3–5', marker: O },
  { day: 98, book: '2 Samuel', bookNum: 10, title: '2 Samuel 6–8', chapters: '6–8', marker: O },
  { day: 99, book: '2 Samuel', bookNum: 10, title: '2 Samuel 9–12', chapters: '9–12', marker: O },
  { day: 100, book: '2 Samuel', bookNum: 10, title: '2 Samuel 13–14', chapters: '13–14', marker: O },
  { day: 101, book: '2 Samuel', bookNum: 10, title: '2 Samuel 15–16', chapters: '15–16', marker: O },
  { day: 102, book: '2 Samuel', bookNum: 10, title: '2 Samuel 17–18', chapters: '17–18', marker: O },
  { day: 103, book: '2 Samuel', bookNum: 10, title: '2 Samuel 19–20', chapters: '19–20', marker: O },
  { day: 104, book: '2 Samuel', bookNum: 10, title: '2 Samuel 21–22', chapters: '21–22', marker: O },
  { day: 105, book: '2 Samuel', bookNum: 10, title: '2 Samuel 23–24', chapters: '23–24', marker: O },
  { day: 106, book: '1 Reis', bookNum: 11, title: '1 Reis 1–2', chapters: '1–2', marker: O },
  { day: 107, book: '1 Reis', bookNum: 11, title: '1 Reis 3–5', chapters: '3–5', marker: O },
  { day: 108, book: '1 Reis', bookNum: 11, title: '1 Reis 6–7', chapters: '6–7', marker: O },
  { day: 109, book: '1 Reis', bookNum: 11, title: '1 Reis 8', chapters: '8', marker: O },
  { day: 110, book: '1 Reis', bookNum: 11, title: '1 Reis 9–10', chapters: '9–10', marker: O },
  { day: 111, book: '1 Reis', bookNum: 11, title: '1 Reis 11–12', chapters: '11–12', marker: O },
  { day: 112, book: '1 Reis', bookNum: 11, title: '1 Reis 13–14', chapters: '13–14', marker: O },
  { day: 113, book: '1 Reis', bookNum: 11, title: '1 Reis 15–17', chapters: '15–17', marker: O },
  { day: 114, book: '1 Reis', bookNum: 11, title: '1 Reis 18–19', chapters: '18–19', marker: O },
  { day: 115, book: '1 Reis', bookNum: 11, title: '1 Reis 20–21', chapters: '20–21', marker: O },
  { day: 116, book: '1 Reis', bookNum: 11, title: '1 Reis 22', chapters: '22', marker: O },
  { day: 117, book: '2 Reis', bookNum: 12, title: '2 Reis 1–3', chapters: '1–3', marker: O },
  { day: 118, book: '2 Reis', bookNum: 12, title: '2 Reis 4–5', chapters: '4–5', marker: O },
  { day: 119, book: '2 Reis', bookNum: 12, title: '2 Reis 6–8', chapters: '6–8', marker: O },
  { day: 120, book: '2 Reis', bookNum: 12, title: '2 Reis 9–10', chapters: '9–10', marker: O },
  { day: 121, book: '2 Reis', bookNum: 12, title: '2 Reis 11–13', chapters: '11–13', marker: O },
  { day: 122, book: '2 Reis', bookNum: 12, title: '2 Reis 14–15', chapters: '14–15', marker: O },
  { day: 123, book: '2 Reis', bookNum: 12, title: '2 Reis 16–17', chapters: '16–17', marker: O },
  { day: 124, book: '2 Reis', bookNum: 12, title: '2 Reis 18–19', chapters: '18–19', marker: O },
  { day: 125, book: '2 Reis', bookNum: 12, title: '2 Reis 20–22', chapters: '20–22', marker: O },
  { day: 126, book: '2 Reis', bookNum: 12, title: '2 Reis 23–25', chapters: '23–25', marker: O },
  { day: 127, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 1–2', chapters: '1–2', marker: N },
  { day: 128, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 3–5', chapters: '3–5', marker: N },
  { day: 129, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 6–7', chapters: '6–7', marker: N },
  { day: 130, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 8–10', chapters: '8–10', marker: N },
  { day: 131, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 11–12', chapters: '11–12', marker: N },
  { day: 132, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 13–15', chapters: '13–15', marker: N },
  { day: 133, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 16–17', chapters: '16–17', marker: N },
  { day: 134, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 18–20', chapters: '18–20', marker: N },
  { day: 135, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 21–23', chapters: '21–23', marker: N },
  { day: 136, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 24–26', chapters: '24–26', marker: N },
  { day: 137, book: '1 Crônicas', bookNum: 13, title: '1 Crônicas 27–29', chapters: '27–29', marker: N },
  { day: 138, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 1–3', chapters: '1–3', marker: N },
  { day: 139, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 4–6', chapters: '4–6', marker: N },
  { day: 140, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 7–9', chapters: '7–9', marker: N },
  { day: 141, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 10–14', chapters: '10–14', marker: N },
  { day: 142, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 15–18', chapters: '15–18', marker: N },
  { day: 143, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 19–22', chapters: '19–22', marker: N },
  { day: 144, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 23–25', chapters: '23–25', marker: N },
  { day: 145, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 26–28', chapters: '26–28', marker: N },
  { day: 146, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 29–30', chapters: '29–30', marker: N },
  { day: 147, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 31–33', chapters: '31–33', marker: N },
  { day: 148, book: '2 Crônicas', bookNum: 14, title: '2 Crônicas 34–36', chapters: '34–36', marker: N },
  { day: 149, book: 'Esdras', bookNum: 15, title: 'Esdras 1–3', chapters: '1–3', marker: O },
  { day: 150, book: 'Esdras', bookNum: 15, title: 'Esdras 4–7', chapters: '4–7', marker: O },
  { day: 151, book: 'Esdras', bookNum: 15, title: 'Esdras 8–10', chapters: '8–10', marker: O },
  { day: 152, book: 'Neemias', bookNum: 16, title: 'Neemias 1–3', chapters: '1–3', marker: O },
  { day: 153, book: 'Neemias', bookNum: 16, title: 'Neemias 4–6', chapters: '4–6', marker: O },
  { day: 154, book: 'Neemias', bookNum: 16, title: 'Neemias 7–8', chapters: '7–8', marker: O },
  { day: 155, book: 'Neemias', bookNum: 16, title: 'Neemias 9–10', chapters: '9–10', marker: O },
  { day: 156, book: 'Neemias', bookNum: 16, title: 'Neemias 11–13', chapters: '11–13', marker: O },
  { day: 157, book: 'Ester', bookNum: 17, title: 'Ester 1–4', chapters: '1–4', marker: O },
  { day: 158, book: 'Ester', bookNum: 17, title: 'Ester 5–10', chapters: '5–10', marker: O },
  { day: 159, book: 'Jó', bookNum: 18, title: 'Jó 1–5', chapters: '1–5', marker: N },
  { day: 160, book: 'Jó', bookNum: 18, title: 'Jó 6–9', chapters: '6–9', marker: N },
  { day: 161, book: 'Jó', bookNum: 18, title: 'Jó 10–14', chapters: '10–14', marker: N },
  { day: 162, book: 'Jó', bookNum: 18, title: 'Jó 15–18', chapters: '15–18', marker: N },
  { day: 163, book: 'Jó', bookNum: 18, title: 'Jó 19–20', chapters: '19–20', marker: N },
  { day: 164, book: 'Jó', bookNum: 18, title: 'Jó 21–24', chapters: '21–24', marker: N },
  { day: 165, book: 'Jó', bookNum: 18, title: 'Jó 25–29', chapters: '25–29', marker: N },
  { day: 166, book: 'Jó', bookNum: 18, title: 'Jó 30–31', chapters: '30–31', marker: N },
  { day: 167, book: 'Jó', bookNum: 18, title: 'Jó 32–34', chapters: '32–34', marker: N },
  { day: 168, book: 'Jó', bookNum: 18, title: 'Jó 35–38', chapters: '35–38', marker: N },
  { day: 169, book: 'Jó', bookNum: 18, title: 'Jó 39–42', chapters: '39–42', marker: N },
  { day: 170, book: 'Salmos', bookNum: 19, title: 'Salmos 1–8', chapters: '1–8', marker: N },
  { day: 171, book: 'Salmos', bookNum: 19, title: 'Salmos 9–16', chapters: '9–16', marker: N },
  { day: 172, book: 'Salmos', bookNum: 19, title: 'Salmos 17–19', chapters: '17–19', marker: N },
  { day: 173, book: 'Salmos', bookNum: 19, title: 'Salmos 20–25', chapters: '20–25', marker: N },
  { day: 174, book: 'Salmos', bookNum: 19, title: 'Salmos 26–31', chapters: '26–31', marker: N },
  { day: 175, book: 'Salmos', bookNum: 19, title: 'Salmos 32–35', chapters: '32–35', marker: N },
  { day: 176, book: 'Salmos', bookNum: 19, title: 'Salmos 36–38', chapters: '36–38', marker: N },
  { day: 177, book: 'Salmos', bookNum: 19, title: 'Salmos 39–42', chapters: '39–42', marker: N },
  { day: 178, book: 'Salmos', bookNum: 19, title: 'Salmos 43–47', chapters: '43–47', marker: N },
  { day: 179, book: 'Salmos', bookNum: 19, title: 'Salmos 48–52', chapters: '48–52', marker: N },
  { day: 180, book: 'Salmos', bookNum: 19, title: 'Salmos 53–58', chapters: '53–58', marker: N },
  { day: 181, book: 'Salmos', bookNum: 19, title: 'Salmos 59–64', chapters: '59–64', marker: N },
  { day: 182, book: 'Salmos', bookNum: 19, title: 'Salmos 65–68', chapters: '65–68', marker: N },
  { day: 183, book: 'Salmos', bookNum: 19, title: 'Salmos 69–72', chapters: '69–72', marker: N },
  { day: 184, book: 'Salmos', bookNum: 19, title: 'Salmos 73–77', chapters: '73–77', marker: N },
  { day: 185, book: 'Salmos', bookNum: 19, title: 'Salmos 78–79', chapters: '78–79', marker: N },
  { day: 186, book: 'Salmos', bookNum: 19, title: 'Salmos 80–86', chapters: '80–86', marker: N },
  { day: 187, book: 'Salmos', bookNum: 19, title: 'Salmos 87–90', chapters: '87–90', marker: N },
  { day: 188, book: 'Salmos', bookNum: 19, title: 'Salmos 91–96', chapters: '91–96', marker: N },
  { day: 189, book: 'Salmos', bookNum: 19, title: 'Salmos 97–103', chapters: '97–103', marker: N },
  { day: 190, book: 'Salmos', bookNum: 19, title: 'Salmos 104–105', chapters: '104–105', marker: N },
  { day: 191, book: 'Salmos', bookNum: 19, title: 'Salmos 106–108', chapters: '106–108', marker: N },
  { day: 192, book: 'Salmos', bookNum: 19, title: 'Salmos 109–115', chapters: '109–115', marker: N },
  { day: 193, book: 'Salmos', bookNum: 19, title: 'Salmos 116–119:63', chapters: '116–119:63', marker: N },
  { day: 194, book: 'Salmos', bookNum: 19, title: 'Salmos 119:64–176', chapters: '119:64–176', marker: N },
  { day: 195, book: 'Salmos', bookNum: 19, title: 'Salmos 120–129', chapters: '120–129', marker: N },
  { day: 196, book: 'Salmos', bookNum: 19, title: 'Salmos 130–138', chapters: '130–138', marker: N },
  { day: 197, book: 'Salmos', bookNum: 19, title: 'Salmos 139–144', chapters: '139–144', marker: N },
  { day: 198, book: 'Salmos', bookNum: 19, title: 'Salmos 145–150', chapters: '145–150', marker: N },
  { day: 199, book: 'Provérbios', bookNum: 20, title: 'Provérbios 1–4', chapters: '1–4', marker: N },
  { day: 200, book: 'Provérbios', bookNum: 20, title: 'Provérbios 5–8', chapters: '5–8', marker: N },
  { day: 201, book: 'Provérbios', bookNum: 20, title: 'Provérbios 9–12', chapters: '9–12', marker: N },
  { day: 202, book: 'Provérbios', bookNum: 20, title: 'Provérbios 13–16', chapters: '13–16', marker: N },
  { day: 203, book: 'Provérbios', bookNum: 20, title: 'Provérbios 17–19', chapters: '17–19', marker: N },
  { day: 204, book: 'Provérbios', bookNum: 20, title: 'Provérbios 20–22', chapters: '20–22', marker: N },
  { day: 205, book: 'Provérbios', bookNum: 20, title: 'Provérbios 23–27', chapters: '23–27', marker: N },
  { day: 206, book: 'Provérbios', bookNum: 20, title: 'Provérbios 28–31', chapters: '28–31', marker: N },
  { day: 207, book: 'Eclesiastes', bookNum: 21, title: 'Eclesiastes 1–4', chapters: '1–4', marker: N },
  { day: 208, book: 'Eclesiastes', bookNum: 21, title: 'Eclesiastes 5–8', chapters: '5–8', marker: N },
  { day: 209, book: 'Eclesiastes', bookNum: 21, title: 'Eclesiastes 9–12', chapters: '9–12', marker: N },
  { day: 210, book: 'Cântico de Salomão', bookNum: 22, title: 'Cântico de Salomão 1–8', chapters: '1–8', marker: N },
  { day: 211, book: 'Isaías', bookNum: 23, title: 'Isaías 1–4', chapters: '1–4', marker: N },
  { day: 212, book: 'Isaías', bookNum: 23, title: 'Isaías 5–7', chapters: '5–7', marker: N },
  { day: 213, book: 'Isaías', bookNum: 23, title: 'Isaías 8–10', chapters: '8–10', marker: N },
  { day: 214, book: 'Isaías', bookNum: 23, title: 'Isaías 11–14', chapters: '11–14', marker: N },
  { day: 215, book: 'Isaías', bookNum: 23, title: 'Isaías 15–19', chapters: '15–19', marker: N },
  { day: 216, book: 'Isaías', bookNum: 23, title: 'Isaías 20–24', chapters: '20–24', marker: N },
  { day: 217, book: 'Isaías', bookNum: 23, title: 'Isaías 25–28', chapters: '25–28', marker: N },
  { day: 218, book: 'Isaías', bookNum: 23, title: 'Isaías 29–31', chapters: '29–31', marker: N },
  { day: 219, book: 'Isaías', bookNum: 23, title: 'Isaías 32–35', chapters: '32–35', marker: N },
  { day: 220, book: 'Isaías', bookNum: 23, title: 'Isaías 36–37', chapters: '36–37', marker: N },
  { day: 221, book: 'Isaías', bookNum: 23, title: 'Isaías 38–40', chapters: '38–40', marker: N },
  { day: 222, book: 'Isaías', bookNum: 23, title: 'Isaías 41–43', chapters: '41–43', marker: N },
  { day: 223, book: 'Isaías', bookNum: 23, title: 'Isaías 44–47', chapters: '44–47', marker: N },
  { day: 224, book: 'Isaías', bookNum: 23, title: 'Isaías 48–50', chapters: '48–50', marker: N },
  { day: 225, book: 'Isaías', bookNum: 23, title: 'Isaías 51–55', chapters: '51–55', marker: N },
  { day: 226, book: 'Isaías', bookNum: 23, title: 'Isaías 56–58', chapters: '56–58', marker: N },
  { day: 227, book: 'Isaías', bookNum: 23, title: 'Isaías 59–62', chapters: '59–62', marker: N },
  { day: 228, book: 'Isaías', bookNum: 23, title: 'Isaías 63–66', chapters: '63–66', marker: N },
  { day: 229, book: 'Jeremias', bookNum: 24, title: 'Jeremias 1–3', chapters: '1–3', marker: N },
  { day: 230, book: 'Jeremias', bookNum: 24, title: 'Jeremias 4–5', chapters: '4–5', marker: N },
  { day: 231, book: 'Jeremias', bookNum: 24, title: 'Jeremias 6–7', chapters: '6–7', marker: N },
  { day: 232, book: 'Jeremias', bookNum: 24, title: 'Jeremias 8–10', chapters: '8–10', marker: N },
  { day: 233, book: 'Jeremias', bookNum: 24, title: 'Jeremias 11–13', chapters: '11–13', marker: N },
  { day: 234, book: 'Jeremias', bookNum: 24, title: 'Jeremias 14–16', chapters: '14–16', marker: N },
  { day: 235, book: 'Jeremias', bookNum: 24, title: 'Jeremias 17–20', chapters: '17–20', marker: N },
  { day: 236, book: 'Jeremias', bookNum: 24, title: 'Jeremias 21–23', chapters: '21–23', marker: N },
  { day: 237, book: 'Jeremias', bookNum: 24, title: 'Jeremias 24–26', chapters: '24–26', marker: N },
  { day: 238, book: 'Jeremias', bookNum: 24, title: 'Jeremias 27–29', chapters: '27–29', marker: N },
  { day: 239, book: 'Jeremias', bookNum: 24, title: 'Jeremias 30–31', chapters: '30–31', marker: N },
  { day: 240, book: 'Jeremias', bookNum: 24, title: 'Jeremias 32–33', chapters: '32–33', marker: N },
  { day: 241, book: 'Jeremias', bookNum: 24, title: 'Jeremias 34–36', chapters: '34–36', marker: N },
  { day: 242, book: 'Jeremias', bookNum: 24, title: 'Jeremias 37–39', chapters: '37–39', marker: N },
  { day: 243, book: 'Jeremias', bookNum: 24, title: 'Jeremias 40–42', chapters: '40–42', marker: N },
  { day: 244, book: 'Jeremias', bookNum: 24, title: 'Jeremias 43–44', chapters: '43–44', marker: N },
  { day: 245, book: 'Jeremias', bookNum: 24, title: 'Jeremias 45–48', chapters: '45–48', marker: N },
  { day: 246, book: 'Jeremias', bookNum: 24, title: 'Jeremias 49–50', chapters: '49–50', marker: N },
  { day: 247, book: 'Jeremias', bookNum: 24, title: 'Jeremias 51–52', chapters: '51–52', marker: N },
  { day: 248, book: 'Lamentações', bookNum: 25, title: 'Lamentações 1–2', chapters: '1–2', marker: N },
  { day: 249, book: 'Lamentações', bookNum: 25, title: 'Lamentações 3–5', chapters: '3–5', marker: N },
  { day: 250, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 1–3', chapters: '1–3', marker: N },
  { day: 251, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 4–6', chapters: '4–6', marker: N },
  { day: 252, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 7–9', chapters: '7–9', marker: N },
  { day: 253, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 10–12', chapters: '10–12', marker: N },
  { day: 254, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 13–15', chapters: '13–15', marker: N },
  { day: 255, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 16', chapters: '16', marker: N },
  { day: 256, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 17–18', chapters: '17–18', marker: N },
  { day: 257, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 19–21', chapters: '19–21', marker: N },
  { day: 258, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 22–23', chapters: '22–23', marker: N },
  { day: 259, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 24–26', chapters: '24–26', marker: N },
  { day: 260, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 27–28', chapters: '27–28', marker: N },
  { day: 261, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 29–31', chapters: '29–31', marker: N },
  { day: 262, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 32–33', chapters: '32–33', marker: N },
  { day: 263, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 34–36', chapters: '34–36', marker: N },
  { day: 264, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 37–38', chapters: '37–38', marker: N },
  { day: 265, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 39–40', chapters: '39–40', marker: N },
  { day: 266, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 41–43', chapters: '41–43', marker: N },
  { day: 267, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 44–45', chapters: '44–45', marker: N },
  { day: 268, book: 'Ezequiel', bookNum: 26, title: 'Ezequiel 46–48', chapters: '46–48', marker: N },
  { day: 269, book: 'Daniel', bookNum: 27, title: 'Daniel 1–2', chapters: '1–2', marker: N },
  { day: 270, book: 'Daniel', bookNum: 27, title: 'Daniel 3–4', chapters: '3–4', marker: N },
  { day: 271, book: 'Daniel', bookNum: 27, title: 'Daniel 5–7', chapters: '5–7', marker: N },
  { day: 272, book: 'Daniel', bookNum: 27, title: 'Daniel 8–10', chapters: '8–10', marker: N },
  { day: 273, book: 'Daniel', bookNum: 27, title: 'Daniel 11–12', chapters: '11–12', marker: N },
  { day: 274, book: 'Oseias', bookNum: 28, title: 'Oseias 1–7', chapters: '1–7', marker: N },
  { day: 275, book: 'Oseias', bookNum: 28, title: 'Oseias 8–14', chapters: '8–14', marker: N },
  { day: 276, book: 'Joel', bookNum: 29, title: 'Joel 1–3', chapters: '1–3', marker: N },
  { day: 277, book: 'Amós', bookNum: 30, title: 'Amós 1–5', chapters: '1–5', marker: N },
  { day: 278, book: 'Amós', bookNum: 30, title: 'Amós 6–9', chapters: '6–9', marker: N },
  { day: 279, book: 'Obadias', bookNum: 31, title: 'Obadias', chapters: '1', marker: N },
  { day: 279, book: 'Jonas', bookNum: 32, title: 'Jonas 1–4', chapters: '1–4', marker: N },
  { day: 280, book: 'Miqueias', bookNum: 33, title: 'Miqueias 1–7', chapters: '1–7', marker: N },
  { day: 281, book: 'Naum', bookNum: 34, title: 'Naum 1–3', chapters: '1–3', marker: N },
  { day: 281, book: 'Habacuque', bookNum: 35, title: 'Habacuque 1–3', chapters: '1–3', marker: N },
  { day: 282, book: 'Sofonias', bookNum: 36, title: 'Sofonias 1–3', chapters: '1–3', marker: N },
  { day: 282, book: 'Ageu', bookNum: 37, title: 'Ageu 1–2', chapters: '1–2', marker: N },
  { day: 283, book: 'Zacarias', bookNum: 38, title: 'Zacarias 1–7', chapters: '1–7', marker: N },
  { day: 284, book: 'Zacarias', bookNum: 38, title: 'Zacarias 8–11', chapters: '8–11', marker: N },
  { day: 285, book: 'Zacarias', bookNum: 38, title: 'Zacarias 12–14', chapters: '12–14', marker: N },
  { day: 286, book: 'Malaquias', bookNum: 39, title: 'Malaquias 1–4', chapters: '1–4', marker: N },
  { day: 287, book: 'Mateus', bookNum: 40, title: 'Mateus 1–4', chapters: '1–4', marker: N },
  { day: 288, book: 'Mateus', bookNum: 40, title: 'Mateus 5–7', chapters: '5–7', marker: N },
  { day: 289, book: 'Mateus', bookNum: 40, title: 'Mateus 8–10', chapters: '8–10', marker: N },
  { day: 290, book: 'Mateus', bookNum: 40, title: 'Mateus 11–13', chapters: '11–13', marker: N },
  { day: 291, book: 'Mateus', bookNum: 40, title: 'Mateus 14–17', chapters: '14–17', marker: N },
  { day: 292, book: 'Mateus', bookNum: 40, title: 'Mateus 18–20', chapters: '18–20', marker: N },
  { day: 293, book: 'Mateus', bookNum: 40, title: 'Mateus 21–23', chapters: '21–23', marker: N },
  { day: 294, book: 'Mateus', bookNum: 40, title: 'Mateus 24–25', chapters: '24–25', marker: N },
  { day: 295, book: 'Mateus', bookNum: 40, title: 'Mateus 26', chapters: '26', marker: N },
  { day: 296, book: 'Mateus', bookNum: 40, title: 'Mateus 27–28', chapters: '27–28', marker: N },
  { day: 297, book: 'Marcos', bookNum: 41, title: 'Marcos 1–3', chapters: '1–3', marker: N },
  { day: 298, book: 'Marcos', bookNum: 41, title: 'Marcos 4–5', chapters: '4–5', marker: N },
  { day: 299, book: 'Marcos', bookNum: 41, title: 'Marcos 6–8', chapters: '6–8', marker: N },
  { day: 300, book: 'Marcos', bookNum: 41, title: 'Marcos 9–10', chapters: '9–10', marker: N },
  { day: 301, book: 'Marcos', bookNum: 41, title: 'Marcos 11–13', chapters: '11–13', marker: N },
  { day: 302, book: 'Marcos', bookNum: 41, title: 'Marcos 14–16', chapters: '14–16', marker: N },
  { day: 303, book: 'Lucas', bookNum: 42, title: 'Lucas 1–2', chapters: '1–2', marker: N },
  { day: 304, book: 'Lucas', bookNum: 42, title: 'Lucas 3–5', chapters: '3–5', marker: N },
  { day: 305, book: 'Lucas', bookNum: 42, title: 'Lucas 6–7', chapters: '6–7', marker: N },
  { day: 306, book: 'Lucas', bookNum: 42, title: 'Lucas 8–9', chapters: '8–9', marker: N },
  { day: 307, book: 'Lucas', bookNum: 42, title: 'Lucas 10–11', chapters: '10–11', marker: N },
  { day: 308, book: 'Lucas', bookNum: 42, title: 'Lucas 12–13', chapters: '12–13', marker: N },
  { day: 309, book: 'Lucas', bookNum: 42, title: 'Lucas 14–17', chapters: '14–17', marker: N },
  { day: 310, book: 'Lucas', bookNum: 42, title: 'Lucas 18–19', chapters: '18–19', marker: N },
  { day: 311, book: 'Lucas', bookNum: 42, title: 'Lucas 20–22', chapters: '20–22', marker: N },
  { day: 312, book: 'Lucas', bookNum: 42, title: 'Lucas 23–24', chapters: '23–24', marker: N },
  { day: 313, book: 'João', bookNum: 43, title: 'João 1–3', chapters: '1–3', marker: N },
  { day: 314, book: 'João', bookNum: 43, title: 'João 4–5', chapters: '4–5', marker: N },
  { day: 315, book: 'João', bookNum: 43, title: 'João 6–7', chapters: '6–7', marker: N },
  { day: 316, book: 'João', bookNum: 43, title: 'João 8–9', chapters: '8–9', marker: N },
  { day: 317, book: 'João', bookNum: 43, title: 'João 10–12', chapters: '10–12', marker: N },
  { day: 318, book: 'João', bookNum: 43, title: 'João 13–15', chapters: '13–15', marker: N },
  { day: 319, book: 'João', bookNum: 43, title: 'João 16–18', chapters: '16–18', marker: N },
  { day: 320, book: 'João', bookNum: 43, title: 'João 19–21', chapters: '19–21', marker: N },
  { day: 321, book: 'Atos', bookNum: 44, title: 'Atos 1–3', chapters: '1–3', marker: B },
  { day: 322, book: 'Atos', bookNum: 44, title: 'Atos 4–6', chapters: '4–6', marker: B },
  { day: 323, book: 'Atos', bookNum: 44, title: 'Atos 7–8', chapters: '7–8', marker: B },
  { day: 324, book: 'Atos', bookNum: 44, title: 'Atos 9–11', chapters: '9–11', marker: B },
  { day: 325, book: 'Atos', bookNum: 44, title: 'Atos 12–14', chapters: '12–14', marker: B },
  { day: 326, book: 'Atos', bookNum: 44, title: 'Atos 15–16', chapters: '15–16', marker: B },
  { day: 327, book: 'Atos', bookNum: 44, title: 'Atos 17–19', chapters: '17–19', marker: B },
  { day: 328, book: 'Atos', bookNum: 44, title: 'Atos 20–21', chapters: '20–21', marker: B },
  { day: 329, book: 'Atos', bookNum: 44, title: 'Atos 22–23', chapters: '22–23', marker: B },
  { day: 330, book: 'Atos', bookNum: 44, title: 'Atos 24–26', chapters: '24–26', marker: B },
  { day: 331, book: 'Atos', bookNum: 44, title: 'Atos 27–28', chapters: '27–28', marker: B },
  { day: 332, book: 'Romanos', bookNum: 45, title: 'Romanos 1–3', chapters: '1–3', marker: N },
  { day: 333, book: 'Romanos', bookNum: 45, title: 'Romanos 4–7', chapters: '4–7', marker: N },
  { day: 334, book: 'Romanos', bookNum: 45, title: 'Romanos 8–11', chapters: '8–11', marker: N },
  { day: 335, book: 'Romanos', bookNum: 45, title: 'Romanos 12–16', chapters: '12–16', marker: N },
  { day: 336, book: '1 Coríntios', bookNum: 46, title: '1 Coríntios 1–6', chapters: '1–6', marker: N },
  { day: 337, book: '1 Coríntios', bookNum: 46, title: '1 Coríntios 7–10', chapters: '7–10', marker: N },
  { day: 338, book: '1 Coríntios', bookNum: 46, title: '1 Coríntios 11–14', chapters: '11–14', marker: N },
  { day: 339, book: '1 Coríntios', bookNum: 46, title: '1 Coríntios 15–16', chapters: '15–16', marker: N },
  { day: 340, book: '2 Coríntios', bookNum: 47, title: '2 Coríntios 1–6', chapters: '1–6', marker: N },
  { day: 341, book: '2 Coríntios', bookNum: 47, title: '2 Coríntios 7–10', chapters: '7–10', marker: N },
  { day: 342, book: '2 Coríntios', bookNum: 47, title: '2 Coríntios 11–13', chapters: '11–13', marker: N },
  { day: 343, book: 'Gálatas', bookNum: 48, title: 'Gálatas 1–6', chapters: '1–6', marker: N },
  { day: 344, book: 'Efésios', bookNum: 49, title: 'Efésios 1–6', chapters: '1–6', marker: N },
  { day: 345, book: 'Filipenses', bookNum: 50, title: 'Filipenses 1–4', chapters: '1–4', marker: N },
  { day: 346, book: 'Colossenses', bookNum: 51, title: 'Colossenses 1–4', chapters: '1–4', marker: N },
  { day: 347, book: '1 Tessalonicenses', bookNum: 52, title: '1 Tessalonicenses 1–5', chapters: '1–5', marker: N },
  { day: 348, book: '2 Tessalonicenses', bookNum: 53, title: '2 Tessalonicenses 1–3', chapters: '1–3', marker: N },
  { day: 349, book: '1 Timóteo', bookNum: 54, title: '1 Timóteo 1–6', chapters: '1–6', marker: N },
  { day: 350, book: '2 Timóteo', bookNum: 55, title: '2 Timóteo 1–4', chapters: '1–4', marker: N },
  { day: 351, book: 'Tito', bookNum: 56, title: 'Tito 1–3', chapters: '1–3', marker: N },
  { day: 351, book: 'Filemom', bookNum: 57, title: 'Filemom', chapters: '1', marker: N },
  { day: 352, book: 'Hebreus', bookNum: 58, title: 'Hebreus 1–6', chapters: '1–6', marker: N },
  { day: 353, book: 'Hebreus', bookNum: 58, title: 'Hebreus 7–10', chapters: '7–10', marker: N },
  { day: 354, book: 'Hebreus', bookNum: 58, title: 'Hebreus 11–13', chapters: '11–13', marker: N },
  { day: 355, book: 'Tiago', bookNum: 59, title: 'Tiago 1–5', chapters: '1–5', marker: N },
  { day: 356, book: '1 Pedro', bookNum: 60, title: '1 Pedro 1–5', chapters: '1–5', marker: N },
  { day: 357, book: '2 Pedro', bookNum: 61, title: '2 Pedro 1–3', chapters: '1–3', marker: N },
  { day: 358, book: '1 João', bookNum: 62, title: '1 João 1–5', chapters: '1–5', marker: N },
  { day: 359, book: '2 João', bookNum: 63, title: '2 João', chapters: '1', marker: N },
  { day: 359, book: '3 João', bookNum: 64, title: '3 João', chapters: '1', marker: N },
  { day: 359, book: 'Judas', bookNum: 65, title: 'Judas', chapters: '1', marker: N },
  { day: 360, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 1–4', chapters: '1–4', marker: N },
  { day: 361, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 5–9', chapters: '5–9', marker: N },
  { day: 362, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 10–14', chapters: '10–14', marker: N },
  { day: 363, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 15–18', chapters: '15–18', marker: N },
  { day: 364, book: 'Apocalipse', bookNum: 66, title: 'Apocalipse 19–22', chapters: '19–22', marker: N },
]

export const readingPlan: ReadingDay[] = _rawPlan.map(e => ({
  ...e,
  section: sec(e.bookNum),
}))

export const PLAN_DAYS = 364

export function getNextUncompletedDay(completedDays: Set<number>): number {
  const today = getTodayReadingDay()
  if (today) {
    for (let d = today; d <= today + PLAN_DAYS; d++) {
      if (!completedDays.has(d)) return d
    }
  }
  for (let d = 1; d <= PLAN_DAYS; d++) {
    if (!completedDays.has(d)) return d
  }
  return PLAN_DAYS
}

export function getReadingForDay(day: number): ReadingDay[] {
  const planDay = ((day - 1) % PLAN_DAYS) + 1
  return readingPlan.filter(d => d.day === planDay)
}

export function getReadingYear(day: number): number {
  return Math.floor((day - 1) / PLAN_DAYS) + 1
}

const markerSectionMap: Record<string, string> = {
  'tratos-israel': O,
  'congregacao-crista': B,
}

export function getDaysInSection(sectionId: string): ReadingDay[] {
  const marker = markerSectionMap[sectionId]
  if (marker !== undefined) {
    return readingPlan.filter(d => d.marker === marker)
  }
  return readingPlan.filter(d => d.section.id === sectionId)
}

export function getBookVideoUrl(bookNum: number): string | null {
  const slugs: Record<number, string> = {
    1: 'genesis', 2: 'exodo', 3: 'levitico', 4: 'numeros', 5: 'deuteronomio',
    6: 'josue', 7: 'juizes', 8: 'rute', 9: '1-samuel', 10: '2-samuel',
    11: '1-reis', 12: '2-reis', 13: '1-cronicas', 14: '2-cronicas',
    15: 'esdras', 16: 'neemias', 17: 'ester', 18: 'jo', 19: 'salmos',
    20: 'proverbios', 21: 'eclesiastes', 22: 'cantico-de-salomao',
    23: 'isaias', 24: 'jeremias', 25: 'lamentacoes', 26: 'ezequiel',
    27: 'daniel', 28: 'oseias', 29: 'joel', 30: 'amos', 31: 'obadias',
    32: 'jonas', 33: 'miqueias', 34: 'naum', 35: 'habacuque', 36: 'sofonias',
    37: 'ageu', 38: 'zacarias', 39: 'malaquias', 40: 'mateus',
    41: 'marcos', 42: 'lucas', 43: 'joao', 44: 'atos', 45: 'romanos',
    46: '1-corintios', 47: '2-corintios', 48: 'galatas', 49: 'efesios',
    50: 'filipenses', 51: 'colossenses', 52: '1-tessalonicenses',
    53: '2-tessalonicenses', 54: '1-timoteo', 55: '2-timoteo', 56: 'tito',
    57: 'filemom', 58: 'hebreus', 59: 'tiago', 60: '1-pedro', 61: '2-pedro',
    62: '1-joao', 63: '2-joao', 64: '3-joao', 65: 'judas', 66: 'apocalipse',
  }
  const slug = slugs[bookNum]
  if (!slug) return null
  return `https://www.jw.org/pt/biblioteca/videos/introducao-livros-da-biblia/livro-de-${slug}/`
}

export function getWolUrl(bookNum: number, chapter: number): string {
  return `https://wol.jw.org/pt/wol/b/r5/lp-t/nwtsty/${bookNum}/${chapter}`
}

const START_DATE_KEY = 'reading_start_date'

export function isReadingStarted(): boolean {
  return localStorage.getItem(START_DATE_KEY) !== null
}

export function getReadingStartDate(): Date | null {
  const stored = localStorage.getItem(START_DATE_KEY)
  return stored ? new Date(stored) : null
}

export function setReadingStartDate(date: Date): void {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  localStorage.setItem(START_DATE_KEY, d.toISOString())
}

export function clearReadingStartDate(): void {
  localStorage.removeItem(START_DATE_KEY)
}

export function getReadingDayForDate(date: Date): number | null {
  const stored = localStorage.getItem(START_DATE_KEY)
  if (!stored) return null
  const start = new Date(stored)
  start.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((target.getTime() - start.getTime()) / 86400000)
  const day = diffDays + 1
  return day >= 1 ? day : null
}

export function getDateForReadingDay(day: number): Date | null {
  const stored = localStorage.getItem(START_DATE_KEY)
  if (!stored) return null
  const start = new Date(stored)
  const d = new Date(start)
  d.setDate(d.getDate() + day - 1)
  return d
}

export function getTodayReadingDay(): number | null {
  return getReadingDayForDate(new Date())
}

export function getChaptersList(chapters: string): number[] {
  const clean = chapters.replace(/\s/g, '')
  const parts = clean.split(/[–-]/)
  const first = parts[0] || ''
  const second = parts[1] || ''
  const startChapter = first.includes(':') ? first.split(':')[0] : first
  const endChapter = second.includes(':')
    ? second.split(':')[0]
    : (first.includes(':') ? startChapter : (second || startChapter))
  const start = parseInt(startChapter)
  const end = parseInt(endChapter)
  if (isNaN(start) || isNaN(end)) return []
  const list: number[] = []
  for (let i = start; i <= end; i++) list.push(i)
  return list
}

export function checkedChaptersStorageKey(day: number): string {
  return `checked_${day}`
}

export function buildAllCheckedChapters(readings: { chapters: string }[]): Record<string, boolean> {
  const allChecked: Record<string, boolean> = {}
  readings.forEach((r, i) => {
    getChaptersList(r.chapters).forEach(ch => {
      allChecked[`${i}-${ch}`] = true
    })
  })
  return allChecked
}

export function saveCheckedChapters(day: number, checked: Record<string, boolean>): void {
  localStorage.setItem(checkedChaptersStorageKey(day), JSON.stringify(checked))
}

export function calcStreak(completedDays: Set<number>): number {
  const today = getTodayReadingDay()
  if (!today) return 0
  let streak = 0
  for (let d = today; d >= 1; d--) {
    if (completedDays.has(d)) streak++
    else break
  }
  return streak
}

export function searchReadingPlan(query: string): ReadingDay[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return readingPlan.filter(d =>
    d.book.toLowerCase().includes(q) ||
    d.title.toLowerCase().includes(q) ||
    String(d.day).includes(q)
  ).slice(0, 20)
}

export interface Schedule {
  id: string
  name: string
  description: string
}

export const schedules: Schedule[] = [
  { id: 'full', name: 'Bíblia em 1 Ano', description: 'Plano completo com 364 dias' },
  { id: 'tratos-israel', name: 'Tratos de Deus com os Israelitas', description: 'Dias com marcador laranja — visão histórica dos tratos de Deus com Israel' },
  { id: 'congregacao-crista', name: 'Desenvolvimento da Congregação Cristã', description: 'Dias com marcador azul — o desenvolvimento cronológico da congregação cristã' },
  { id: 'moses', name: 'Escritos de Moisés', description: 'Gênesis, Êxodo, Levítico, Números, Deuteronômio e Jó' },
  { id: 'terra-prometida', name: 'Israel Entra na Terra Prometida', description: 'Josué a Rute — a conquista e posse da terra' },
  { id: 'reis', name: 'Quando os Reis Governavam Israel', description: '1 Samuel a 2 Crônicas — os reis de Israel e Judá' },
  { id: 'exilio', name: 'Os Judeus Retornam do Exílio', description: 'Esdras a Ester — o retorno do cativeiro babilônico' },
  { id: 'cantico-sabedoria', name: 'Cânticos e Sabedoria Prática', description: 'Salmos a Cântico de Salomão — poesia, sabedoria e adoração' },
  { id: 'profetas', name: 'Os Profetas', description: 'Isaías a Malaquias — as mensagens dos profetas' },
  { id: 'jesus', name: 'Relatos da Vida de Jesus', description: 'Mateus, Marcos, Lucas e João' },
  { id: 'congregacao', name: 'Crescimento da Congregação', description: 'Atos — o nascimento e crescimento da igreja' },
  { id: 'cartas-paulo', name: 'As Cartas de Paulo', description: 'Romanos a Filemom e Hebreus — as epístolas' },
  { id: 'outros-apostolos', name: 'Escritos de Outros Apóstolos', description: 'Tiago a Judas — cartas dos demais apóstolos' },
]

export function getScheduleDays(scheduleId: string): number[] {
  if (scheduleId === 'full') {
    return Array.from({ length: PLAN_DAYS }, (_, i) => i + 1)
  }
  if (scheduleId === 'tratos-israel') {
    return [...new Set(readingPlan.filter(d => d.marker === O).map(d => d.day))].sort((a, b) => a - b)
  }
  if (scheduleId === 'congregacao-crista') {
    return [...new Set(readingPlan.filter(d => d.marker === B).map(d => d.day))].sort((a, b) => a - b)
  }
  const section = sections.find(s => s.id === scheduleId)
  if (section) {
    return [...new Set(readingPlan.filter(d => d.section.id === scheduleId).map(d => d.day))].sort((a, b) => a - b)
  }
  return Array.from({ length: PLAN_DAYS }, (_, i) => i + 1)
}

export function getScheduleName(scheduleId: string): string {
  return schedules.find(s => s.id === scheduleId)?.name || 'Bíblia em 1 Ano'
}

export function getCurrentSchedule(): string {
  return localStorage.getItem('reading_schedule') || 'full'
}

export function setCurrentSchedule(scheduleId: string): void {
  localStorage.setItem('reading_schedule', scheduleId)
}

export function getNextUncompletedInSchedule(scheduleDays: number[], completedDays: Set<number>): number {
  for (const d of scheduleDays) {
    if (!completedDays.has(d)) return d
  }
  return scheduleDays[scheduleDays.length - 1] || PLAN_DAYS
}

export function getUnreadDaysCount(scheduleDays: number[], completedDays: Set<number>): number {
  return scheduleDays.filter(d => !completedDays.has(d)).length
}
