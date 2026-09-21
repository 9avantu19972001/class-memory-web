'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createAlbum } from './actions'

import { useRouter } from 'next/navigation'

export default function CreateAlbumModal({
  isLoggedIn,
  isApproved,
}: {
  isLoggedIn: boolean
  isApproved: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleButtonClick = () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (!isApproved) {
      alert('Tài khoản của bạn đang chờ Admin duyệt trước khi tạo Album.')
      return
    }
    setIsOpen(true)
  }

  return (
    <>
      <button 
        onClick={handleButtonClick}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">Tạo album</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-bold font-serif text-foreground">Tạo Album Mới</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-foreground/50 hover:text-foreground bg-secondary/30 hover:bg-secondary/50 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form 
              action={async (formData) => {
                setIsLoading(true)
                try {
                  await createAlbum(formData)
                  setIsOpen(false)
                } catch (err) {
                  console.error(err)
                } finally {
                  setIsLoading(false)
                }
              }} 
              className="p-4 flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tên Album</label>
                <input 
                  type="text" 
                  name="title"
                  required
                  placeholder="Ví dụ: Kỷ yếu lớp 9, Đi chơi công viên..."
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Mô tả (tùy chọn)</label>
                <textarea 
                  name="description"
                  rows={3}
                  placeholder="Viết vài dòng về kỷ niệm này..."
                  className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="is_public" 
                  id="is_public" 
                  defaultChecked
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                />
                <label htmlFor="is_public" className="text-sm text-foreground/80 cursor-pointer">
                  Công khai (cho phép khách xem nếu có link)
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-foreground hover:bg-secondary/50 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? 'Đang tạo...' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
