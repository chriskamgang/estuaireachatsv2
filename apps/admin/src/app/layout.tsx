import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import './globals.css';

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EstuaireAchats — Administration',
  description: 'Panneau d\'administration EstuaireAchats',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={publicSans.variable}>
      <body className="font-sans bg-gray-6 text-dark antialiased">
        {children}
      </body>
    </html>
  );
}
