import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Budget Allocation Optimizer',
  description: 'Optimize your marketing budget across experiments',
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
