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
  Box,
  Transition,
  Tooltip,
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
} from '@tabler/icons-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

// Rol tabanlı navigasyon menüleri - Turuncu tema
const getNavigationByRole = (role: string) => {
  switch (role) {
    case 'admin':
      return [
        { label: 'Admin Dashboard', href: '/dashboard/admin', icon: IconShield, color: 'orange' },
        { label: 'Sipariş Yönetimi', href: '/dashboard/admin/orders', icon: IconClipboardList, color: 'orange' },
        { label: 'Stok Yönetimi', href: '/dashboard/admin/stock', icon: IconBox, color: 'orange' },
        { label: 'Masalar', href: '/dashboard/tables', icon: IconTable, color: 'orange' },
        { label: 'Kategoriler', href: '/dashboard/categories', icon: IconCategory, color: 'orange' },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat, color: 'orange' },
        { label: 'Mutfak Paneli', href: '/dashboard/kitchen', icon: IconChefHat, color: 'orange' },
        { label: 'Kullanıcılar', href: '/dashboard/staff', icon: IconUsers, color: 'orange' },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings, color: 'orange' },
      ]
    
    case 'garson':
      return [
        { label: 'Garson Paneli', href: '/dashboard/garson', icon: IconUser, color: 'orange' },
        { label: 'Yeni Sipariş', href: '/dashboard/garson/new-order', icon: IconPlus, color: 'orange' },
        { label: 'Masa Durumu', href: '/dashboard/tables', icon: IconTable, color: 'orange' },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat, color: 'orange' },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings, color: 'orange' },
      ]
    
    case 'mutfak':
      return [
        { label: 'Mutfak Paneli', href: '/dashboard/mutfak', icon: IconChefHat, color: 'green' },
        { label: 'Aktif Siparişler', href: '/dashboard/kitchen', icon: IconChefHat, color: 'green' },
        { label: 'Ürünler', href: '/dashboard/products', icon: IconChefHat, color: 'orange' },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings, color: 'orange' },
      ]
    
    default:
      return [
        { label: 'Dashboard', href: '/dashboard', icon: IconHome, color: 'orange' },
        { label: 'Ayarlar', href: '/dashboard/settings', icon: IconSettings, color: 'orange' },
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
      header={{ height: 80 }}
      navbar={{ width: 320, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
      style={{
        '--app-shell-background': 'var(--background-secondary)',
      }}
    >
      <AppShell.Header className="cafe-gradient-bg" style={{ borderBottom: 'none' }}>
        <Group h="100%" px="xl" justify="space-between">
          <Group gap="md">
            <Burger 
              opened={opened} 
              onClick={toggle} 
              hiddenFrom="sm" 
              size="sm" 
              color="white"
            />
            <Group gap="sm">
              <Box>
                <Text fw={700} size="xl" c="orange">Cafe POS</Text>
                <Text size="sm" c="orange" fw={600}>Modern Kafe Yönetim Sistemi</Text>
              </Box>
            </Group>
            <Badge 
              size="lg"
              variant="filled"
              c={computedColorScheme === 'dark' ? 'white' : 'var(--cafe-primary)'}
              style={{
                background: 'rgba(205, 201, 201, 0.25)',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(10px)',
                fontWeight: 600,
              }}
              className="glass-effect"
            >
              {getRoleText(displayUser.role || '')}
            </Badge>
          </Group>

          <Group gap="sm">
            {/* Theme Toggle Button */}
            <Tooltip label={getThemeTooltip()} position="bottom">
              <ActionIcon
                variant="subtle"
                c={computedColorScheme === 'dark' ? 'white' : 'var(--cafe-primary)'}
                size="xl"
                radius="md"
                onClick={toggleColorScheme}
                className="hover-scale theme-toggle"
                style={{   
                  backgroundColor: 'transparent'
                }}
              >
                <ThemeIcon size="1.3rem" />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Bildirimler" position="bottom">
              <ActionIcon 
                variant="subtle" 
                c={computedColorScheme === 'dark' ? 'white' : 'var(--cafe-primary)'}
                size="xl" 
                radius="md"
                className="hover-scale"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                <IconBell size="1.3rem" />
              </ActionIcon>
            </Tooltip>

            <Menu shadow="xl" width={250} radius="lg">
              <Menu.Target>
                <ActionIcon 
                  variant="subtle" 
                  c={computedColorScheme === 'dark' ? 'white' : 'var(--cafe-primary)'}
                  size="xl" 
                  radius="md"
                  className="hover-scale"
                  style={{
                    backgroundColor: 'transparent',
                  }}
                >
                  <Avatar size="md" radius="xl" color="orange">
                    {displayUser.full_name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown style={{ borderRadius: '16px' }}>
                <Menu.Label>
                  <Group gap="sm">
                    <Avatar size="sm" radius="xl" color="orange">
                      {displayUser.full_name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                      <Text size="sm" fw={600}>{displayUser.full_name || 'Kullanıcı'}</Text>
                      <Badge size="xs" variant="light" color="orange">
                        {getRoleText(displayUser.role || '')}
                      </Badge>
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
          background: 'var(--card-bg)',
          borderRight: '2px solid var(--card-border)',
        }}
      >
        <Stack gap="xs">
          <Group mb="lg" p="md" className="cafe-gradient-light" style={{ borderRadius: '12px' }}>
            <Avatar 
              size="lg" 
              radius="md" 
              color="orange"
              className="hover-glow"
            >
              {displayUser.full_name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Text fw={600} size="md" c="var(--cafe-primary)">{displayUser.full_name || 'Kullanıcı'}</Text>
              <Text size="sm" c="var(--cafe-primary-dark)">{getRoleText(displayUser.role || '')} Paneli</Text>
            </Box>
          </Group>
          
          {navigation.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <Transition
                key={item.href}
                mounted={mounted}
                transition="slide-right"
                duration={400}
                timingFunction="ease"
                exitDuration={200}
              >
                {(styles) => (
                  <Tooltip label={item.label} position="right" disabled={opened}>
                    <Button
                      variant={isActive ? 'filled' : 'subtle'}
                      color={item.color}
                      leftSection={<item.icon size="1.2rem" />}
                      justify="flex-start"
                      fullWidth
                      radius="md"
                      size="md"
                      onClick={() => router.push(item.href)}
                      style={{
                        ...styles,
                        animationDelay: `${index * 100}ms`,
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isActive ? 'translateX(8px)' : 'translateX(0)',
                        boxShadow: isActive ? 'var(--card-shadow-active)' : 'none',
                        fontWeight: isActive ? 600 : 500,
                      }}
                      className={`animate-slide-in-up ${isActive ? 'cafe-card-active' : 'hover-lift'}`}
                    >
                      {item.label}
                    </Button>
                  </Tooltip>
                )}
              </Transition>
            )
          })}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main 
        style={{
          background: 'var(--background)',
          minHeight: 'calc(100vh - 80px)',
        }}
      >
        <Transition
          mounted={mounted}
          transition="fade"
          duration={500}
          timingFunction="ease"
        >
          {(styles) => (
            <div style={styles} className="animate-fade-in">
              {children}
            </div>
          )}
        </Transition>
      </AppShell.Main>
    </AppShell>
  )
} 