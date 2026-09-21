import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Image as ImageIcon, ArrowRight } from 'lucide-react'
import Gallery from './albums/[id]/Gallery'

export default async function Home() {
  const supabase = await createClient()

  // Fetch 8 most recent photos across all albums
  const { data: recentPhotos } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] min-h-[450px] flex items-center justify-center overflow-hidden bg-primary/20">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-primary/10 object-cover" />
          </div>
          
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-6">
            <div className="bg-background/85 backdrop-blur-sm p-8 md:p-12 rounded-3xl shadow-sm border border-white/40">
              <h1 className="text-4xl md:text-6xl font-bold font-serif text-foreground mb-4">
                Lớp 9A1
              </h1>
              <p className="text-xl md:text-2xl font-serif text-foreground/80 mb-6">
                Nơi lưu giữ thanh xuân & kỷ niệm
              </p>
              
              <div className="font-handwriting text-2xl md:text-3xl text-foreground/70 rotate-[-2deg] mb-6">
                "Thanh xuân như một cơn mưa rào..."
              </div>

              <div>
                <Link
                  href="/albums"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium px-6 py-3 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:gap-3"
                >
                  <span>Khám phá Albums</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Memories Section */}
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground">Khoảnh khắc mới nhất</h2>
              <p className="text-foreground/60 text-sm mt-1">Những hình ảnh vừa được các bạn chia sẻ</p>
            </div>
            <Link 
              href="/albums"
              className="text-primary-foreground bg-primary hover:bg-primary/90 px-6 py-2 rounded-full font-medium transition-colors shadow-sm text-sm"
            >
              Xem tất cả
            </Link>
          </div>
          
          {recentPhotos && recentPhotos.length > 0 ? (
            <Gallery photos={recentPhotos} />
          ) : (
            <div className="py-16 px-4 text-center bg-card rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
              <ImageIcon className="w-12 h-12 text-primary/40 mb-3" />
              <p className="text-foreground/70 font-medium">Chưa có ảnh nào được tải lên</p>
              <p className="text-sm text-foreground/50 mt-1 mb-4">Hãy vào album và tải lên những bức ảnh đầu tiên của lớp nhé!</p>
              <Link
                href="/albums"
                className="text-sm bg-secondary px-4 py-2 rounded-full font-medium hover:bg-secondary/80 transition-colors"
              >
                Đến trang Albums
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
