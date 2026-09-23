'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteAlbum } from '../actions'

export default function DeleteAlbumButton({ albumId }: { albumId: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa album này không? Tất cả ảnh và kỷ niệm trong album sẽ bị xóa vĩnh viễn.'
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteAlbum(albumId)
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Không thể xóa album. Vui lòng kiểm tra lại quyền hoặc thử lại sau.')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
      title="Xóa album này"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      <span>Xóa album</span>
    </button>
  )
}
