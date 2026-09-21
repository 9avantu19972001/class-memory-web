export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-primary/20">
          <div className="absolute inset-0 z-0">
            {/* Placeholder for cover photo */}
            <div className="w-full h-full bg-primary/10 object-cover" />
          </div>
          
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center gap-6">
            <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-white/20">
              <h1 className="text-4xl md:text-6xl font-bold font-serif text-foreground mb-4">
                Lớp 9A1
              </h1>
              <p className="text-xl md:text-2xl font-serif text-foreground/80 mb-6">
                Nơi lưu giữ thanh xuân
              </p>
              
              <div className="font-handwriting text-2xl md:text-3xl text-foreground/70 rotate-[-2deg] mt-4">
                "Thanh xuân như một cơn mưa rào..."
              </div>
            </div>
          </div>
        </section>

        {/* Recent Memories Section Placeholder */}
        <section className="py-16 px-4 max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-serif font-bold text-foreground">Khoảnh khắc mới nhất</h2>
            <button className="text-primary-foreground bg-primary hover:bg-primary/90 px-6 py-2 rounded-full font-medium transition-colors shadow-sm">
              Xem tất cả
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Placeholder cards */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-3 shadow-sm border border-border aspect-square flex flex-col">
                <div className="bg-secondary/30 rounded-xl flex-1 mb-3"></div>
                <div className="font-handwriting text-xl text-center text-foreground/80">Kỷ niệm {i}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
