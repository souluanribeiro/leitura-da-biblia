export interface ReadingDay {
  day: number
  book: string
  bookNum: number
  title: string
  chapters: string
  section: Section
  marker: '🔸' | '🔹' | ''
}

export interface Section {
  id: string
  name: string
  color: string
  icon: string
}
