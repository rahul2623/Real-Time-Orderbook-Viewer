import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Real-Time Orderbook Viewer',
  description: 'Real-time orderbook viewer with order simulation capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
} 