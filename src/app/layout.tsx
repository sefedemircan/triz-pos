import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { MantineProvider, ColorSchemeScript, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { AuthGuard } from '@/components/providers/AuthGuard'

const inter = Inter({ subsets: ['latin'] })

// Dark-Light Mode destekli tema
const theme = createTheme({
  primaryColor: 'orange',
  colors: {
    orange: [
      '#FFF4F0',     // 0 - En açık
      '#FFE8E0',     // 1
      '#FFD1C1',     // 2
      '#FFBA9F',     // 3
      '#FF9A7A',     // 4
      '#FF8C42',     // 5
      '#FF6B35',     // 6 - Ana renk
      '#E55A2B',     // 7
      '#CC4B21',     // 8
      '#B33E18'      // 9 - En koyu
    ],
  },
  fontFamily: inter.style.fontFamily,
  headings: {
    fontFamily: inter.style.fontFamily,
    fontWeight: '600',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
    },
    Badge: {
      defaultProps: {
        radius: 'md',
        variant: 'light',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
})

export const metadata: Metadata = {
  title: 'Cafe POS System',
  description: 'Modern Point of Sale System for Cafes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <Notifications 
            position="top-right"
            zIndex={1000}
            limit={3}
          />
          <AuthProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
