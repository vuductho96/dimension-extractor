import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dimension Extractor — OCR bản vẽ kỹ thuật',
  description:
    'Dimension Extractor biến bản vẽ kỹ thuật thành dữ liệu kích thước, dung sai và ký hiệu có cấu trúc.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>{children}</body>
    </html>
  );
}
