import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/layout/Providers'
export const metadata: Metadata = { title: 'Help School — Sistema de Gestão', description: 'Sistema interno Help School' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR"><body><Providers>{children}</Providers></body></html>
}
