import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'e-PPGFIL | Gestão de Solicitações | PPGFIL UERJ',
  description:
    'Sistema de abertura, consulta e acompanhamento de solicitações do Programa de Pós-Graduação em Filosofia da UERJ.',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/logo-ppgfil.svg', type: 'image/svg+xml' }],
    shortcut: '/logo-ppgfil.svg',
    apple: [{ url: '/logo-ppgfil.svg', type: 'image/svg+xml' }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#6B1E2C',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
