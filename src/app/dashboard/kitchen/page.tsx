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
  Loader,
  Center,
  ActionIcon,
  Divider,
  ScrollArea,
} from '@mantine/core'
import {
  IconChefHat,
  IconClock,
  IconCheck,
  IconRefresh,
  IconTable,
  IconCurrencyLira,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
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

export default function KitchenPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)

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
      setOrders(data || [])
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
      .channel('kitchen-orders')
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
    
    if (diffMinutes < 1) return 'Az önce'
    if (diffMinutes < 60) return `${diffMinutes} dk önce`
    
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours} saat ${diffMinutes % 60} dk önce`
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Center h={400}>
          <Stack align="center">
            <Loader size="lg" />
            <Text>Siparişler yükleniyor...</Text>
          </Stack>
        </Center>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>
              <IconChefHat size="2rem" style={{ marginRight: 8 }} />
              Mutfak Paneli
            </Title>
            <Text c="dimmed">Aktif siparişleri görüntüleyin</Text>
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

        {orders.length === 0 ? (
          <Alert icon={<IconCheck size="1rem" />} color="green">
            🎉 Harika! Şu anda aktif sipariş yok.
          </Alert>
        ) : (
          <>
            <Text size="sm" c="dimmed">
              Toplam {orders.length} aktif sipariş
            </Text>

            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }}>
              {orders.map((order) => (
                <Card key={order.id} withBorder shadow="sm">
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
                        <Text size="xs" c="dimmed">
                          <IconClock size="0.8rem" style={{ marginRight: 4 }} />
                          {getOrderAge(order.created_at)}
                        </Text>
                      </div>
                      <Badge color="blue" variant="filled">
                        Aktif
                      </Badge>
                    </Group>

                    <Divider />

                    {/* Sipariş Ürünleri */}
                    <ScrollArea h={150}>
                      <Stack gap="xs">
                        {order.order_items.map((item) => (
                          <Group key={item.id} justify="space-between">
                            <div>
                              <Text size="sm" fw={500}>
                                {item.products?.name || 'Bilinmeyen Ürün'}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {item.quantity} adet × ₺{item.unit_price.toFixed(2)}
                              </Text>
                            </div>
                            <Text size="sm" fw={600} c="green">
                              ₺{(item.quantity * item.unit_price).toFixed(2)}
                            </Text>
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
              ))}
            </SimpleGrid>
          </>
        )}
      </Stack>
    </DashboardLayout>
  )
} 