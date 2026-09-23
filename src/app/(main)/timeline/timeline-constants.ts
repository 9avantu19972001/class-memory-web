export interface AcademicYearConfig {
  id: string
  title: string
  shortTitle: string
  timeRange: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  badgeColor: string
}

export const ACADEMIC_YEARS: AcademicYearConfig[] = [
  {
    id: 'reunion',
    title: 'Họp Lớp & Ngày Hội Ngộ',
    shortTitle: 'Họp lớp',
    timeRange: 'Sau khi ra trường',
    icon: '🌟',
    color: 'purple',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-300 dark:border-purple-800',
    textColor: 'text-purple-900 dark:text-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 border-purple-200',
  },
  {
    id: 'lop_9',
    title: 'Lớp 9 - Mùa Phượng Vĩ Cuối Cùng',
    shortTitle: 'Lớp 9',
    timeRange: '2000 - 2001',
    icon: '🎓',
    color: 'rose',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-300 dark:border-rose-800',
    textColor: 'text-rose-900 dark:text-rose-200',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-200',
  },
  {
    id: 'lop_8',
    title: 'Lớp 8 - Nhịp Xe Rong Ruổi',
    shortTitle: 'Lớp 8',
    timeRange: '1999 - 2000',
    icon: '🚲',
    color: 'amber',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-300 dark:border-amber-800',
    textColor: 'text-amber-900 dark:text-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200',
  },
  {
    id: 'lop_7',
    title: 'Lớp 7 - Tuổi Thơ Náo Nhiệt',
    shortTitle: 'Lớp 7',
    timeRange: '1998 - 1999',
    icon: '🌿',
    color: 'emerald',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    textColor: 'text-emerald-800 dark:text-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200',
  },
  {
    id: 'lop_6',
    title: 'Lớp 6 - Ngày Đầu Bỡ Ngỡ',
    shortTitle: 'Lớp 6',
    timeRange: '1997 - 1998',
    icon: '🎒',
    color: 'sky',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    borderColor: 'border-sky-300 dark:border-sky-800',
    textColor: 'text-sky-800 dark:text-sky-200',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200 border-sky-200',
  },
]

export const EVENT_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'memory', label: 'Kỷ niệm chung', icon: '📝' },
  { id: 'academic', label: 'Học tập & Thầy cô', icon: '📚' },
  { id: 'activity', label: 'Báo tường & Văn nghệ', icon: '🎨' },
  { id: 'trip', label: 'Cắm trại & Dã ngoại', icon: '🏕️' },
  { id: 'farewell', label: 'Bế giảng & Chia tay', icon: '🌸' },
  { id: 'reunion', label: 'Họp lớp & Gặp lại', icon: '🥂' },
]

export function getYearConfig(yearId: string): AcademicYearConfig {
  return ACADEMIC_YEARS.find((y) => y.id === yearId) || ACADEMIC_YEARS[0]
}

export function getCategoryConfig(categoryId: string) {
  return EVENT_CATEGORIES.find((c) => c.id === categoryId) || EVENT_CATEGORIES[0]
}
