'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Container,
  Center,
  Alert,
  Stack,
  Group,
  Divider,
  Tabs,
  Select,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconInfoCircle, IconLogin, IconUser, IconUserPlus, IconAlertCircle } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('login')
  const [error, setError] = useState('')
  const [clearing, setClearing] = useState(false)
  const router = useRouter()

  const loginForm = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi'),
      password: (value) => (value.length < 6 ? 'Şifre en az 6 karakter olmalı' : null),
    },
  })

  const signupForm = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'garson',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi'),
      password: (value) => (value.length < 6 ? 'Şifre en az 6 karakter olmalı' : null),
      confirmPassword: (value, values) =>
        value !== values.password ? 'Şifreler eşleşmiyor' : null,
      fullName: (value) => (value.length < 2 ? 'Ad soyad en az 2 karakter olmalı' : null),
    },
  })

  const handleLogin = async (values: typeof loginForm.values) => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        notifications.show({
          title: 'Başarılı',
          message: 'Giriş yapıldı, yönlendiriliyorsunuz...',
          color: 'green',
        })
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (values: typeof signupForm.values) => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // 1. Auth kullanıcısı oluştur - rolü metadata'ya ekle
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            role: values.role, // Rolü metadata'ya ekle
          }
        }
      })

      if (authError) {
        notifications.show({
          title: 'Kayıt Hatası',
          message: authError.message,
          color: 'red',
        })
        return
      }

      if (authData.user) {
        // 2. Users tablosuna kullanıcı bilgilerini ekle (auth hook zaten ekliyor ama emin olmak için)
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: values.email,
            role: values.role as 'admin' | 'garson' | 'mutfak',
            full_name: values.fullName,
          })

        if (userError) {
          console.error('User upsert error:', userError)
          // Bu hata kritik değil, auth hook zaten eklemiş olabilir
        }

        notifications.show({
          title: 'Başarılı',
          message: 'Hesap oluşturuldu! Email doğrulaması yapın ve giriş yapabilirsiniz.',
          color: 'green',
        })

        // Login tabına geç
        setActiveTab('login')
        signupForm.reset()
      }
    } catch {
      notifications.show({
        title: 'Hata',
        message: 'Bir hata oluştu, lütfen tekrar deneyin',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = (email: string) => {
    loginForm.setValues({
      email: email,
      password: '123456'
    })
    setActiveTab('login')
  }

  const clearSession = async () => {
    setClearing(true)
    try {
      const supabase = createClient()
      
      // Supabase session'ını temizle
      await supabase.auth.signOut()
      
      // Local storage'ı temizle
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      notifications.show({
        title: 'Temizlendi',
        message: 'Session ve cache temizlendi. Sayfa yenileniyor...',
        color: 'green',
      })
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Clear session error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Session temizlenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <Container size="sm" style={{ height: '100vh' }}>
      <Center style={{ height: '100%' }}>
        <Paper shadow="md" p="xl" radius="md" style={{ width: '100%', maxWidth: 500 }}>
          <Stack>
            <Center>
              <IconLogin size={48} color="var(--mantine-color-blue-6)" />
            </Center>
            
            <Title order={2} ta="center" mb="md">
              Cafe POS
            </Title>

            <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
              Demo hesaplar ile test edebilirsiniz. Aşağıdaki butonlara tıklayarak bilgileri otomatik doldurun.
            </Alert>

            {/* Demo Kullanıcı Butonları */}
            <Stack gap="xs">
              <Text size="sm" fw={500} c="dimmed">Demo Hesapları:</Text>
              <Group grow>
                <Button 
                  variant="light" 
                  color="red" 
                  size="xs"
                  leftSection={<IconUser size="0.9rem" />}
                  onClick={() => handleDemoLogin('admin@test.com')}
                >
                  Admin
                </Button>
                <Button 
                  variant="light" 
                  color="blue" 
                  size="xs"
                  leftSection={<IconUser size="0.9rem" />}
                  onClick={() => handleDemoLogin('garson@test.com')}
                >
                  Garson
                </Button>
              </Group>
            </Stack>

            <Divider label="veya" labelPosition="center" />

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List grow>
                <Tabs.Tab 
                  value="login" 
                  leftSection={<IconLogin size="0.9rem" />}
                >
                  Giriş Yap
                </Tabs.Tab>
                <Tabs.Tab 
                  value="signup" 
                  leftSection={<IconUserPlus size="0.9rem" />}
                >
                  Hesap Oluştur
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="login" mt="md">
                <form onSubmit={loginForm.onSubmit(handleLogin)}>
                  <Stack>
                    {error && (
                      <Alert icon={<IconAlertCircle size="1rem" />} color="red">
                        {error}
                      </Alert>
                    )}

                    <TextInput
                      label="Email"
                      placeholder="your@email.com"
                      required
                      {...loginForm.getInputProps('email')}
                    />

                    <PasswordInput
                      label="Şifre"
                      placeholder="Şifrenizi girin"
                      required
                      {...loginForm.getInputProps('password')}
                    />

                    <Group grow>
                      <Button 
                        type="submit" 
                        loading={loading}
                        fullWidth
                        mt="md"
                      >
                        Giriş Yap
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        color="red"
                        onClick={clearSession}
                        loading={clearing}
                      >
                        Session Temizle
                      </Button>
                    </Group>
                  </Stack>
                </form>
              </Tabs.Panel>

              <Tabs.Panel value="signup" mt="md">
                <form onSubmit={signupForm.onSubmit(handleSignup)}>
                  <Stack>
                    <TextInput
                      label="Ad Soyad"
                      placeholder="Adınızı ve soyadınızı girin"
                      required
                      {...signupForm.getInputProps('fullName')}
                    />

                    <TextInput
                      label="Email"
                      placeholder="your@email.com"
                      required
                      {...signupForm.getInputProps('email')}
                    />

                    <Select
                      label="Rol"
                      placeholder="Rolünüzü seçin"
                      required
                      data={[
                        { value: 'admin', label: 'Admin - Sistem Yöneticisi' },
                        { value: 'garson', label: 'Garson - Sipariş Alma' },
                        { value: 'mutfak', label: 'Mutfak - Sipariş Hazırlama' },
                      ]}
                      {...signupForm.getInputProps('role')}
                    />

                    <PasswordInput
                      label="Şifre"
                      placeholder="En az 6 karakter"
                      required
                      {...signupForm.getInputProps('password')}
                    />

                    <PasswordInput
                      label="Şifre Tekrar"
                      placeholder="Şifrenizi tekrar girin"
                      required
                      {...signupForm.getInputProps('confirmPassword')}
                    />

                    <Button 
                      type="submit" 
                      loading={loading}
                      fullWidth
                      mt="md"
                    >
                      Hesap Oluştur
                    </Button>
                  </Stack>
                </form>

                <Alert icon={<IconInfoCircle size="1rem" />} color="yellow" variant="light" mt="md">
                  <Text size="sm">
                    Hesap oluşturduktan sonra email adresinize gelen doğrulama linkine tıklayın.
                  </Text>
                </Alert>
              </Tabs.Panel>
            </Tabs>

            <Stack gap="xs">
              <Text size="sm" ta="center" c="dimmed">
                Bu sistem sadece kayıtlı personel için kullanılabilir.
              </Text>
              <Text size="xs" ta="center" c="dimmed">
                Test hesapları: admin@test.com / garson@test.com (şifre: 123456)
              </Text>
            </Stack>
          </Stack>
        </Paper>
      </Center>
    </Container>
  )
} 