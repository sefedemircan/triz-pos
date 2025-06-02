'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Button,
  Divider,
} from '@mantine/core'
import {
  IconUsers,
  IconChefHat,
  IconCurrencyLira,
  IconTable,
  IconRefresh,
  IconShield,
  IconClipboardList,
  IconUserCog,
  IconCash,
  IconEye,
  IconBell,
} from '@tabler/icons-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { PaymentModal } from '@/components/PaymentModal'
import { notifications } from '@mantine/notifications'
import type { Database } from '@/lib/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Table = Database['public']['Tables']['tables']['Row']
type User = Database['public']['Tables']['users']['Row']

interface OrderWithDetails extends Order {
  tables?: Table
  users?: User
  order_items: (OrderItem & {
    products?: Product
  })[]
}

interface TableWithOrder extends Table {
  current_order?: OrderWithDetails
}

interface DashboardStats {
  totalTables: number
  occupiedTables: number
  emptyTables: number
  reservedTables: number
  totalOrders: number
  totalRevenue: number
  activeOrders: number
  readyOrders: number
  completedOrders: number
  totalUsers: number
  totalProducts: number
}

interface PaymentData {
  paymentMethod: 'cash' | 'card'
  receivedAmount?: number
  changeAmount?: number
  notes?: string
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalTables: 0,
    occupiedTables: 0,
    emptyTables: 0,
    reservedTables: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
  })
  const [tables, setTables] = useState<TableWithOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentModalOpened, setPaymentModalOpened] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState<OrderWithDetails | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Masalar ve aktif siparişleri al
      const { data: tablesData } = await supabase
        .from('tables')
        .select('*')
        .order('table_number')
      
      // Aktif ve hazır siparişleri al
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          *,
          tables (
            id,
            table_number,
            capacity
          ),
          users (
            id,
            full_name,
            role
          ),
          order_items (
            *,
            products (
              id,
              name,
              price
            )
          )
        `)
        .in('status', ['active', 'ready'])
        .order('created_at', { ascending: false })
      
      // Tüm siparişleri al (istatistikler için)
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
      
      // Kullanıcılar
      const { data: users } = await supabase
        .from('users')
        .select('*')
      
      // Ürünler
      const { data: products } = await supabase
        .from('products')
        .select('*')

      // Masalara siparişleri ata
      const tablesWithOrders: TableWithOrder[] = (tablesData || []).map(table => {
        const currentOrder = (ordersData || []).find(order => order.table_id === table.id)
        return {
          ...table,
          current_order: currentOrder
        }
      })

      setTables(tablesWithOrders)

      // İstatistikleri hesapla
      const totalTables = tablesData?.length || 0
      const occupiedTables = tablesWithOrders.filter(t => t.current_order).length
      const emptyTables = tablesWithOrders.filter(t => !t.current_order && t.status === 'empty').length
      const reservedTables = tablesWithOrders.filter(t => !t.current_order && t.status === 'reserved').length
      const totalOrders = allOrders?.length || 0
      const activeOrders = ordersData?.filter(o => o.status === 'active').length || 0
      const readyOrders = ordersData?.filter(o => o.status === 'ready').length || 0
      const completedOrders = allOrders?.filter(o => o.status === 'completed').length || 0
      const totalRevenue = allOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const totalUsers = users?.length || 0
      const totalProducts = products?.length || 0

      setStats({
        totalTables,
        occupiedTables,
        emptyTables,
        reservedTables,
        totalOrders,
        totalRevenue,
        activeOrders,
        readyOrders,
        completedOrders,
        totalUsers,
        totalProducts,
      })
    } catch (error) {
      console.error('Stats fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Real-time güncellemeler için subscription
    const supabase = createClient()
    const subscription = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handlePaymentRequest = (order: OrderWithDetails) => {
    setPaymentOrder(order)
    setPaymentModalOpened(true)
  }

  const handlePaymentComplete = async (orderId: string, paymentData: PaymentData) => {
    setPaymentLoading(true)
    try {
      const supabase = createClient()
      
      // Ödeme notunu hazırla
      const paymentNote = [
        `Ödeme: ${paymentData.paymentMethod === 'cash' ? 'Nakit' : 'Kart'}`,
        paymentData.receivedAmount ? `Alınan: ₺${paymentData.receivedAmount.toFixed(2)}` : null,
        paymentData.changeAmount ? `Para Üstü: ₺${paymentData.changeAmount.toFixed(2)}` : null,
        paymentData.notes ? `Not: ${paymentData.notes}` : null,
      ].filter(Boolean).join(' | ')

      const order = paymentOrder
      const updatedNotes = order?.notes ? 
        `${order.notes}\n\n${paymentNote}` : 
        paymentNote

      // 1. Siparişi completed olarak işaretle ve ödeme bilgilerini ekle
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          payment_method: paymentData.paymentMethod,
          notes: updatedNotes,
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // 2. Masayı boşalt
      if (order?.table_id) {
        const { error: tableError } = await supabase
          .from('tables')
          .update({ status: 'empty' })
          .eq('id', order.table_id)

        if (tableError) throw tableError
      }

      notifications.show({
        title: 'Başarılı',
        message: 'Ödeme işlemi tamamlandı ve masa boşaltıldı',
        color: 'green',
      })

      // UI'ı güncelle
      setPaymentModalOpened(false)
      setPaymentOrder(null)
      fetchData()

    } catch (error) {
      console.error('Payment error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Ödeme işlemi sırasında hata oluştu',
        color: 'red',
      })
    } finally {
      setPaymentLoading(false)
    }
  }

  const getTableStatusColor = (table: TableWithOrder) => {
    if (table.current_order) {
      return table.current_order.status === 'ready' ? 'blue' : 'orange'
    }
    switch (table.status) {
      case 'occupied': return 'red'
      case 'reserved': return 'yellow'
      default: return 'green'
    }
  }

  const getTableStatusText = (table: TableWithOrder) => {
    if (table.current_order) {
      return table.current_order.status === 'ready' ? 'Hazır' : 'Hazırlanıyor'
    }
    switch (table.status) {
      case 'occupied': return 'Dolu'
      case 'reserved': return 'Rezerve'
      default: return 'Boş'
    }
  }

  const statCards = [
    {
      title: 'Toplam Masa',
      value: stats.totalTables,
      icon: IconTable,
      color: 'blue',
    },
    {
      title: 'Dolu Masalar',
      value: stats.occupiedTables,
      icon: IconUsers,
      color: 'red',
    },
    {
      title: 'Boş Masalar',
      value: stats.emptyTables,
      icon: IconTable,
      color: 'green',
    },
    {
      title: 'Aktif Siparişler',
      value: stats.activeOrders,
      icon: IconChefHat,
      color: 'orange',
    },
    {
      title: 'Hazır Siparişler',
      value: stats.readyOrders,
      icon: IconBell,
      color: 'blue',
    },
    {
      title: 'Toplam Gelir',
      value: `₺${stats.totalRevenue.toFixed(2)}`,
      icon: IconCurrencyLira,
      color: 'green',
    },
  ]

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>
              <IconShield size="2rem" style={{ marginRight: 8 }} />
              Admin Dashboard
            </Title>
            <Text c="dimmed">Hoş geldiniz, {user?.full_name} - Sistem Yöneticisi</Text>
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

        {/* İstatistik Kartları */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
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

        {/* Masalar Bölümü */}
        <Card withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>Masa Durumu ve Ödeme İşlemleri</Title>
            <Button
              variant="outline"
              leftSection={<IconTable size="1rem" />}
              onClick={() => router.push('/dashboard/tables')}
            >
              Masa Yönetimi
            </Button>
          </Group>
          
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }}>
            {tables.map((table) => {
              const statusColor = getTableStatusColor(table)
              const statusText = getTableStatusText(table)
              
              return (
                <Card key={table.id} withBorder p="sm">
                  <Stack gap="xs" align="center">
                    <Group gap="xs">
                      <IconTable size="1.2rem" />
                      <Text fw={600}>Masa {table.table_number}</Text>
                    </Group>
                    
                    <Badge color={statusColor} variant="filled" size="sm">
                      {statusText}
                    </Badge>
                    
                    <Text size="xs" c="dimmed">
                      {table.capacity} kişilik
                    </Text>

                    {table.current_order && (
                      <>
                        <Divider style={{ width: '100%' }} />
                        <Text size="xs" fw={500} c="green">
                          ₺{table.current_order.total_amount.toFixed(2)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {table.current_order.users?.full_name || 'Garson'}
                        </Text>
                        
                        <Group gap="xs">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="blue"
                            onClick={() => router.push(`/dashboard/admin/orders`)}
                          >
                            <IconEye size="0.8rem" />
                          </ActionIcon>
                          
                          {(table.current_order.status === 'ready' || table.current_order.status === 'active') && (
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="green"
                              onClick={() => handlePaymentRequest(table.current_order!)}
                            >
                              <IconCash size="0.8rem" />
                            </ActionIcon>
                          )}
                        </Group>
                      </>
                    )}

                    {!table.current_order && table.status === 'empty' && (
                      <Text size="xs" c="green" fw={500}>
                        Müsait
                      </Text>
                    )}
                  </Stack>
                </Card>
              )
            })}
          </SimpleGrid>
        </Card>

        {/* Performans Özeti */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder>
              <Title order={3} mb="md">Masa Doluluk Oranı</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Dolu Masalar</Text>
                  <Badge variant="filled" color={stats.occupiedTables > stats.totalTables * 0.8 ? 'red' : 'green'}>
                    {stats.occupiedTables}/{stats.totalTables}
                  </Badge>
                </Group>
                <Progress
                  value={stats.totalTables ? (stats.occupiedTables / stats.totalTables) * 100 : 0}
                  color={stats.occupiedTables > stats.totalTables * 0.8 ? 'red' : 'green'}
                />
                <Text size="xs" c="dimmed">
                  Doluluk: %{stats.totalTables ? Math.round((stats.occupiedTables / stats.totalTables) * 100) : 0}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card withBorder>
              <Title order={3} mb="md">Sipariş Durumu</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">Hazırlanıyor</Text>
                  <Badge variant="filled" color="orange">
                    {stats.activeOrders}
                  </Badge>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Servise Hazır</Text>
                  <Badge variant="filled" color="blue">
                    {stats.readyOrders}
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

        {/* Hızlı Erişim */}
        <Card withBorder>
          <Title order={3} mb="md">Hızlı Erişim</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <Button
              variant="light"
              size="lg"
              leftSection={<IconClipboardList size="1.2rem" />}
              onClick={() => router.push('/dashboard/admin/orders')}
              style={{ height: 'auto', padding: '1rem' }}
            >
              <Stack gap="xs" align="center">
                <Text fw={600}>Sipariş Yönetimi</Text>
                <Text size="xs" c="dimmed">Detaylı sipariş takibi</Text>
              </Stack>
            </Button>
            
            <Button
              variant="light"
              size="lg"
              leftSection={<IconChefHat size="1.2rem" />}
              onClick={() => router.push('/dashboard/products')}
              style={{ height: 'auto', padding: '1rem' }}
            >
              <Stack gap="xs" align="center">
                <Text fw={600}>Ürün Yönetimi</Text>
                <Text size="xs" c="dimmed">Menü düzenleme</Text>
              </Stack>
            </Button>
            
            <Button
              variant="light"
              size="lg"
              leftSection={<IconUserCog size="1.2rem" />}
              onClick={() => router.push('/dashboard/staff')}
              style={{ height: 'auto', padding: '1rem' }}
            >
              <Stack gap="xs" align="center">
                <Text fw={600}>Personel</Text>
                <Text size="xs" c="dimmed">Kullanıcı yönetimi</Text>
              </Stack>
            </Button>
            
            <Button
              variant="light"
              size="lg"
              leftSection={<IconTable size="1.2rem" />}
              onClick={() => router.push('/dashboard/tables')}
              style={{ height: 'auto', padding: '1rem' }}
            >
              <Stack gap="xs" align="center">
                <Text fw={600}>Masa Yönetimi</Text>
                <Text size="xs" c="dimmed">Masa düzenleme</Text>
              </Stack>
            </Button>
          </SimpleGrid>
        </Card>

        {/* Ödeme Modal */}
        <PaymentModal
          opened={paymentModalOpened}
          onClose={() => {
            setPaymentModalOpened(false)
            setPaymentOrder(null)
          }}
          order={paymentOrder}
          onComplete={handlePaymentComplete}
          loading={paymentLoading}
        />
      </Stack>
    </DashboardLayout>
  )
} 