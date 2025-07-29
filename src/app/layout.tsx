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
      '#FFC300',
      '#FFC300',
      '#FFC300',
      '#FFC300',
      '#FFC300',
      '#FFC300',
      '#FFC300',
      '#FFC300',
      '#FFC300',     
      '#FFC300',    
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
