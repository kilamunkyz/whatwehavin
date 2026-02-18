import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/ui/Nav'

export const metadata: Metadata = {
  title: 'WhatWeHavin',
  description: 'Your personal recipe book & meal planner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50">
        <Nav />
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
