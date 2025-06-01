'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Stack,
  Title,
  Group,
  Card,
  Text,
  Button,
  Badge,
  Alert,
  ActionIcon,
  Divider,
  ScrollArea,
  Modal,
  Textarea,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconTable,
  IconCurrencyLira,
  IconClock,
  IconCheck,
  IconX,
  IconEdit,
  IconReceipt,
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

export default function OrderDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableId = searchParams.get('table')

  const [order, setOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelModalOpened, setCancelModalOpened] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchOrderDetails = async () => {
    if (!tableId) {
      notifications.show({
        title: 'Hata',
        message: 'Masa ID bulunamadı',
        color: 'red',
      })
      router.back()
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (
            id,
            table_number,
            capacity,
            status
          ),
          order_items (
            *,
            products (
              id,
              name,
              price,
              description
            )
          )
        `)
        .eq('table_id', tableId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          notifications.show({
            title: 'Bilgi',
            message: 'Bu masa için aktif sipariş bulunamadı',
            color: 'blue',
          })
          router.back()
          return
        }
        throw error
      }

      setOrder(data)
    } catch (error) {
      console.error('Order fetch error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Sipariş detayları yüklenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetails()
  }, [tableId])

  const cancelOrder = async () => {
    if (!order || !cancelReason.trim()) {
      notifications.show({
        title: 'Hata',
        message: 'İptal nedeni belirtmelisiniz',
        color: 'red',
      })
      return
    }

    setCancelling(true)
    try {
      const supabase = createClient()
      
      // Siparişi iptal et
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          notes: order.notes ? `${order.notes}\n\nİptal nedeni: ${cancelReason}` : `İptal nedeni: ${cancelReason}`
        })
        .eq('id', order.id)

      if (orderError) throw orderError

      // Masayı boşalt
      await supabase
        .from('tables')
        .update({ status: 'empty' })
        .eq('id', order.table_id)

      notifications.show({
        title: 'Başarılı',
        message: 'Sipariş iptal edildi',
        color: 'green',
      })

      router.push('/dashboard/garson')
    } catch (error) {
      console.error('Order cancel error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Sipariş iptal edilirken hata oluştu',
        color: 'red',
      })
    } finally {
      setCancelling(false)
      setCancelModalOpened(false)
    }
  }

  const completeOrder = async () => {
    if (!order) return

    try {
      const supabase = createClient()
      
      // Siparişi tamamla
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', order.id)

      if (orderError) throw orderError

      // Masayı boşalt
      await supabase
        .from('tables')
        .update({ status: 'empty' })
        .eq('id', order.table_id)

      notifications.show({
        title: 'Başarılı',
        message: 'Sipariş tamamlandı',
        color: 'green',
      })

      router.push('/dashboard/garson')
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

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'orange'
      case 'preparing':
        return 'blue'
      case 'ready':
        return 'green'
      case 'served':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const getItemStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor'
      case 'preparing':
        return 'Hazırlanıyor'
      case 'ready':
        return 'Hazır'
      case 'served':
        return 'Servis Edildi'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Text>Yükleniyor...</Text>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <Alert color="red">
          Sipariş bulunamadı veya yüklenirken hata oluştu.
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Group>
              <ActionIcon
                variant="outline"
                onClick={() => router.back()}
              >
                <IconArrowLeft size="1rem" />
              </ActionIcon>
              <Title order={1}>
                <IconReceipt size="2rem" style={{ marginRight: 8 }} />
                Sipariş Detayları
              </Title>
            </Group>
            <Text c="dimmed">
              Masa {order.tables?.table_number} - {getOrderAge(order.created_at)}
            </Text>
          </div>
          
          <Group>
            <Button
              variant="outline"
              color="red"
              onClick={() => setCancelModalOpened(true)}
            >
              İptal Et
            </Button>
            <Button
              color="green"
              onClick={completeOrder}
            >
              Tamamla
            </Button>
          </Group>
        </Group>

        <Group align="flex-start" gap="md">
          {/* Sol Panel - Sipariş Bilgileri */}
          <Card withBorder style={{ flex: 2 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>Sipariş Bilgileri</Title>
                <Badge color="blue" variant="filled">
                  Aktif
                </Badge>
              </Group>

              <Group>
                <IconTable size="1rem" />
                <Text>
                  <strong>Masa:</strong> {order.tables?.table_number} ({order.tables?.capacity} kişilik)
                </Text>
              </Group>

              <Group>
                <IconClock size="1rem" />
                <Text>
                  <strong>Sipariş Zamanı:</strong> {new Date(order.created_at).toLocaleString('tr-TR')}
                </Text>
              </Group>

              <Group>
                <IconCurrencyLira size="1rem" />
                <Text>
                  <strong>Toplam Tutar:</strong> ₺{order.total_amount.toFixed(2)}
                </Text>
              </Group>

              {order.notes && (
                <div>
                  <Text fw={500} mb="xs">Sipariş Notu:</Text>
                  <Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
                    {order.notes}
                  </Text>
                </div>
              )}

              <Divider />

              <Title order={4}>Sipariş Ürünleri</Title>
              <ScrollArea h={400}>
                <Stack gap="sm">
                  {order.order_items.map((item) => (
                    <Card key={item.id} withBorder p="sm">
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1 }}>
                          <Text fw={500}>{item.products?.name || 'Bilinmeyen Ürün'}</Text>
                          {item.products?.description && (
                            <Text size="sm" c="dimmed" mt="xs">
                              {item.products.description}
                            </Text>
                          )}
                          <Group gap="xs" mt="xs">
                            <Text size="sm">
                              {item.quantity} adet × ₺{item.unit_price.toFixed(2)}
                            </Text>
                            <Text size="sm" fw={600} c="green">
                              = ₺{(item.quantity * item.unit_price).toFixed(2)}
                            </Text>
                          </Group>
                          {item.notes && (
                            <Text size="xs" c="dimmed" mt="xs" style={{ fontStyle: 'italic' }}>
                              Not: {item.notes}
                            </Text>
                          )}
                        </div>
                        
                        <Badge
                          color={getItemStatusColor(item.status)}
                          variant="filled"
                          size="sm"
                        >
                          {getItemStatusText(item.status)}
                        </Badge>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              </ScrollArea>
            </Stack>
          </Card>

          {/* Sağ Panel - Hızlı Aksiyonlar */}
          <Card withBorder style={{ flex: 1, minWidth: 300 }}>
            <Stack gap="md">
              <Title order={3}>Hızlı Aksiyonlar</Title>

              <Button
                fullWidth
                variant="outline"
                leftSection={<IconEdit size="1rem" />}
                onClick={() => router.push(`/dashboard/garson/edit-order?order=${order.id}`)}
              >
                Siparişi Düzenle
              </Button>

              <Button
                fullWidth
                color="green"
                leftSection={<IconCheck size="1rem" />}
                onClick={completeOrder}
              >
                Siparişi Tamamla
              </Button>

              <Button
                fullWidth
                variant="outline"
                color="red"
                leftSection={<IconX size="1rem" />}
                onClick={() => setCancelModalOpened(true)}
              >
                Siparişi İptal Et
              </Button>

              <Divider />

              <div>
                <Text fw={500} mb="xs">Sipariş Özeti</Text>
                <Group justify="space-between">
                  <Text size="sm">Ürün Sayısı:</Text>
                  <Text size="sm" fw={600}>{order.order_items.length}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Toplam Adet:</Text>
                  <Text size="sm" fw={600}>
                    {order.order_items.reduce((sum, item) => sum + item.quantity, 0)}
                  </Text>
                </Group>
                <Group justify="space-between" mt="md">
                  <Text fw={600}>Toplam Tutar:</Text>
                  <Text fw={700} size="lg" c="green">
                    ₺{order.total_amount.toFixed(2)}
                  </Text>
                </Group>
              </div>
            </Stack>
          </Card>
        </Group>

        {/* İptal Modal */}
        <Modal
          opened={cancelModalOpened}
          onClose={() => setCancelModalOpened(false)}
          title="Siparişi İptal Et"
          size="md"
        >
          <Stack gap="md">
            <Alert color="orange">
              Bu işlem geri alınamaz. Sipariş iptal edilecek ve masa boşaltılacak.
            </Alert>

            <Textarea
              label="İptal Nedeni"
              placeholder="Siparişin neden iptal edildiğini belirtin..."
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
            />

            <Group justify="flex-end">
              <Button
                variant="outline"
                onClick={() => setCancelModalOpened(false)}
              >
                Vazgeç
              </Button>
              <Button
                color="red"
                onClick={cancelOrder}
                loading={cancelling}
                disabled={!cancelReason.trim()}
              >
                İptal Et
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </DashboardLayout>
  )
} 