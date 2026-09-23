-- =========================================================================
-- MIGRATION: Bổ sung số điện thoại và tùy chọn hiển thị riêng tư cho Hồ sơ
-- Áp dụng cho bảng public.profiles
-- =========================================================================

-- 1. Thêm các cột: phone_number, show_email, show_phone
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS show_email boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_phone boolean DEFAULT false;

-- 2. Đặt giá trị mặc định cho các hồ sơ hiện có nếu đang là NULL
UPDATE public.profiles
SET 
  show_email = COALESCE(show_email, true),
  show_phone = COALESCE(show_phone, false)
WHERE show_email IS NULL OR show_phone IS NULL;

-- 3. Cập nhật trigger tự động khi đăng ký tài khoản mới (handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone_number,
    show_email,
    show_phone,
    avatar_url, 
    role, 
    is_approved
  )
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    new.raw_user_meta_data->>'phone_number',
    COALESCE((new.raw_user_meta_data->>'show_email')::boolean, true),
    COALESCE((new.raw_user_meta_data->>'show_phone')::boolean, false),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      null
    ),
    'member',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
