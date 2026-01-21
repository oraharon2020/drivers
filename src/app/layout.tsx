import type { Metadata } from 'next';
import './globals.css';
import { LoaderProvider } from '@/components/ui/Loader';

export const metadata: Metadata = {
  title: 'מערכת ניהול משלוחים נלה',
  description: 'מערכת ניהול משלוחים לחברת נלה',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LoaderProvider>{children}</LoaderProvider>
      </body>
    </html>
  );
}
