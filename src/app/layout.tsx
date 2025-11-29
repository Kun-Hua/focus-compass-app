import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import Header from '@/components/Header' // 恢復使用更佳的路徑別名
import { GoalsProvider } from '@/components/GoalsContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Focus Compass - 複利指南針',
  description: '基於巴菲特 5/25 法則的目標管理系統',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      {/* 加上灰色背景，並將內容設為 flex column */}
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <GoalsProvider>
          <Header /> {/* 將 Header 放在這裡，它將出現在所有頁面頂部 */}
          <main className="flex-grow container mx-auto p-4 md:p-8">
            {children}
          </main>
        </GoalsProvider>
      </body>
    </html>
  )
}
