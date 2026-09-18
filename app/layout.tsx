import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GPTBOT | GPT Visibility',
  description: '모바일 전용 GPTBOT 답변 노출 최적화 서비스 경험',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
