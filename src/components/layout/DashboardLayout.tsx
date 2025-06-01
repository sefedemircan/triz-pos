'use client'

import {
  AppShell,
  Text,
  Group,
  Button,
  ActionIcon,
  Avatar,
  Menu,
  Badge,
  Burger,
  Center,
  Loader,
  Stack,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconHome,
  IconTable,
  IconUsers,
  IconChefHat,
  IconSettings,
  IconLogout,
  IconBell,
  IconCategory,
  IconShield,
  IconUser,
  IconPlus,
} from '@tabler/icons-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { notifications } from '@mantine/notifications'
import { useEffect } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Rol tabanlı navigasyon menüleri
const getNavigationByRole = (role: string) => {
  switch (role) {
    case 'admin':
      return [
        { label: 'Admin Dashboard', href: '/dashboard/admin', icon: IconShield },
        { label: 'Masalar', href: '/dashboard/tables', icon: IconTable },
        { label: 'Kategoriler', href: '/dashboard/categories', icon: IconCategory },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat },
        { label: 'Mutfak Paneli', href: '/dashboard/kitchen', icon: IconChefHat },
        { label: 'Personel Yönetimi', href: '/dashboard/staff', icon: IconUsers },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings },
      ]
    
    case 'garson':
      return [
        { label: 'Garson Paneli', href: '/dashboard/garson', icon: IconUser },
        { label: 'Yeni Sipariş', href: '/dashboard/garson/new-order', icon: IconPlus },
        { label: 'Masa Durumu', href: '/dashboard/tables', icon: IconTable },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings },
      ]
    
    case 'mutfak':
      return [
        { label: 'Mutfak Paneli', href: '/dashboard/mutfak', icon: IconChefHat },
        { label: 'Aktif Siparişler', href: '/dashboard/kitchen', icon: IconChefHat },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings },
      ]
    
    default:
      return [
        { label: 'Dashboard', href: '/dashboard', icon: IconHome },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings },
      ]
  }
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [opened, { toggle }] = useDisclosure()
  const { user, authUser, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Auth durumunu kontrol et
  useEffect(() => {
    console.log('DashboardLayout - Auth state:', { 
      hasUser: !!user, 
      hasAuthUser: !!authUser, 
      loading,
      userEmail: user?.email || authUser?.email || 'none'
    })

    // Loading bittikten sonra kullanıcı yoksa login'e yönlendir
    if (!loading && !user && !authUser) {
      console.log('DashboardLayout - No user found, redirecting to login')
      router.push('/login')
    }
  }, [user, authUser, loading, router])

  const handleLogout = async () => {
    console.log('Logout işlemi başlatılıyor...')
    try {
      await signOut()
      
      console.log('Router ile login\'e yönlendiriliyor...')
      router.push('/login')
      
      notifications.show({
        title: 'Çıkış',
        message: 'Başarıyla çıkış yapıldı',
        color: 'blue',
      })
    } catch (error) {
      console.error('Logout error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Çıkış yapılırken bir hata oluştu',
        color: 'red',
      })
    }
  }

  // Loading durumunda
  if (loading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text size="sm" c="dimmed">Dashboard yükleniyor...</Text>
        </Stack>
      </Center>
    )
  }

  // User yoksa (bu durumda useEffect redirect eder ama görsel feedback için)
  if (!user && !authUser) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Text size="sm" c="dimmed">Yönlendiriliyor...</Text>
        </Stack>
      </Center>
    )
  }

  // User profili yok ama auth user var (geçici durum)
  const displayUser = user || {
    full_name: authUser?.email?.split('@')[0] || 'User',
    role: 'loading...',
    email: authUser?.email || 'unknown'
  }

  // Kullanıcının rolüne göre navigasyon menüsünü al
  const navigation = getNavigationByRole(displayUser.role || 'garson')

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'garson':
        return 'Garson'
      case 'mutfak':
        return 'Mutfak'
      default:
        return role
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

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">Cafe POS</Text>
            <Badge color={getRoleColor(displayUser.role || '')} variant="light" size="sm">
              {getRoleText(displayUser.role || '')}
            </Badge>
          </Group>

          <Group>
            <ActionIcon variant="light" size="lg" radius="md">
              <IconBell size="1.1rem" />
            </ActionIcon>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="light" size="lg" radius="md">
                  <Avatar size="sm" radius="xl">
                    {displayUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>
                  {displayUser.full_name || 'Kullanıcı'}
                  <Badge size="xs" variant="light" ml="xs" color={getRoleColor(displayUser.role || '')}>
                    {getRoleText(displayUser.role || '')}
                  </Badge>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item 
                  leftSection={<IconSettings size={14} />}
                  onClick={() => router.push('/dashboard/settings')}
                >
                  Ayarlar
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  color="red"
                  onClick={handleLogout}
                >
                  Çıkış Yap
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text fw={500} size="sm" mb="md" c="dimmed">
          {getRoleText(displayUser.role || '')} Paneli
        </Text>
        
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant={isActive ? 'filled' : 'subtle'}
              leftSection={<item.icon size="1rem" />}
              justify="flex-start"
              fullWidth
              mb="xs"
              onClick={() => router.push(item.href)}
            >
              {item.label}
            </Button>
          )
        })}
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  )
} 