import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ณัฐพล & เพ็ญพิสุทธิ์ · 04.12.2026',
  description: 'คำเชิญร่วมพิธีมงคลสมรส ณ Celebce Venue',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
