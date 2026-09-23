-- =========================================================================
-- MIGRATION: Bổ sung thời gian chụp ảnh (Năm, Tháng) cho bảng public.photos
-- =========================================================================

-- 1. Thêm các cột: taken_year, taken_month vào bảng photos
ALTER TABLE public.photos 
  ADD COLUMN IF NOT EXISTS taken_year integer,
  ADD COLUMN IF NOT EXISTS taken_month integer;

-- 2. Cập nhật các ảnh cũ chưa có taken_year (nếu có) lấy từ năm tạo ảnh
UPDATE public.photos
SET taken_year = EXTRACT(YEAR FROM created_at)::integer
WHERE taken_year IS NULL;

-- 3. Đánh index để truy vấn lọc theo năm chụp ảnh đạt tốc độ cao nhất
CREATE INDEX IF NOT EXISTS idx_photos_taken_year_month ON public.photos (taken_year DESC NULLS LAST, taken_month DESC NULLS LAST);
