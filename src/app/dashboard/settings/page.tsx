'use client'

import { useState } from 'react'
import {
  Stack,
  Title,
  Group,
  Card,
  Text,
  Button,
  TextInput,
  PasswordInput,
  Divider,
  Alert,
  Badge,
} from '@mantine/core'
import {
  IconSettings,
  IconUser,
  IconLock,
  IconInfoCircle,
  IconCheck,
  IconShield,
} from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const profileForm = useForm({
    initialValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
      role: user?.role || 'garson',
    },
    validate: {
      full_name: (value) => (value.length < 2 ? 'Ad soyad en az 2 karakter olmalı' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi'),
    },
  })

  const passwordForm = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) => (value.length < 6 ? 'Mevcut şifre gerekli' : null),
      newPassword: (value) => (value.length < 6 ? 'Yeni şifre en az 6 karakter olmalı' : null),
      confirmPassword: (value, values) =>
        value !== values.newPassword ? 'Şifreler eşleşmiyor' : null,
    },
  })

  const handleProfileUpdate = async (values: typeof profileForm.values) => {
    setProfileLoading(true)
    try {
      const supabase = createClient()
      
      // Sadece full_name güncellenebilir, email ve role admin tarafından değiştirilir
      const { error } = await supabase
        .from('users')
        .update({
          full_name: values.full_name,
        })
        .eq('id', user?.id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Profil bilgileriniz güncellendi',
        color: 'green',
      })
    } catch (error) {
      console.error('Profile update error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Profil güncellenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (values: typeof passwordForm.values) => {
    setPasswordLoading(true)
    try {
      const supabase = createClient()
      
      // Önce mevcut şifreyi doğrula
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: values.currentPassword,
      })

      if (signInError) {
        notifications.show({
          title: 'Hata',
          message: 'Mevcut şifre yanlış',
          color: 'red',
        })
        return
      }

      // Yeni şifreyi güncelle
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      })

      if (updateError) throw updateError

      notifications.show({
        title: 'Başarılı',
        message: 'Şifreniz güncellendi',
        color: 'green',
      })

      passwordForm.reset()
    } catch (error) {
      console.error('Password change error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Şifre değiştirilirken hata oluştu',
        color: 'red',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      notifications.show({
        title: 'Çıkış',
        message: 'Başarıyla çıkış yapıldı',
        color: 'blue',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red'
      case 'garson':
        return 'blue'
      case 'mutfak':
        return 'green'
      default:
        return 'gray'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin - Sistem Yöneticisi'
      case 'garson':
        return 'Garson - Sipariş Alma'
      case 'mutfak':
        return 'Mutfak - Sipariş Hazırlama'
      default:
        return role
    }
  }

  return (
    <DashboardLayout>
      <Stack gap="lg">
        <div>
          <Title order={1}>
            <IconSettings size="2rem" style={{ marginRight: 8 }} />
            Ayarlar
          </Title>
          <Text c="dimmed">Hesap ayarlarınızı yönetin</Text>
        </div>

        {/* Profil Bilgileri */}
        <Card withBorder>
          <Stack gap="md">
            <Group>
              <IconUser size="1.5rem" />
              <Title order={3}>Profil Bilgileri</Title>
            </Group>

            <form onSubmit={profileForm.onSubmit(handleProfileUpdate)}>
              <Stack gap="md">
                <TextInput
                  label="Ad Soyad"
                  placeholder="Adınızı ve soyadınızı girin"
                  required
                  {...profileForm.getInputProps('full_name')}
                />

                <TextInput
                  label="Email"
                  value={user?.email}
                  disabled
                  description="Email adresiniz admin tarafından değiştirilebilir"
                />

                <div>
                  <Text size="sm" fw={500} mb="xs">Rol</Text>
                  <Badge color={getRoleColor(user?.role || '')} variant="light" size="lg">
                    {getRoleText(user?.role || '')}
                  </Badge>
                  <Text size="xs" c="dimmed" mt="xs">
                    Rolünüz admin tarafından değiştirilebilir
                  </Text>
                </div>

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    loading={profileLoading}
                    leftSection={<IconCheck size="1rem" />}
                  >
                    Profili Güncelle
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>

        {/* Şifre Değiştirme */}
        <Card withBorder>
          <Stack gap="md">
            <Group>
              <IconLock size="1.5rem" />
              <Title order={3}>Şifre Değiştir</Title>
            </Group>

            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
              Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.
            </Alert>

            <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
              <Stack gap="md">
                <PasswordInput
                  label="Mevcut Şifre"
                  placeholder="Mevcut şifrenizi girin"
                  required
                  {...passwordForm.getInputProps('currentPassword')}
                />

                <PasswordInput
                  label="Yeni Şifre"
                  placeholder="En az 6 karakter"
                  required
                  {...passwordForm.getInputProps('newPassword')}
                />

                <PasswordInput
                  label="Yeni Şifre Tekrar"
                  placeholder="Yeni şifrenizi tekrar girin"
                  required
                  {...passwordForm.getInputProps('confirmPassword')}
                />

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    loading={passwordLoading}
                    color="orange"
                    leftSection={<IconLock size="1rem" />}
                  >
                    Şifreyi Değiştir
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>

        {/* Hesap İşlemleri */}
        <Card withBorder>
          <Stack gap="md">
            <Group>
              <IconShield size="1.5rem" />
              <Title order={3}>Hesap İşlemleri</Title>
            </Group>

            <Divider />

            <Group justify="space-between">
              <div>
                <Text fw={500}>Çıkış Yap</Text>
                <Text size="sm" c="dimmed">
                  Hesabınızdan güvenli bir şekilde çıkış yapın
                </Text>
              </div>
              <Button
                variant="outline"
                color="red"
                onClick={handleLogout}
              >
                Çıkış Yap
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Sistem Bilgileri */}
        <Card withBorder>
          <Stack gap="md">
            <Title order={3}>Sistem Bilgileri</Title>
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Cafe POS Sistemi</Text>
              <Badge variant="light">v1.0.0</Badge>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Son Giriş</Text>
              <Text size="sm">{new Date().toLocaleString('tr-TR')}</Text>
            </Group>
            
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Hesap Oluşturma</Text>
              <Text size="sm">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
              </Text>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </DashboardLayout>
  )
} 