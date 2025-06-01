'use client'

import { Container, Title, Text, Stack, Button, Paper, Code } from '@mantine/core'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'

export default function EmergencyPage() {
  const router = useRouter()

  const clearEverything = async () => {
    try {
      const supabase = createClient()
      
      // 1. Supabase session temizle
      await supabase.auth.signOut()
      
      // 2. Browser storage temizle
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // 3. Cookies temizle
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos) : c
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        })
      }
      
      notifications.show({
        title: 'Temizlendi',
        message: 'Tüm veriler temizlendi. Login sayfasına yönlendiriliyorsunuz...',
        color: 'green',
      })
      
      // 4. Login sayfasına yönlendir
      setTimeout(() => {
        router.push('/login')
      }, 2000)
      
    } catch (error) {
      console.error('Clear error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Temizlenirken hata oluştu',
        color: 'red',
      })
    }
  }

  const forceReload = () => {
    window.location.href = '/login'
  }

  return (
    <Container size="md" py="xl">
      <Stack align="center" gap="xl">
        <Title order={1} c="red">🚨 Emergency Reset</Title>
        
        <Paper p="xl" withBorder w="100%">
          <Stack gap="md">
            <Text size="lg" fw={500}>Session Sorunu mu Yaşıyorsunuz?</Text>
            
            <Text>
              Eğer sayfayı yeniledikten sonra kullanıcı bilgileri gözükmüyorsa 
              veya sürekli loading'de kalıyorsa aşağıdaki butonları kullanın:
            </Text>

            <Stack gap="sm">
              <Button
                color="red"
                size="lg"
                onClick={clearEverything}
                fullWidth
              >
                🧹 Tüm Verileri Temizle ve Yeniden Başlat
              </Button>
              
              <Button
                variant="outline"
                onClick={forceReload}
                fullWidth
              >
                🔄 Login Sayfasına Git
              </Button>
            </Stack>

            <Paper p="md" bg="gray.1">
              <Title order={4} mb="sm">Bu işlem şunları yapar:</Title>
              <ul>
                <li>Supabase session'ını temizler</li>
                <li>Browser localStorage'ı temizler</li>
                <li>Browser sessionStorage'ı temizler</li>
                <li>Cookies'leri temizler</li>
                <li>Login sayfasına yönlendirir</li>
              </ul>
            </Paper>

            <Text size="sm" c="dimmed" ta="center">
              Bu sayfa session sorunları için acil durum sayfasıdır.
              <br />
              URL: <Code>/emergency</Code>
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
} 