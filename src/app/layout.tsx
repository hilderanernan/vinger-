import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://vinger-real.vercel.app'),
  title: 'Vinger - Media Sosial Berbasis Suara',
  description: 'Bagi momen dan berinteraksi secara autentik lewat rekaman suara tanpa ketikan.',
  verification: {
    google: '7cNfhcHba76LCfxdyALtalbtQWi8Zjaitv67B4hrnYg',
  },
  openGraph: {
    title: 'Vinger - Media Sosial Berbasis Suara',
    description: 'Dengarkan postingan dan balas komentar menggunakan suara kamu!',
    url: '/',
    siteName: 'Vinger',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vinger Audio Social Media',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vinger - Media Sosial Berbasis Suara',
    description: 'Dengarkan postingan dan balas komentar menggunakan suara kamu!',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
