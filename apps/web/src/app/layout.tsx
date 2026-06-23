import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import SecondaryNav from '@/components/layout/SecondaryNav';
import Footer from '@/components/layout/Footer';
import FloatingSidebar from '@/components/layout/FloatingSidebar';
import ClientProvider from '@/components/layout/ClientProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'EstuaireAchats — Achetez en gros et detail',
  description:
    'EstuaireAchats est la premiere plateforme e-commerce multi-vendeurs du Cameroun. Achetez et vendez en gros et en detail : electronique, vetements, materiaux de construction et plus encore. Paiement securise par MTN MoMo, Orange Money et PayPal.',
  keywords: [
    'e-commerce',
    'Cameroun',
    'achat en gros',
    'vente en ligne',
    'fournisseurs',
    'EstuaireAchats',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-dark antialiased">
        <ClientProvider>
          <TopBar />
          <Header />
          <SecondaryNav />
          <main className="min-h-[60vh]">{children}</main>
          <Footer />
          <FloatingSidebar />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                fontSize: '14px',
                borderRadius: '8px',
              },
            }}
          />
        </ClientProvider>
      </body>
    </html>
  );
}
