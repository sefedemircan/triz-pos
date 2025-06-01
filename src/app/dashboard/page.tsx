'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Center, Loader, Stack, Text } from '@mantine/core'
import { useAuth } from '@/components/providers/AuthProvider'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // Rol tabanlı yönlendirme
      switch (user.role) {
        case 'admin':
          router.replace('/dashboard/admin')
          break
        case 'garson':
          router.replace('/dashboard/garson')
          break
        case 'mutfak':
          router.replace('/dashboard/mutfak')
          break
        default:
          router.replace('/dashboard/admin') // Fallback
      }
    }
  }, [user, loading, router])

  return (
    <Center h="100vh">
      <Stack align="center">
        <Loader size="lg" />
        <Text>Yönlendiriliyor...</Text>
      </Stack>
    </Center>
  )
} 