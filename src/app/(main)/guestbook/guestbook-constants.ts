export const PAPER_COLORS = [
  { id: 'yellow', name: 'Vàng nắng', bg: 'bg-[#fef9c3]', border: 'border-[#fde047]', text: 'text-amber-950', ring: 'ring-amber-400', tape: 'bg-amber-100/70 border-amber-200/80' },
  { id: 'pink', name: 'Hồng phấn', bg: 'bg-[#fce7f3]', border: 'border-[#fbcfe8]', text: 'text-pink-950', ring: 'ring-pink-400', tape: 'bg-pink-100/70 border-pink-200/80' },
  { id: 'blue', name: 'Xanh mây', bg: 'bg-[#e0f2fe]', border: 'border-[#bae6fd]', text: 'text-sky-950', ring: 'ring-sky-400', tape: 'bg-sky-100/70 border-sky-200/80' },
  { id: 'green', name: 'Xanh cốm', bg: 'bg-[#dcfce7]', border: 'border-[#bbf7d0]', text: 'text-emerald-950', ring: 'ring-emerald-400', tape: 'bg-emerald-100/70 border-emerald-200/80' },
  { id: 'orange', name: 'Cam đào', bg: 'bg-[#ffedd5]', border: 'border-[#fed7aa]', text: 'text-orange-950', ring: 'ring-orange-400', tape: 'bg-orange-100/70 border-orange-200/80' },
  { id: 'purple', name: 'Tím mơ', bg: 'bg-[#f3e8ff]', border: 'border-[#e9d5ff]', text: 'text-purple-950', ring: 'ring-purple-400', tape: 'bg-purple-100/70 border-purple-200/80' },
]

export const STICKERS = ['🌸', '📝', '🚲', '🎈', '⭐', '💌', '🌿', '🎓', '🎸', '☀️', '☕', '🍦']

export const FONT_OPTIONS = [
  { id: 'caveat', name: 'Nét chữ bút mực', fontClass: 'font-caveat', sample: 'Nét chữ nết người' },
  { id: 'patrick', name: 'Chữ tròn học trò', fontClass: 'font-patrick', sample: 'Tuổi học trò áo trắng' },
  { id: 'dancing', name: 'Chữ nghiêng bay bổng', fontClass: 'font-dancing', sample: 'Kỷ niệm thanh xuân' },
  { id: 'itim', name: 'Chữ nét phấn bảng', fontClass: 'font-itim', sample: 'Nhớ thầy cô bạn bè' },
  { id: 'serif', name: 'Trang sách xưa', fontClass: 'font-merriweather', sample: 'Lớp 9A thân yêu' },
]

export const getFontClass = (fontId?: string | null) => {
  switch (fontId) {
    case 'patrick':
      return 'font-patrick'
    case 'dancing':
      return 'font-dancing'
    case 'itim':
      return 'font-itim'
    case 'serif':
      return 'font-merriweather'
    case 'caveat':
    default:
      return 'font-caveat'
  }
}
