'use client'

import { useEffect, useState } from 'react'
import {
  Stack,
  Title,
  Group,
  Card,
  Text,
  Badge,
  Button,
  SimpleGrid,
  Alert,
  ActionIcon,
  Divider,
  ScrollArea,
  Progress,
} from '@mantine/core'
import {
  IconChefHat,
  IconClock,
  IconCheck,
  IconRefresh,
  IconTable,
  IconCurrencyLira,
  IconAlertTriangle,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Database } from '@/lib/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Table = Database['public']['Tables']['tables']['Row']

interface OrderWithDetails extends Order {
  tables?: Table
  order_items: (OrderItem & {
    products?: Product
  })[]
}

export default function MutfakDashboardPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalActiveOrders: 0,
    urgentOrders: 0,
    completedToday: 0,
    averageTime: 0,
  })

  const fetchOrders = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (
            id,
            table_number,
            status
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
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (error) throw error
      
      const ordersData = data || []
      setOrders(ordersData)

      // İstatistikleri hesapla
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      const urgentOrders = ordersData.filter(order => {
        const orderTime = new Date(order.created_at)
        const diffMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60)
        return diffMinutes > 30 // 30 dakikadan eski siparişler acil
      }).length

      // Bugün tamamlanan siparişleri al
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .gte('updated_at', today.toISOString())

      setStats({
        totalActiveOrders: ordersData.length,
        urgentOrders,
        completedToday: completedOrders?.length || 0,
        averageTime: 25, // Ortalama hazırlık süresi (dakika)
      })

    } catch (error) {
      console.error('Orders fetch error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Siparişler yüklenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    // Real-time güncellemeler için subscription
    const supabase = createClient()
    const subscription = supabase
      .channel('mutfak-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const completeOrder = async (orderId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Sipariş tamamlandı',
        color: 'green',
      })

      fetchOrders()
    } catch (error) {
      console.error('Order complete error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Sipariş tamamlanırken hata oluştu',
        color: 'red',
      })
    }
  }

  const getOrderAge = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return { text: 'Az önce', urgent: false }
    if (diffMinutes < 60) return { 
      text: `${diffMinutes} dk önce`, 
      urgent: diffMinutes > 30 
    }
    
    const diffHours = Math.floor(diffMinutes / 60)
    return { 
      text: `${diffHours} saat ${diffMinutes % 60} dk önce`, 
      urgent: true 
    }
  }

  const getOrderPriority = (order: OrderWithDetails) => {
    const age = getOrderAge(order.created_at)
    const itemCount = order.order_items.length
    
    if (age.urgent) return { level: 'high', color: 'red', text: 'Acil' }
    if (itemCount > 5) return { level: 'medium', color: 'orange', text: 'Orta' }
    return { level: 'normal', color: 'blue', text: 'Normal' }
  }

  // Siparişleri önceliğe göre sırala
  const sortedOrders = [...orders].sort((a, b) => {
    const priorityA = getOrderPriority(a)
    const priorityB = getOrderPriority(b)
    
    if (priorityA.level === 'high' && priorityB.level !== 'high') return -1
    if (priorityA.level !== 'high' && priorityB.level === 'high') return 1
    if (priorityA.level === 'medium' && priorityB.level === 'normal') return -1
    if (priorityA.level === 'normal' && priorityB.level === 'medium') return 1
    
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>
              <IconChefHat size="2rem" style={{ marginRight: 8 }} />
              Mutfak Paneli
            </Title>
            <Text c="dimmed">Hoş geldiniz, {user?.full_name} - Sipariş Hazırlama</Text>
          </div>
          <ActionIcon
            variant="outline"
            size="lg"
            onClick={fetchOrders}
            loading={loading}
          >
            <IconRefresh size="1.1rem" />
          </ActionIcon>
        </Group>

        {/* İstatistik Kartları */}
        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={700}>Aktif Sipariş</Text>
                <Text fw={700} size="xl" c="blue">{stats.totalActiveOrders}</Text>
              </div>
              <IconChefHat color="blue" size="1.5rem" />
            </Group>
          </Card>

          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={700}>Acil Sipariş</Text>
                <Text fw={700} size="xl" c="red">{stats.urgentOrders}</Text>
              </div>
              <IconAlertTriangle color="red" size="1.5rem" />
            </Group>
          </Card>

          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={700}>Bugün Tamamlanan</Text>
                <Text fw={700} size="xl" c="green">{stats.completedToday}</Text>
              </div>
              <IconCheck color="green" size="1.5rem" />
            </Group>
          </Card>

          <Card withBorder>
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed" fw={700}>Ort. Süre</Text>
                <Text fw={700} size="xl" c="orange">{stats.averageTime} dk</Text>
              </div>
              <IconClock color="orange" size="1.5rem" />
            </Group>
          </Card>
        </SimpleGrid>

        {/* Performans Göstergesi */}
        <Card withBorder>
          <Title order={3} mb="md">Günlük Performans</Title>
          <Group justify="space-between" mb="xs">
            <Text size="sm">Tamamlanan Siparişler</Text>
            <Text size="sm" fw={600}>{stats.completedToday}/20 (Hedef)</Text>
          </Group>
          <Progress 
            value={(stats.completedToday / 20) * 100} 
            color={stats.completedToday >= 20 ? 'green' : 'blue'}
          />
        </Card>

        {/* Sipariş Listesi */}
        {sortedOrders.length === 0 ? (
          <Alert icon={<IconCheck size="1rem" />} color="green">
            🎉 Harika! Şu anda hazırlanacak sipariş yok.
          </Alert>
        ) : (
          <>
            <Group justify="space-between">
              <Text size="lg" fw={600}>Hazırlanacak Siparişler</Text>
              <Text size="sm" c="dimmed">
                Toplam {sortedOrders.length} sipariş (Öncelik sırasına göre)
              </Text>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
              {sortedOrders.map((order) => {
                const orderAge = getOrderAge(order.created_at)
                const priority = getOrderPriority(order)
                
                return (
                  <Card key={order.id} withBorder shadow="sm" style={{
                    borderColor: priority.color === 'red' ? '#fa5252' : undefined,
                    borderWidth: priority.color === 'red' ? '2px' : '1px'
                  }}>
                    <Stack gap="sm">
                      {/* Sipariş Başlığı */}
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Group gap="xs">
                            <IconTable size="1rem" />
                            <Text fw={600} size="lg">
                              Masa {order.tables?.table_number || 'Bilinmiyor'}
                            </Text>
                          </Group>
                          <Text size="xs" c={orderAge.urgent ? 'red' : 'dimmed'}>
                            <IconClock size="0.8rem" style={{ marginRight: 4 }} />
                            {orderAge.text}
                          </Text>
                        </div>
                        <Group gap="xs">
                          <Badge color={priority.color} variant="filled" size="sm">
                            {priority.text}
                          </Badge>
                        </Group>
                      </Group>

                      <Divider />

                      {/* Sipariş Ürünleri */}
                      <ScrollArea h={120}>
                        <Stack gap="xs">
                          {order.order_items.map((item) => (
                            <Group key={item.id} justify="space-between">
                              <div>
                                <Text size="sm" fw={500}>
                                  {item.products?.name || 'Bilinmeyen Ürün'}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {item.quantity} adet
                                </Text>
                              </div>
                              <Badge size="xs" variant="outline">
                                {item.status === 'pending' ? 'Bekliyor' : 
                                 item.status === 'preparing' ? 'Hazırlanıyor' :
                                 item.status === 'ready' ? 'Hazır' : 'Servis'}
                              </Badge>
                            </Group>
                          ))}
                        </Stack>
                      </ScrollArea>

                      <Divider />

                      {/* Toplam ve Aksiyonlar */}
                      <Group justify="space-between" align="center">
                        <Group gap="xs">
                          <IconCurrencyLira size="1rem" />
                          <Text fw={700} size="lg" c="green">
                            {order.total_amount.toFixed(2)}
                          </Text>
                        </Group>
                        
                        <Button
                          size="sm"
                          color="green"
                          onClick={() => completeOrder(order.id)}
                        >
                          Tamamla
                        </Button>
                      </Group>

                      {/* Notlar */}
                      {order.notes && (
                        <>
                          <Divider />
                          <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                            Not: {order.notes}
                          </Text>
                        </>
                      )}
                    </Stack>
                  </Card>
                )
              })}
            </SimpleGrid>
          </>
        )}
      </Stack>
    </DashboardLayout>
  )
} 