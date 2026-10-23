import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Antrean Online Bridging BPJS - TPMD Dr. Machmujur',
  description: 'Sistem antrean online bridging BPJS VClaim & PCare terintegrasi dengan estimasi waktu tunggu otomatis, TV display ruang tunggu, TTS Indonesia, dan kios cetak mandiri.',
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
