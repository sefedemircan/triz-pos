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
  Select,
  TextInput,
  Table,
  ScrollArea,
  ActionIcon,
  Modal,
  Divider,
  Grid,
  ThemeIcon,
  Alert,
  Tabs,
} from '@mantine/core'
import {
  IconSearch,
  IconEye,
  IconRefresh,
  IconCalendar,
  IconCurrencyLira,
  IconChefHat,
  IconTable,
  IconUser,
  IconClock,
  IconTrendingUp,
  IconFilter,
  IconDownload,
  IconCash,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { PaymentModal } from '@/components/PaymentModal'
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

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  todayOrders: number
  todayRevenue: number
  activeOrders: number
  completedOrders: number
  cancelledOrders: number
}

interface PaymentData {
  paymentMethod: 'cash' | 'card'
  receivedAmount?: number
  changeAmount?: number
  notes?: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([])
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [modalOpened, setModalOpened] = useState(false)
  const [paymentModalOpened, setPaymentModalOpened] = useState(false)
  const [paymentOrder, setPaymentOrder] = useState<OrderWithDetails | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('all')

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
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const ordersData = data || []
      setOrders(ordersData)
      setFilteredOrders(ordersData)
      calculateStats(ordersData)
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

  const calculateStats = (ordersData: OrderWithDetails[]) => {
    const today = new Date().toDateString()
    const todayOrders = ordersData.filter(order => 
      new Date(order.created_at).toDateString() === today
    )

    const totalRevenue = ordersData.reduce((sum, order) => sum + order.total_amount, 0)
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_amount, 0)
    const averageOrderValue = ordersData.length > 0 ? totalRevenue / ordersData.length : 0

    setStats({
      totalOrders: ordersData.length,
      totalRevenue,
      averageOrderValue,
      todayOrders: todayOrders.length,
      todayRevenue,
      activeOrders: ordersData.filter(o => o.status === 'active' || o.status === 'ready').length,
      completedOrders: ordersData.filter(o => o.status === 'completed').length,
      cancelledOrders: ordersData.filter(o => o.status === 'cancelled').length,
    })
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    let filtered = orders

    // Arama filtresi
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.tables?.table_number.toString().includes(searchQuery) ||
        order.users?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Durum filtresi
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Tarih filtresi
    if (dateFilter) {
      const today = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(order =>
            new Date(order.created_at).toDateString() === today.toDateString()
          )
          break
        case 'yesterday':
          filterDate.setDate(today.getDate() - 1)
          filtered = filtered.filter(order =>
            new Date(order.created_at).toDateString() === filterDate.toDateString()
          )
          break
        case 'week':
          filterDate.setDate(today.getDate() - 7)
          filtered = filtered.filter(order =>
            new Date(order.created_at) >= filterDate
          )
          break
        case 'month':
          filterDate.setMonth(today.getMonth() - 1)
          filtered = filtered.filter(order =>
            new Date(order.created_at) >= filterDate
          )
          break
      }
    }

    // Tab filtresi
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab)
    }

    setFilteredOrders(filtered)
  }, [orders, searchQuery, statusFilter, dateFilter, activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'orange'
      case 'ready': return 'blue'
      case 'completed': return 'green'
      case 'cancelled': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hazırlanıyor'
      case 'ready': return 'Hazır'
      case 'completed': return 'Tamamlandı'
      case 'cancelled': return 'İptal'
      default: return status
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Sipariş durumu güncellendi',
        color: 'green',
      })

      fetchOrders()
      setModalOpened(false)
    } catch (error) {
      console.error('Order update error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Sipariş güncellenirken hata oluştu',
        color: 'red',
      })
    }
  }

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

      const order = orders.find(o => o.id === orderId)
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
      fetchOrders()

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const statCards = [
    {
      title: 'Toplam Sipariş',
      value: stats.totalOrders,
      icon: IconChefHat,
      color: 'blue',
    },
    {
      title: 'Toplam Gelir',
      value: `₺${stats.totalRevenue.toFixed(2)}`,
      icon: IconCurrencyLira,
      color: 'green',
    },
    {
      title: 'Ortalama Sipariş',
      value: `₺${stats.averageOrderValue.toFixed(2)}`,
      icon: IconTrendingUp,
      color: 'orange',
    },
    {
      title: 'Bugünkü Sipariş',
      value: stats.todayOrders,
      icon: IconCalendar,
      color: 'purple',
    },
    {
      title: 'Bugünkü Gelir',
      value: `₺${stats.todayRevenue.toFixed(2)}`,
      icon: IconCurrencyLira,
      color: 'teal',
    },
    {
      title: 'Aktif Sipariş',
      value: stats.activeOrders,
      icon: IconClock,
      color: 'red',
    },
  ]

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>Sipariş Yönetimi</Title>
            <Text c="dimmed">Tüm siparişleri görüntüleyin ve yönetin</Text>
          </div>
          <Group>
            <Button
              leftSection={<IconDownload size="1rem" />}
              variant="outline"
            >
              Rapor İndir
            </Button>
            <ActionIcon
              variant="outline"
              size="lg"
              onClick={fetchOrders}
              loading={loading}
            >
              <IconRefresh size="1.1rem" />
            </ActionIcon>
          </Group>
        </Group>

        {/* İstatistikler */}
        <Grid>
          {statCards.map((stat) => (
            <Grid.Col key={stat.title} span={{ base: 12, sm: 6, md: 4, lg: 2 }}>
              <Card 
                withBorder
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '12px',
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
                }}
              >
                <Group justify="space-between">
                  <div>
                    <Text size="xs" c="dimmed" fw={700}>
                      {stat.title}
                    </Text>
                    <Text fw={700} size="lg">
                      {stat.value}
                    </Text>
                  </div>
                  <ThemeIcon
                    color={stat.color}
                    variant="light"
                    size="md"
                    radius="md"
                  >
                    <stat.icon size="1rem" />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {/* Filtreler */}
        <Card withBorder>
          <Group>
            <TextInput
              placeholder="Sipariş ara (masa, garson, ID)..."
              leftSection={<IconSearch size="1rem" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Durum filtrele"
              leftSection={<IconFilter size="1rem" />}
              data={[
                { value: '', label: 'Tüm Durumlar' },
                { value: 'active', label: 'Hazırlanıyor' },
                { value: 'ready', label: 'Hazır' },
                { value: 'completed', label: 'Tamamlandı' },
                { value: 'cancelled', label: 'İptal' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || '')}
              style={{ minWidth: 150 }}
            />
            <Select
              placeholder="Tarih filtrele"
              leftSection={<IconCalendar size="1rem" />}
              data={[
                { value: '', label: 'Tüm Zamanlar' },
                { value: 'today', label: 'Bugün' },
                { value: 'yesterday', label: 'Dün' },
                { value: 'week', label: 'Son 7 Gün' },
                { value: 'month', label: 'Son 30 Gün' },
              ]}
              value={dateFilter}
              onChange={(value) => setDateFilter(value || '')}
              style={{ minWidth: 150 }}
            />
          </Group>
        </Card>

        {/* Sipariş Tabları */}
        <Card withBorder>
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
            <Tabs.List>
              <Tabs.Tab value="all">
                Tümü ({orders.length})
              </Tabs.Tab>
              <Tabs.Tab value="active" color="orange">
                Hazırlanıyor ({orders.filter(o => o.status === 'active').length})
              </Tabs.Tab>
              <Tabs.Tab value="ready" color="blue">
                Hazır ({orders.filter(o => o.status === 'ready').length})
              </Tabs.Tab>
              <Tabs.Tab value="completed" color="green">
                Tamamlandı ({stats.completedOrders})
              </Tabs.Tab>
              <Tabs.Tab value="cancelled" color="red">
                İptal ({stats.cancelledOrders})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab} pt="md">
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Sipariş ID</Table.Th>
                      <Table.Th>Masa</Table.Th>
                      <Table.Th>Garson</Table.Th>
                      <Table.Th>Tarih</Table.Th>
                      <Table.Th>Durum</Table.Th>
                      <Table.Th>Ürün Sayısı</Table.Th>
                      <Table.Th>Toplam</Table.Th>
                      <Table.Th>İşlemler</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredOrders.map((order) => (
                      <Table.Tr key={order.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            #{order.id.slice(0, 8)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <IconTable size="1rem" />
                            <Text size="sm">
                              Masa {order.tables?.table_number}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <IconUser size="1rem" />
                            <Text size="sm">
                              {order.users?.full_name || 'Bilinmiyor'}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {formatDate(order.created_at)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={getStatusColor(order.status)}
                            variant="light"
                          >
                            {getStatusText(order.status)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {order.order_items.length} ürün
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={600} c="green">
                            ₺{order.total_amount.toFixed(2)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => {
                                setSelectedOrder(order)
                                setModalOpened(true)
                              }}
                            >
                              <IconEye size="1rem" />
                            </ActionIcon>
                            {(order.status === 'active' || order.status === 'ready') && (
                              <ActionIcon
                                variant="light"
                                color="green"
                                onClick={() => handlePaymentRequest(order)}
                              >
                                <IconCash size="1rem" />
                              </ActionIcon>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              {filteredOrders.length === 0 && (
                <Alert color="blue" mt="md">
                  {searchQuery || statusFilter || dateFilter
                    ? 'Filtrelere uygun sipariş bulunamadı.'
                    : 'Henüz sipariş bulunmuyor.'}
                </Alert>
              )}
            </Tabs.Panel>
          </Tabs>
        </Card>

        {/* Sipariş Detay Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Sipariş Detayları"
          size="lg"
        >
          {selectedOrder && (
            <Stack gap="md">
              {/* Sipariş Bilgileri */}
              <Card withBorder>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Sipariş ID</Text>
                    <Text fw={500}>#{selectedOrder.id.slice(0, 8)}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Masa</Text>
                    <Text fw={500}>Masa {selectedOrder.tables?.table_number}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Garson</Text>
                    <Text fw={500}>{selectedOrder.users?.full_name}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Tarih</Text>
                    <Text fw={500}>{formatDate(selectedOrder.created_at)}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Durum</Text>
                    <Badge color={getStatusColor(selectedOrder.status)}>
                      {getStatusText(selectedOrder.status)}
                    </Badge>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" c="dimmed">Ödeme</Text>
                    <Badge color={selectedOrder.payment_method === 'pending' ? 'orange' : 'green'}>
                      {selectedOrder.payment_method === 'pending' ? 'Bekliyor' : 
                       selectedOrder.payment_method === 'cash' ? 'Nakit' : 'Kart'}
                    </Badge>
                  </Grid.Col>
                </Grid>
                
                {selectedOrder.notes && (
                  <>
                    <Divider my="md" />
                    <Text size="sm" c="dimmed">Notlar</Text>
                    <Text>{selectedOrder.notes}</Text>
                  </>
                )}
              </Card>

              {/* Sipariş Ürünleri */}
              <Card withBorder>
                <Title order={4} mb="md">Sipariş Ürünleri</Title>
                <Stack gap="sm">
                  {selectedOrder.order_items.map((item) => (
                    <Group key={item.id} justify="space-between" p="sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div>
                        <Text fw={500}>{item.products?.name || 'Bilinmeyen Ürün'}</Text>
                        <Text size="sm" c="dimmed">
                          {item.quantity} adet × ₺{item.unit_price.toFixed(2)}
                        </Text>
                        {item.notes && (
                          <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                            Not: {item.notes}
                          </Text>
                        )}
                      </div>
                      <Text fw={600} c="green">
                        ₺{item.total_price.toFixed(2)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
                
                <Divider my="md" />
                <Group justify="space-between">
                  <Text fw={600} size="lg">Toplam:</Text>
                  <Text fw={700} size="xl" c="green">
                    ₺{selectedOrder.total_amount.toFixed(2)}
                  </Text>
                </Group>
              </Card>

              {/* Durum Güncelleme */}
              {(selectedOrder.status === 'active' || selectedOrder.status === 'ready') && (
                <Card withBorder>
                  <Title order={4} mb="md">Sipariş İşlemleri</Title>
                  <Group>
                    <Button
                      color="green"
                      leftSection={<IconCash size="1rem" />}
                      onClick={() => {
                        setModalOpened(false)
                        handlePaymentRequest(selectedOrder)
                      }}
                    >
                      Ödeme Al
                    </Button>
                    {selectedOrder.status === 'active' && (
                      <Button
                        color="blue"
                        variant="outline"
                        onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                      >
                        Hazır İşaretle
                      </Button>
                    )}
                    <Button
                      color="red"
                      variant="outline"
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    >
                      İptal Et
                    </Button>
                  </Group>
                </Card>
              )}
            </Stack>
          )}
        </Modal>

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