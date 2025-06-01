'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Center, Loader, Title, Text, Stack } from '@mantine/core'
import { useAuth } from '@/components/providers/AuthProvider'

export default function HomePage() {
  const { user, authUser, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user || authUser) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, authUser, loading, router])

  if (loading) {
    return (
      <Container size="sm" style={{ height: '100vh' }}>
        <Center style={{ height: '100%' }}>
          <Stack align="center">
            <Loader size="xl" />
            <Title order={2}>Cafe POS</Title>
            <Text c="dimmed">Yükleniyor...</Text>
          </Stack>
        </Center>
      </Container>
    )
  }

  return null
}
