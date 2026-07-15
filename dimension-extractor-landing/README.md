# Dimension Extractor — Static Landing Page

Landing page một trang, không cần backend, framework hay bước build.

## Chạy website

- Cách nhanh nhất: mở trực tiếp `index.html` bằng trình duyệt.
- Hoặc chạy local server để xem ổn định hơn:

```bash
python -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

## Chỉnh nội dung

Mở `content.js`. Toàn bộ tiêu đề, mô tả, tính năng, quy trình, FAQ và CTA đều nằm trong một object duy nhất.

## Chỉnh giao diện

- Màu sắc, font, khoảng cách: các biến ở đầu `styles.css`.
- Cấu trúc trang và hình minh họa SVG: `index.html`.
- Tương tác menu, demo quét, FAQ và chọn file: `app.js`.

## Đưa lên hosting

Có thể upload nguyên thư mục lên GitHub Pages, Netlify, Cloudflare Pages, Vercel hoặc bất kỳ static hosting nào. Không cần biến môi trường hoặc cơ sở dữ liệu.
