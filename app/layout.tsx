import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Antrean Online Bridging BPJS - TPMD Dr. Machmujur',
  description: 'Sistem antrean online bridging BPJS VClaim & PCare terintegrasi dengan estimasi waktu tunggu otomatis, TV display ruang tunggu, TTS Indonesia, dan kios cetak mandiri.',
  icons: {
    icon: [
      { url: '/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg',
    apple: '/assets/aistudio/Logo-01.jpg_cdb7cbc6.jpeg',
  },
  openGraph: {
    title: 'Antrean Online Bridging BPJS - TPMD Dr. Machmujur',
    description: 'Sistem antrean online bridging BPJS VClaim & PCare terintegrasi dengan estimasi waktu tunggu otomatis, TV display ruang tunggu, TTS Indonesia, dan kios cetak mandiri.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Antrean Online Bridging BPJS - TPMD Dr. Machmujur',
    description: 'Sistem antrean online bridging BPJS VClaim & PCare terintegrasi dengan estimasi waktu tunggu otomatis, TV display ruang tunggu, TTS Indonesia, dan kios cetak mandiri.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
