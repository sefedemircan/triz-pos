'use client'

import { useState } from 'react'
import {
  Modal,
  Stack,
  Group,
  Card,
  Text,
  Button,
  Radio,
  NumberInput,
  Textarea,
  Divider,
  Grid,
  Alert,
  Title,
  Badge,
} from '@mantine/core'
import {
  IconCurrencyLira,
  IconTable,
  IconUser,
  IconClock,
  IconCheck,
  IconCash,
  IconCreditCard,
  IconCalculator,
} from '@tabler/icons-react'
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

interface PaymentData {
  paymentMethod: 'cash' | 'card'
  receivedAmount?: number
  changeAmount?: number
  notes?: string
}

interface PaymentModalProps {
  opened: boolean
  onClose: () => void
  order: OrderWithDetails | null
  onComplete: (orderId: string, paymentData: PaymentData) => void
  loading?: boolean
}

export function PaymentModal({ opened, onClose, order, onComplete, loading = false }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [receivedAmount, setReceivedAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')

  if (!order) return null

  const totalAmount = order.total_amount
  const changeAmount = paymentMethod === 'cash' && receivedAmount > totalAmount 
    ? receivedAmount - totalAmount 
    : 0

  const canComplete = paymentMethod === 'card' || 
    (paymentMethod === 'cash' && receivedAmount >= totalAmount)

  const handleComplete = () => {
    const paymentData: PaymentData = {
      paymentMethod,
      receivedAmount: paymentMethod === 'cash' ? receivedAmount : undefined,
      changeAmount: paymentMethod === 'cash' ? changeAmount : undefined,
      notes: notes.trim() || undefined,
    }
    onComplete(order.id, paymentData)
  }

  const handleQuickAmount = (amount: number) => {
    setReceivedAmount(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR')
  }

  const getOrderAge = () => {
    const now = new Date()
    const created = new Date(order.created_at)
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Az önce'
    if (diffMinutes < 60) return `${diffMinutes} dk önce`
    
    const diffHours = Math.floor(diffMinutes / 60)
    const remainingMinutes = diffMinutes % 60
    return `${diffHours}s ${remainingMinutes}dk önce`
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCurrencyLira size="1.5rem" />
          <Text fw={600} size="lg">Ödeme Al</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        {/* Sipariş Özeti */}
        <Card withBorder>
          <Grid>
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconTable size="1rem" />
                <div>
                  <Text size="sm" c="dimmed">Masa</Text>
                  <Text fw={500}>Masa {order.tables?.table_number}</Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconUser size="1rem" />
                <div>
                  <Text size="sm" c="dimmed">Garson</Text>
                  <Text fw={500}>{order.users?.full_name}</Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap="xs">
                <IconClock size="1rem" />
                <div>
                  <Text size="sm" c="dimmed">Sipariş Zamanı</Text>
                  <Text fw={500}>{getOrderAge()}</Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <div>
                <Text size="sm" c="dimmed">Sipariş Tarihi</Text>
                <Text fw={500}>{formatDate(order.created_at)}</Text>
              </div>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Durum</Text>
              <Badge color={order.status === 'active' ? 'orange' : order.status === 'ready' ? 'blue' : 'green'}>
                {order.status === 'active' ? 'Hazırlanıyor' : 
                 order.status === 'ready' ? 'Hazır' : 
                 order.status === 'completed' ? 'Tamamlandı' : 'İptal'}
              </Badge>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Sipariş Ürünleri */}
        <Card withBorder>
          <Title order={4} mb="md">Sipariş Detayları</Title>
          <Stack gap="xs">
            {order.order_items.map((item) => (
              <Group key={item.id} justify="space-between" p="xs">
                <div>
                  <Text fw={500} size="sm">{item.products?.name || 'Bilinmeyen Ürün'}</Text>
                  <Text size="xs" c="dimmed">
                    {item.quantity} adet × ₺{item.unit_price.toFixed(2)}
                  </Text>
                </div>
                <Text fw={600} c="green">
                  ₺{item.total_price.toFixed(2)}
                </Text>
              </Group>
            ))}
          </Stack>
          
          <Divider my="md" />
          
          <Group justify="space-between" p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <Text fw={700} size="xl">TOPLAM:</Text>
            <Text fw={700} size="xl" c="green">
              ₺{totalAmount.toFixed(2)}
            </Text>
          </Group>
        </Card>

        {/* Ödeme Yöntemi */}
        <Card withBorder>
          <Title order={4} mb="md">Ödeme Yöntemi</Title>
          <Radio.Group
            value={paymentMethod}
            onChange={(value) => setPaymentMethod(value as 'cash' | 'card')}
          >
            <Stack gap="xs">
              <Radio
                value="cash"
                label={
                  <Group gap="xs">
                    <IconCash size="1rem" />
                    <Text>Nakit</Text>
                  </Group>
                }
              />
              <Radio
                value="card"
                label={
                  <Group gap="xs">
                    <IconCreditCard size="1rem" />
                    <Text>Kredi/Banka Kartı</Text>
                  </Group>
                }
              />
            </Stack>
          </Radio.Group>
        </Card>

        {/* Nakit Ödeme Detayları */}
        {paymentMethod === 'cash' && (
          <Card withBorder>
            <Title order={4} mb="md">
              <Group gap="xs">
                <IconCalculator size="1rem" />
                <Text>Nakit Hesaplama</Text>
              </Group>
            </Title>
            
            <Stack gap="md">
              <NumberInput
                label="Alınan Tutar"
                placeholder="Müşteriden alınan para miktarı"
                value={receivedAmount}
                onChange={(value) => setReceivedAmount(Number(value) || 0)}
                min={0}
                step={0.01}
                decimalScale={2}
                leftSection={<IconCurrencyLira size="1rem" />}
                size="md"
              />

              {/* Hızlı Tutar Butonları */}
              <div>
                <Text size="sm" mb="xs" c="dimmed">Hızlı Tutar Seçimi</Text>
                <Group gap="xs">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(totalAmount)}
                  >
                    Tam Para
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(Math.ceil(totalAmount / 5) * 5)}
                  >
                    5₺&apos;e Yuvarla
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAmount(Math.ceil(totalAmount / 10) * 10)}
                  >
                    10₺&apos;e Yuvarla
                  </Button>
                </Group>
              </div>

              {/* Para Üstü Hesaplama */}
              {receivedAmount > 0 && (
                <Alert 
                  color={receivedAmount >= totalAmount ? "green" : "red"}
                  icon={receivedAmount >= totalAmount ? <IconCheck size="1rem" /> : <IconCurrencyLira size="1rem" />}
                >
                  {receivedAmount >= totalAmount ? (
                    <Group justify="space-between">
                      <Text>Para Üstü:</Text>
                      <Text fw={700}>₺{changeAmount.toFixed(2)}</Text>
                    </Group>
                  ) : (
                    <Text>Yetersiz tutar! Eksik: ₺{(totalAmount - receivedAmount).toFixed(2)}</Text>
                  )}
                </Alert>
              )}
            </Stack>
          </Card>
        )}

        {/* Ödeme Notu */}
        <Textarea
          label="Ödeme Notu (Opsiyonel)"
          placeholder="Ödeme ile ilgili ek bilgiler..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        {/* İşlem Butonları */}
        <Group justify="space-between" mt="md">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            color="green"
            onClick={handleComplete}
            disabled={!canComplete || loading}
            loading={loading}
            leftSection={<IconCheck size="1rem" />}
          >
            Ödemeyi Tamamla
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
} 