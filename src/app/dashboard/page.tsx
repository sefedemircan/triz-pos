'use client'

import { useEffect, useState } from 'react'
import {
  Grid,
  Card,
  Text,
  Title,
  Group,
  ThemeIcon,
  Stack,
  SimpleGrid,
  Badge,
  Progress,
  ActionIcon,
} from '@mantine/core'
import {
  IconUsers,
  IconChefHat,
  IconCurrencyLira,
  IconTable,
  IconRefresh,
} from '@tabler/icons-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  totalTables: number
  occupiedTables: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTables: 0,
    occupiedTables: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const supabase = createClient()
      
      // Masalar
      const { data: tables } = await supabase
        .from('tables')
        .select('*')
      
      // Siparişler
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
      
      const totalTables = tables?.length || 0
      const occupiedTables = tables?.filter(t => t.status === 'occupied').length || 0
      const totalOrders = orders?.length || 0
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      setStats({
        totalTables,
        occupiedTables,
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
      })
    } catch (error) {
      console.error('Stats fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Toplam Masa',
      value: stats.totalTables,
      icon: IconTable,
      color: 'blue',
    },
    {
      title: 'Dolu Masa',
      value: stats.occupiedTables,
      icon: IconUsers,
      color: 'green',
    },
    {
      title: 'Toplam Sipariş',
      value: stats.totalOrders,
      icon: IconChefHat,
      color: 'orange',
    },
    {
      title: 'Toplam Gelir',
      value: `₺${stats.totalRevenue.toFixed(2)}`,
      icon: IconCurrencyLira,
      color: 'red',
    },
  ]

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>Dashboard</Title>
            <Text c="dimmed">Hoş geldiniz, {user?.full_name}</Text>
          </div>
          <ActionIcon
            variant="outline"
            size="lg"
            onClick={fetchStats}
            loading={loading}
          >
            <IconRefresh size="1.1rem" />
          </ActionIcon>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {statCards.map((stat) => (
            <Card key={stat.title} withBorder>
              <Group justify="space-between">
                <div>
                  <Text size="sm" c="dimmed" fw={700}>
                    {stat.title}
                  </Text>
                  <Text fw={700} size="xl">
                    {stat.value}
                  </Text>
                </div>
                <ThemeIcon
                  color={stat.color}
                  variant="light"
                  size="lg"
                  radius="md"
                >
                  <stat.icon size="1.4rem" />
                </ThemeIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder>
              <Title order={3} mb="md">Masa Durumu</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Dolu Masalar</Text>
                  <Badge variant="filled" color="green">
                    {stats.occupiedTables}/{stats.totalTables}
                  </Badge>
                </Group>
                <Progress
                  value={stats.totalTables ? (stats.occupiedTables / stats.totalTables) * 100 : 0}
                  color="green"
                />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder>
              <Title order={3} mb="md">Sipariş Durumu</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Bekleyen</Text>
                  <Badge variant="filled" color="orange">
                    {stats.pendingOrders}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Tamamlanan</Text>
                  <Badge variant="filled" color="green">
                    {stats.completedOrders}
                  </Badge>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </DashboardLayout>
  )
} 