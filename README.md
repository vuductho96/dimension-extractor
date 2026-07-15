# Dimension Extractor — SaaS

OCR bản vẽ kỹ thuật: đọc text layer từ PDF CAD, trích xuất kích thước/dung sai, xuất Excel.

## Stack

| Lớp        | Công nghệ                          |
|------------|-----------------------------------|
| Framework  | Next.js 15 (App Router)           |
| Auth + DB  | Supabase (PostgreSQL + Auth)      |
| OCR        | pdfjs-dist (PDF text layer)       |
| Export     | SheetJS (xlsx)                    |
| Deploy     | Vercel (via GitHub)               |

## Setup

### 1. Supabase

1. Tạo project tại [supabase.com](https://supabase.com)
2. Vào **SQL Editor** → chạy toàn bộ nội dung file `supabase/schema.sql`
3. Lấy URL và anon key từ **Project Settings → API**

### 2. Biến môi trường

```bash
cp .env.example .env.local
```

Điền vào `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### 3. Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## Deploy lên Vercel

### Cách 1 — GitHub + Vercel (khuyến nghị)

```bash
git init
git add .
git commit -m "feat: initial SaaS setup"

# Tạo repo trên GitHub rồi push
git remote add origin https://github.com/YOUR_USER/dimension-extractor.git
git push -u origin main
```

Sau đó:
1. Vào [vercel.com/new](https://vercel.com/new) → Import repo
2. Thêm environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy → tự động CI/CD từ git push

### Cách 2 — Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

## Tính năng

- **Landing page** giữ nguyên 100% design gốc
- **Đăng ký / Đăng nhập** bằng Supabase Auth
- **Upload PDF** (kéo-thả hoặc click)
- **Xem preview** từng trang PDF
- **Trích xuất** kích thước từ text layer (Ø, R, ±, dung sai hai phía, fit code)
- **Chỉnh sửa** kết quả trực tiếp trong bảng
- **Toggle trạng thái** OK / CHECK
- **Lưu lịch sử** vào Supabase
- **Xuất Excel** với 2 sheet (dữ liệu + metadata)

## Lưu ý OCR

Công cụ đọc **text layer** của PDF — cần PDF xuất từ CAD software:
- ✅ AutoCAD (Save as PDF / Plot to PDF)
- ✅ SolidWorks (Save as PDF)  
- ✅ Creo, NX, CATIA (export PDF)
- ❌ PDF scan / ảnh chụp (không có text layer)
