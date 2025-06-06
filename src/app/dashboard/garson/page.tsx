'use client'

import { useEffect, useState } from 'react'
import {
  Grid,
  Card,
  Text,
  Title,
  Group,
  Stack,
  SimpleGrid,
  Badge,
  Button,
  ActionIcon,
  Alert,
} from '@mantine/core'
import {
  IconTable,
  IconPlus,
  IconRefresh,
  IconUser,
  IconClock,
  IconAlertCircle,
} from '@tabler/icons-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Table = {
  id: string
  table_number: number
  capacity: number
  status: 'empty' | 'occupied' | 'reserved'
  created_at: string
  updated_at: string
}

type Order = {
  id: string
  table_id: string
  status: 'active' | 'ready' | 'completed' | 'cancelled'
  total_amount: number
  created_at: string
}

export default function GarsonDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Masalar
      const { data: tablesData } = await supabase
        .from('tables')
        .select('*')
        .order('table_number')
      
      // Aktif siparişler (active ve ready durumlarındaki)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['active', 'ready'])
        .order('created_at', { ascending: false })

      setTables(tablesData || [])
      setOrders(ordersData || [])
    } catch (error) {
      console.error('Data fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Real-time güncellemeler
    const supabase = createClient()
    const subscription = supabase
      .channel('garson-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => fetchData()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getTableStatus = (table: Table) => {
    const hasActiveOrder = orders.some(order => order.table_id === table.id)
    
    if (hasActiveOrder) {
      return { status: 'occupied', color: 'red', text: 'Dolu' }
    }
    
    switch (table.status) {
      case 'occupied':
        return { status: 'occupied', color: 'red', text: 'Dolu' }
      case 'reserved':
        return { status: 'reserved', color: 'yellow', text: 'Rezerve' }
      default:
        return { status: 'empty', color: 'green', text: 'Boş' }
    }
  }

  const handleNewOrder = (tableId: string) => {
    router.push(`/dashboard/garson/new-order?table=${tableId}`)
  }

  const emptyTables = tables.filter(table => getTableStatus(table).status === 'empty')
  const occupiedTables = tables.filter(table => getTableStatus(table).status === 'occupied')
  const reservedTables = tables.filter(table => getTableStatus(table).status === 'reserved')

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>
              <IconUser size="2rem" style={{ marginRight: 8 }} />
              Garson Paneli
            </Title>
            <Text c="dimmed">Hoş geldiniz, {user?.full_name} - Sipariş Alma</Text>
          </div>
          <ActionIcon
            variant="outline"
            size="lg"
            onClick={fetchData}
            loading={loading}
          >
            <IconRefresh size="1.1rem" />
          </ActionIcon>
        </Group>

        {/* Özet Kartlar */}
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Card withBorder
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '12px',
                '&:hover': {
                  transform: 'scale(1.05)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.borderRadius = '16px'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.borderRadius = '12px'
                e.currentTarget.style.boxShadow = 'none'
              }}>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={700}>Boş Masalar</Text>
                <Text fw={700} size="xl" c="green">{emptyTables.length}</Text>
              </div>
              <IconTable color="green" size="1.5rem" />
            </Group>
          </Card>

          <Card withBorder
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '12px',
                '&:hover': {
                  transform: 'scale(1.05)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.borderRadius = '16px'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.borderRadius = '12px'
                e.currentTarget.style.boxShadow = 'none'
              }}>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={700}>Dolu Masalar</Text>
                <Text fw={700} size="xl" c="red">{occupiedTables.length}</Text>
              </div>
              <IconTable color="red" size="1.5rem" />
            </Group>
          </Card>

          <Card withBorder
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '12px',
                '&:hover': {
                  transform: 'scale(1.05)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.borderRadius = '16px'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.borderRadius = '12px'
                e.currentTarget.style.boxShadow = 'none'
              }}>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={700}>Rezerve</Text>
                <Text fw={700} size="xl" c="yellow">{reservedTables.length}</Text>
              </div>
              <IconTable color="orange" size="1.5rem" />
            </Group>
          </Card>

          <Card withBorder
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '12px',
                '&:hover': {
                  transform: 'scale(1.05)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.borderRadius = '16px'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.borderRadius = '12px'
                e.currentTarget.style.boxShadow = 'none'
              }}>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={700}>Aktif Sipariş</Text>
                <Text fw={700} size="xl" c="blue">{orders.length}</Text>
              </div>
              <IconClock color="blue" size="1.5rem" />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Hızlı Aksiyonlar */}
        <Card >
          <Title order={3} mb="md">Hızlı İşlemler</Title>
          <Group>
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => router.push('/dashboard/garson/new-order')}
              disabled={emptyTables.length === 0}
            >
              Yeni Sipariş
            </Button>
            <Button
              variant="outline"
              leftSection={<IconTable size="1rem" />}
              onClick={() => router.push('/dashboard/tables')}
            >
              Masa Durumu
            </Button>
          </Group>
          {emptyTables.length === 0 && (
            <Alert icon={<IconAlertCircle size="1rem" />} color="orange" mt="md">
              Şu anda boş masa bulunmuyor. Yeni sipariş alabilmek için bir masanın boşalmasını bekleyin.
            </Alert>
          )}
        </Card>

        {/* Masa Durumu */}
        <Grid>
          <Grid.Col span={12}>
            <Card >
              <Title order={3} mb="md">Masa Durumu</Title>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }}>
                {tables.map((table) => {
                  const tableStatus = getTableStatus(table)
                  return (
                    <Card key={table.id} withBorder
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: '12px',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        borderRadius: '16px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.borderRadius = '16px'
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.borderRadius = '12px'
                      e.currentTarget.style.boxShadow = 'none'
                    }} p="sm">
                      <Stack gap="xs" align="center">
                        <Group gap="xs">
                          <IconTable size="1.2rem" />
                          <Text fw={600}>Masa {table.table_number}</Text>
                        </Group>
                        
                        <Badge color={tableStatus.color} variant="filled" size="sm">
                          {tableStatus.text}
                        </Badge>
                        
                        <Text size="xs" c="dimmed">
                          {table.capacity} kişilik
                        </Text>

                        {tableStatus.status === 'empty' && (
                          <Button
                            size="xs"
                            fullWidth
                            onClick={() => handleNewOrder(table.id)}
                          >
                            Sipariş Al
                          </Button>
                        )}

                        {tableStatus.status === 'occupied' && (
                          <Button
                            size="xs"
                            variant="outline"
                            fullWidth
                            onClick={() => router.push(`/dashboard/garson/order-details?table=${table.id}`)}
                          >
                            Detaylar
                          </Button>
                        )}
                      </Stack>
                    </Card>
                  )
                })}
              </SimpleGrid>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Son Siparişler */}
        {orders.length > 0 && (
          <Card withBorder>
            <Title order={3} mb="md">Son Aktif Siparişler</Title>
            <Stack gap="xs">
              {orders.slice(0, 5).map((order) => {
                const table = tables.find(t => t.id === order.table_id)
                return (
                  <Group key={order.id} justify="space-between" p="sm" style={{ border: '1px solid #e9ecef', borderRadius: '8px' }}>
                    <div>
                      <Text fw={500}>Masa {table?.table_number || 'Bilinmiyor'}</Text>
                      <Text size="sm" c="dimmed">
                        {new Date(order.created_at).toLocaleString('tr-TR')}
                      </Text>
                    </div>
                    <Group gap="md">
                      <Text fw={600} c="green">₺{order.total_amount.toFixed(2)}</Text>
                      <Badge color="blue" variant="light">Aktif</Badge>
                    </Group>
                  </Group>
                )
              })}
            </Stack>
          </Card>
        )}
      </Stack>
    </DashboardLayout>
  )
} 