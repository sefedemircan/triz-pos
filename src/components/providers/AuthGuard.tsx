'use client'

import { Center, Loader, Stack, Text } from '@mantine/core'
import { useAuth } from './AuthProvider'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">Yükleniyor...</Text>
        </Stack>
      </Center>
    )
  }

  return <>{children}</>
} 