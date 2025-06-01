import { Inter } from 'next/font/google'
import { MantineProvider } from '@mantine/core'

const inter = Inter({ subsets: ['latin'] })

export default function DebugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  )
} 