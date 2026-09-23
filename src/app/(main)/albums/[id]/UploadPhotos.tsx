'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Upload, X, Loader2, Image as ImageIcon, Video, Calendar } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { createClient } from '@/lib/supabase/client'
import { savePhotoRecords, addYoutubeVideo } from '../actions'
import { useRouter } from 'next/navigation'
import { getYouTubeId } from '@/lib/youtube'

export default function UploadPhotos({
  albumId,
  isLoggedIn,
  isApproved,
}: {
  albumId: string
  isLoggedIn: boolean
  isApproved: boolean
}) {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'photo' | 'video'>('photo')
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState('')
  const [takenYear, setTakenYear] = useState<number>(2001)
  const [takenMonth, setTakenMonth] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isUploading) setIsOpen(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = 'unset'
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, isUploading])

  const handleOpenModal = () => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (!isApproved) {
      alert('Tài khoản của bạn đang chờ Admin duyệt trước khi tải ảnh lên.')
      return
    }
    setIsOpen(true)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  })

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUploadPhotos = async () => {
    if (files.length === 0) return
    setIsUploading(true)
    setProgress(0)

    try {
      const uploadedRecords = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 1. Client-side compression
        const options = {
          maxSizeMB: 1, // max 1MB
          maxWidthOrHeight: 1920,
          useWebWorker: true
        }
        const compressedFile = await imageCompression(file, options)
        
        // 2. Upload to Supabase Storage
        const fileExt = compressedFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${albumId}/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('memories')
          .upload(filePath, compressedFile)
          
        if (uploadError) throw uploadError
        
        uploadedRecords.push({ path: filePath })
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }
      
      // 3. Save to database with taken_year & taken_month
      await savePhotoRecords(
        albumId, 
        uploadedRecords, 
        { 
          taken_year: takenYear ? Number(takenYear) : null, 
          taken_month: takenMonth ? Number(takenMonth) : null 
        }
      )
      
      setFiles([])
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Đã có lỗi xảy ra khi tải ảnh lên.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddVideo = async (formData: FormData) => {
    setIsUploading(true)
    try {
      await addYoutubeVideo(albumId, formData)
      setVideoUrl('')
      setIsOpen(false)
      router.refresh()
    } catch (err) {
      console.error('Add video failed:', err)
      alert('Đã có lỗi xảy ra khi thêm video.')
    } finally {
      setIsUploading(false)
    }
  }

const QUICK_YEARS = [
  { year: 2001, label: '2001 (Ra trường)' },
  { year: 2000, label: '2000 (Lớp 9A)' },
  { year: 1999, label: '1999 (Lớp 8A)' },
  { year: 1998, label: '1998 (Lớp 7A)' },
  { year: 1997, label: '1997 (Lớp 6A)' },
  { year: 2011, label: '2011 (10 năm)' },
  { year: 2021, label: '2021 (20 năm)' },
  { year: new Date().getFullYear(), label: `${new Date().getFullYear()} (Hiện tại)` },
]

  return (
    <>
      <button 
        onClick={handleOpenModal}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 shadow-sm"
      >
        <Upload className="w-5 h-5" />
        <span>Thêm kỷ niệm</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <div className="flex space-x-4">
                <button 
                  onClick={() => setActiveTab('photo')}
                  className={`font-serif font-bold text-lg flex items-center gap-2 px-2 py-1 border-b-2 transition-colors ${activeTab === 'photo' ? 'border-primary text-foreground' : 'border-transparent text-foreground/50 hover:text-foreground'}`}
                >
                  <ImageIcon className="w-5 h-5" />
                  Ảnh
                </button>
                <button 
                  onClick={() => setActiveTab('video')}
                  className={`font-serif font-bold text-lg flex items-center gap-2 px-2 py-1 border-b-2 transition-colors ${activeTab === 'video' ? 'border-red-500 text-foreground' : 'border-transparent text-foreground/50 hover:text-foreground'}`}
                >
                  <Video className="w-5 h-5" />
                  Video YouTube
                </button>
              </div>
              <button 
                onClick={() => !isUploading && setIsOpen(false)}
                className="text-foreground/50 hover:text-foreground p-2 rounded-full transition-colors disabled:opacity-50"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {/* Date selection: Year & Month */}
              <div className="bg-secondary/15 rounded-xl p-3 border border-border/60 mb-4">
                <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Thời gian chụp / ghi hình (hiển thị trên Dòng thời gian):</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Năm chụp:</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={takenYear} 
                        onChange={(e) => setTakenYear(parseInt(e.target.value) || 2001)}
                        min="1990" 
                        max={new Date().getFullYear() + 1}
                        className="w-24 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary outline-none"
                      />
                      <div className="flex flex-wrap gap-1 items-center flex-1">
                        {QUICK_YEARS.slice(0, 5).map(q => (
                          <button
                            key={q.year}
                            type="button"
                            onClick={() => setTakenYear(q.year)}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              takenYear === q.year 
                                ? 'bg-primary text-primary-foreground font-semibold' 
                                : 'bg-background hover:bg-muted text-muted-foreground border border-border/50'
                            }`}
                          >
                            {q.year}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {QUICK_YEARS.slice(5).map(q => (
                        <button
                          key={q.year}
                          type="button"
                          onClick={() => setTakenYear(q.year)}
                          className={`text-xs px-2 py-0.5 rounded transition-colors ${
                            takenYear === q.year 
                              ? 'bg-primary text-primary-foreground font-semibold' 
                              : 'bg-background hover:bg-muted text-muted-foreground border border-border/50'
                          }`}
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Tháng chụp (tùy chọn):</label>
                    <select
                      value={takenMonth}
                      onChange={(e) => setTakenMonth(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">Cả năm / Không rõ tháng</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m.toString()}>Tháng {m}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Ảnh sẽ được tự động xếp vào mục năm <strong>{takenYear}</strong> trên Dòng thời gian.
                    </p>
                  </div>
                </div>
              </div>

              {activeTab === 'photo' ? (
                <>
                  <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/10 hover:border-primary/50'}
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-10 h-10 mx-auto text-primary/60 mb-4" />
                    <p className="text-foreground font-medium">Kéo thả ảnh vào đây, hoặc click để chọn ảnh</p>
                    <p className="text-sm text-foreground/60 mt-2">Hỗ trợ JPG, PNG, WEBP. Ảnh sẽ tự động được nén.</p>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-foreground mb-3">Đã chọn {files.length} ảnh</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {files.map((file, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-secondary/20">
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt="preview" 
                              className="w-full h-full object-cover"
                            />
                            <button 
                              onClick={() => removeFile(idx)}
                              disabled={isUploading}
                              className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="mt-6">
                      <div className="flex justify-between text-sm mb-2 text-foreground/80">
                        <span>Đang tải lên...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <form action={handleAddVideo} className="flex flex-col gap-4">
                  <input type="hidden" name="taken_year" value={takenYear || ''} />
                  <input type="hidden" name="taken_month" value={takenMonth || ''} />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Đường dẫn YouTube</label>
                    <input 
                      type="url" 
                      name="video_url"
                      required
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Mô tả (tùy chọn)</label>
                    <input 
                      type="text" 
                      name="caption"
                      placeholder="Một chút kỷ niệm về video này..."
                      className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  {(() => {
                    const previewYtId = getYouTubeId(videoUrl)
                    if (!previewYtId) return null
                    return (
                      <div className="aspect-video rounded-xl overflow-hidden border border-border mt-2 bg-black">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          src={`https://www.youtube-nocookie.com/embed/${previewYtId}?rel=0`} 
                          title="YouTube video player" 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )
                  })()}
                  <button 
                    type="submit"
                    disabled={!videoUrl || isUploading}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Thêm Video
                  </button>
                </form>
              )}
            </div>

            {activeTab === 'photo' && (
              <div className="p-4 border-t border-border bg-card flex justify-end gap-3">
                <button 
                  onClick={() => setIsOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-lg font-medium text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleUploadPhotos}
                  disabled={files.length === 0 || isUploading}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Tải ảnh lên ({files.length})
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
