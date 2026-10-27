import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { brand } from '../app.config'
import './globals.css'

export const metadata: Metadata = { title: brand.name }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
