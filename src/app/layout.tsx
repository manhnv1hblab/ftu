import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StudentProvider } from '../context/StudentContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { AdvisorChat } from '../components/ai/AdvisorChat';

export const metadata: Metadata = {
  title: 'FTU GoGlobal — Cổng Tư Vấn Trao Đổi Sinh Viên S27',
  description: 'Hệ thống tra cứu trường đối tác, ghép môn quy đổi tín chỉ và lập kế hoạch học tập tối ưu kỳ S27 (HK2 2026-2027) dành cho sinh viên Trường Đại học Ngoại thương.',
  keywords: ['FTU', 'GoGlobal', 'Trao đổi sinh viên', 'S27', 'Ngoại thương', 'Quy đổi tín chỉ', 'Du học trao đổi'],
  authors: [{ name: 'FTU Student Mobility Community' }],
  icons: { icon: '/images/logo.png' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-on-surface antialiased">
        <StudentProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <AdvisorChat />
        </StudentProvider>
      </body>
    </html>
  );
}
