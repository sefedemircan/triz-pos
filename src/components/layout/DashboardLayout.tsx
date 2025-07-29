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
  Image,
  Burger,
  Center,
  Loader,
  Stack,
  Box,
  Transition,
  Tooltip,
  Divider,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
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
  IconClipboardList,
  IconBox,
  IconCoffee,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconDashboard,
  IconBuilding,
} from '@tabler/icons-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Rol tabanlı navigasyon menüleri - Kurumsal tema
const getNavigationByRole = (role: string) => {
  switch (role) {
    case 'admin':
      return [
        { label: 'Dashboard', href: '/dashboard/admin', icon: IconDashboard, color: 'gray' },
        { label: 'Sipariş Yönetimi', href: '/dashboard/admin/orders', icon: IconClipboardList, color: 'gray' },
        { label: 'Stok Yönetimi', href: '/dashboard/admin/stock', icon: IconBox, color: 'gray' },
        { label: 'Masalar', href: '/dashboard/tables', icon: IconTable, color: 'gray' },
        { label: 'Kategoriler', href: '/dashboard/categories', icon: IconCategory, color: 'gray' },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat, color: 'gray' },
        { label: 'Mutfak Paneli', href: '/dashboard/kitchen', icon: IconChefHat, color: 'gray' },
        { label: 'Kullanıcılar', href: '/dashboard/staff', icon: IconUsers, color: 'gray' },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings, color: 'gray' },
      ]
    
    case 'garson':
      return [
        { label: 'Garson Paneli', href: '/dashboard/garson', icon: IconUser, color: 'gray' },
        { label: 'Yeni Sipariş', href: '/dashboard/garson/new-order', icon: IconPlus, color: 'gray' },
        { label: 'Masa Durumu', href: '/dashboard/tables', icon: IconTable, color: 'gray' },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat, color: 'gray' },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings, color: 'gray' },
      ]
    
    case 'mutfak':
      return [
        { label: 'Mutfak Paneli', href: '/dashboard/mutfak', icon: IconChefHat, color: 'gray' },
        { label: 'Aktif Siparişler', href: '/dashboard/kitchen', icon: IconChefHat, color: 'gray' },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat, color: 'gray' },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings, color: 'gray' },
      ]
    
    default:
      return [
        { label: 'Dashboard', href: '/dashboard', icon: IconHome, color: 'gray' },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings, color: 'gray' },
      ]
  }
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [opened, { toggle }] = useDisclosure()
  const [mounted, setMounted] = useState(false)
  const { user, authUser, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  
  // Theme hooks
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })

  useEffect(() => {
    setMounted(true)
  }, [])

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
        color: 'orange',
        autoClose: 3000,
      })
    } catch (error) {
      console.error('Logout error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Çıkış yapılırken bir hata oluştu',
        color: 'red',
        autoClose: 5000,
      })
    }
  }

  const toggleColorScheme = () => {
    if (mounted) {
      setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')
    }
  }

  const getThemeIcon = () => {
    if (!mounted) return IconDeviceDesktop
    return computedColorScheme === 'dark' ? IconSun : IconMoon
  }

  const getThemeTooltip = () => {
    if (!mounted) return 'Sistem teması'
    return computedColorScheme === 'dark' ? 'Açık tema' : 'Koyu tema'
  }

  // Loading durumunda
  if (loading || !mounted) {
    return (
      <Center h="100vh" className="cafe-gradient-bg">
        <Stack align="center" gap="md" className="animate-fade-in">
          <IconCoffee size={64} color="white" className="animate-float" />
          <Loader size="lg" color="white" />
          <Text size="lg" c="orange" fw={600}>Cafe POS Yükleniyor...</Text>
          <Text size="sm" c="rgba(255,255,255,0.8)">Lütfen bekleyiniz</Text>
        </Stack>
      </Center>
    )
  }

  // User yoksa (bu durumda useEffect redirect eder ama görsel feedback için)
  if (!user && !authUser) {
    return (
      <Center h="100vh" className="cafe-gradient-bg">
        <Stack align="center" gap="md" className="animate-fade-in">
          <Text size="lg" c="white" fw={600}>Yönlendiriliyor...</Text>
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
        return 'orange'
      case 'garson':
        return 'orange'
      case 'mutfak':
        return 'green'
      default:
        return 'orange'
    }
  }

  const ThemeIcon = getThemeIcon()

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      style={{
        '--app-shell-background': 'var(--background-secondary)',
      }}
    >
      <AppShell.Header 
        style={{ 
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--background)',
          height: 70,
        }}
      >
        <Group h="100%" px="xl" justify="space-between">
          <Group gap="md">
            <Burger 
              opened={opened} 
              onClick={toggle} 
              hiddenFrom="sm" 
              size="sm" 
              color="var(--text-color)"
            />
            <Group gap="sm">
              <Box>
                <Image src="/logo.png" alt="TrizPOS" width={28} height={28} />
              </Box>
            </Group>
            <Badge 
              size="sm"
              variant="light"
              color="gray"
              style={{
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            >
              {getRoleText(displayUser.role || '')}
            </Badge>
          </Group>

          <Group gap="sm">
            {/* Theme Toggle Button */}
            <Tooltip label={getThemeTooltip()} position="bottom">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                radius="md"
                onClick={toggleColorScheme}
                style={{   
                  backgroundColor: 'transparent'
                }}
              >
                <ThemeIcon size="1.1rem" />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Bildirimler" position="bottom">
              <ActionIcon 
                variant="subtle" 
                color="gray"
                size="md" 
                radius="md"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                <IconBell size="1.1rem" />
              </ActionIcon>
            </Tooltip>

            <Menu shadow="md" width={250} radius="md">
              <Menu.Target>
                <ActionIcon 
                  variant="subtle" 
                  color="gray"
                  size="md" 
                  radius="md"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                >
                  <Avatar size="sm" radius="md" color="gray">
                    {displayUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown style={{ borderRadius: '8px' }}>
                <Menu.Label>
                  <Group gap="sm">
                    <Avatar size="sm" radius="md" color="gray">
                      {displayUser.full_name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                      <Text size="sm" fw={500}>{displayUser.full_name || 'Kullanıcı'}</Text>
                      <Text size="xs" c="dimmed">{displayUser.email}</Text>
                    </Box>
                  </Group>
                </Menu.Label>
                <Menu.Divider />
                <Menu.Item 
                  leftSection={<IconSettings size={16} />}
                  onClick={() => router.push('/dashboard/settings')}
                >
                  Ayarlar
                </Menu.Item>
                <Menu.Item
                  leftSection={<ThemeIcon size={16} />}
                  onClick={toggleColorScheme}
                >
                  {getThemeTooltip()}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
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

      <AppShell.Navbar 
        p="md"
        style={{
          background: 'var(--background)',
          borderRight: '1px solid var(--border-color)',
        }}
      >
        <Stack gap="md">
          {/* Kullanıcı Profili - Sade Tasarım */}
          <Box p="md" style={{ 
            background: 'var(--card-bg)', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}>
            <Group gap="md">
              <Avatar 
                size="md" 
                radius="md" 
                color="gray"
                style={{ border: '2px solid var(--border-color)' }}
              >
                {displayUser.full_name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box style={{ flex: 1 }}>
                <Text fw={600} size="sm" c="var(--text-color)">
                  {displayUser.full_name || 'Kullanıcı'}
                </Text>
                <Text size="xs" c="dimmed" style={{ marginTop: '2px' }}>
                  {getRoleText(displayUser.role || '')} • {displayUser.email}
                </Text>
              </Box>
            </Group>
          </Box>

          <Divider />

          {/* Navigasyon Menüsü - Kurumsal Tasarım */}
          <Stack gap="xs">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Transition
                  key={item.href}
                  mounted={mounted}
                  transition="slide-right"
                  duration={300}
                  timingFunction="ease"
                  exitDuration={150}
                >
                  {(styles) => (
                    <Tooltip label={item.label} position="right" disabled={opened}>
                      <Button
                        variant={isActive ? 'light' : 'subtle'}
                        color={isActive ? 'orange' : 'gray'}
                        leftSection={<item.icon size="1rem" />}
                        justify="flex-start"
                        fullWidth
                        radius="md"
                        size="sm"
                        onClick={() => router.push(item.href)}
                        style={{
                          ...styles,
                          animationDelay: `${index * 50}ms`,
                          transition: 'all 0.2s ease',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: '0.875rem',
                          height: '40px',
                          border: isActive ? '1px solid var(--orange-3)' : 'none',
                        }}
                      >
                        {item.label}
                      </Button>
                    </Tooltip>
                  )}
                </Transition>
              )
            })}
          </Stack>

          {/* Alt Bilgi */}
          <Box style={{ marginTop: 'auto', paddingTop: '1rem' }}>
            <Divider mb="md" />
            <Text size="xs" c="dimmed" ta="center" style={{ lineHeight: 1.4 }}>
              TrizPOS v1.0
              <br />
              © 2024 Triz Global
            </Text>
          </Box>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main 
        style={{
          background: 'var(--background)',
          minHeight: 'calc(100vh - 70px)',
        }}
      >
        <Transition
          mounted={mounted}
          transition="fade"
          duration={300}
          timingFunction="ease"
        >
          {(styles) => (
            <div style={styles}>
              {children}
            </div>
          )}
        </Transition>
      </AppShell.Main>
    </AppShell>
  )
} 