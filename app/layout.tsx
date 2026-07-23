import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '스클립 (SKClip)',
  description: '스클립, 스케이트 트릭을 볼 수 있는 곳',
  openGraph: {
    title: '스클립 (SKClip)',
    description: '스클립, 스케이트 트릭을 볼 수 있는 곳',
    images: ['/logo.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '스클립 (SKClip)',
    description: '스클립, 스케이트 트릭을 볼 수 있는 곳',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-[#f7f4ef]">{children}</body>
    </html>
  );
}
