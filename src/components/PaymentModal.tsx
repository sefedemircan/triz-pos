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
  ThemeIcon,
  Box,
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
  IconAlertCircle,
  IconReceipt,
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
        <Group gap="sm" className="animate-slide-in-right">
          <ThemeIcon size="xl" radius="md" color="orange" className="cafe-gradient-bg">
            <IconCurrencyLira size="1.5rem" />
          </ThemeIcon>
          <Box>
            <Text fw={700} size="xl" c="var(--foreground)">Ödeme Al</Text>
            <Text size="sm" c="var(--foreground-muted)">Sipariş #{order.id.slice(-8)}</Text>
          </Box>
        </Group>
      }
      size="lg"
      centered
      radius="lg"
      className="animate-fade-in"
      styles={{
        content: {
          background: 'var(--card-bg)',
          border: '2px solid var(--card-border)',
        },
        header: {
          background: 'var(--gradient-light)',
          borderBottom: '1px solid var(--card-border)',
        },
      }}
    >
      <Stack gap="lg">
        {/* Sipariş Özeti */}
        <Card className="cafe-card glass-effect">
          <Title order={4} mb="md" c="var(--cafe-primary)">
            <Group gap="xs">
              <IconReceipt size="1.2rem" />
              <Text>Sipariş Özeti</Text>
            </Group>
          </Title>
          <Grid gutter="md">
            <Grid.Col span={6}>
              <Group gap="sm">
                <ThemeIcon size="md" color="orange" variant="light">
                  <IconTable size="1rem" />
                </ThemeIcon>
                <Box>
                  <Text size="sm" c="var(--foreground-muted)" fw={500}>Masa</Text>
                  <Text fw={600} c="var(--foreground)">Masa {order.tables?.table_number}</Text>
                </Box>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap="sm">
                <ThemeIcon size="md" color="orange" variant="light">
                  <IconUser size="1rem" />
                </ThemeIcon>
                <Box>
                  <Text size="sm" c="var(--foreground-muted)" fw={500}>Garson</Text>
                  <Text fw={600} c="var(--foreground)">{order.users?.full_name}</Text>
                </Box>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap="sm">
                <ThemeIcon size="md" color="orange" variant="light">
                  <IconClock size="1rem" />
                </ThemeIcon>
                <Box>
                  <Text size="sm" c="var(--foreground-muted)" fw={500}>Sipariş Zamanı</Text>
                  <Text fw={600} c="var(--foreground)">{getOrderAge()}</Text>
                </Box>
              </Group>
            </Grid.Col>
            <Grid.Col span={6}>
              <Box>
                <Text size="sm" c="var(--foreground-muted)" fw={500}>Durum</Text>
                <Badge 
                  color={order.status === 'active' ? 'orange' : order.status === 'ready' ? 'blue' : 'green'}
                  variant="light"
                  size="md"
                  className="hover-glow"
                >
                  {order.status === 'active' ? 'Hazırlanıyor' : 
                   order.status === 'ready' ? 'Hazır' : 
                   order.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                </Badge>
              </Box>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Sipariş Ürünleri */}
        <Card className="cafe-card">
          <Title order={4} mb="md" c="var(--cafe-primary)">
            <Group gap="xs">
              <IconReceipt size="1.2rem" />
              <Text>Sipariş Detayları</Text>
            </Group>
          </Title>
          <Stack gap="sm">
            {order.order_items.map((item, index) => (
              <Box
                key={item.id}
                p="md"
                className="hover-lift"
                style={{
                  background: 'var(--background-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--card-border)',
                  transition: 'all 0.3s ease',
                }}
              >
                <Group justify="space-between" align="center">
                  <Box>
                    <Text fw={600} size="md" c="var(--foreground)">
                      {item.products?.name || 'Bilinmeyen Ürün'}
                    </Text>
                    <Text size="sm" c="var(--foreground-muted)">
                      {item.quantity} adet × ₺{item.unit_price.toFixed(2)}
                    </Text>
                  </Box>
                  <Box className="cafe-gradient-light" p="xs" style={{ borderRadius: '8px' }}>
                    <Text fw={700} c="var(--cafe-primary)" size="lg">
                      ₺{item.total_price.toFixed(2)}
                    </Text>
                  </Box>
                </Group>
              </Box>
            ))}
          </Stack>
          
          <Divider my="lg" />
          
          <Box
            p="xl"
            className="cafe-gradient-bg"
            style={{ 
              borderRadius: '16px',
              boxShadow: 'var(--card-shadow-hover)',
            }}
          >
            <Group justify="space-between" align="center">
              <Text fw={700} size="xl" c="white">TOPLAM TUTAR:</Text>
              <Text fw={900} size="2xl" c="white" className="animate-pulse">
                ₺{totalAmount.toFixed(2)}
              </Text>
            </Group>
          </Box>
        </Card>

        {/* Ödeme Yöntemi */}
        <Card className="cafe-card">
          <Title order={4} mb="md" c="var(--cafe-primary)">
            <Group gap="xs">
              <IconCreditCard size="1.2rem" />
              <Text>Ödeme Yöntemi</Text>
            </Group>
          </Title>
          <Radio.Group
            value={paymentMethod}
            onChange={(value) => setPaymentMethod(value as 'cash' | 'card')}
          >
            <Stack gap="md">
              <Radio
                value="cash"
                size="md"
                label={
                  <Group gap="sm" p="sm">
                    <ThemeIcon size="lg" color="green" variant="light">
                      <IconCash size="1.2rem" />
                    </ThemeIcon>
                    <Box>
                      <Text fw={600} size="md">Nakit Ödeme</Text>
                      <Text size="sm" c="var(--foreground-muted)">Müşteriden nakit para alın</Text>
                    </Box>
                  </Group>
                }
                className="hover-lift"
                style={{
                  padding: '12px',
                  border: '2px solid var(--card-border)',
                  borderRadius: '12px',
                  background: paymentMethod === 'cash' ? 'var(--background-tertiary)' : 'transparent',
                }}
              />
              <Radio
                value="card"
                size="md"
                label={
                  <Group gap="sm" p="sm">
                    <ThemeIcon size="lg" color="blue" variant="light">
                      <IconCreditCard size="1.2rem" />
                    </ThemeIcon>
                    <Box>
                      <Text fw={600} size="md">Kredi/Banka Kartı</Text>
                      <Text size="sm" c="var(--foreground-muted)">POS cihazı ile ödeme</Text>
                    </Box>
                  </Group>
                }
                className="hover-lift"
                style={{
                  padding: '12px',
                  border: '2px solid var(--card-border)',
                  borderRadius: '12px',
                  background: paymentMethod === 'card' ? 'var(--background-tertiary)' : 'transparent',
                }}
              />
            </Stack>
          </Radio.Group>
        </Card>

        {/* Nakit Ödeme Detayları */}
        {paymentMethod === 'cash' && (
          <Card className="cafe-card animate-slide-in-up">
            <Title order={4} mb="md" c="var(--cafe-primary)">
              <Group gap="xs">
                <IconCalculator size="1.2rem" />
                <Text>Nakit Hesaplama</Text>
              </Group>
            </Title>
            
            <Stack gap="lg">
              <NumberInput
                label={
                  <Text fw={600} size="md" c="var(--foreground)">
                    Alınan Tutar
                  </Text>
                }
                placeholder="Müşteriden alınan para miktarı"
                value={receivedAmount}
                onChange={(value) => setReceivedAmount(Number(value) || 0)}
                min={0}
                step={0.01}
                decimalScale={2}
                leftSection={
                  <ThemeIcon size="sm" color="green" variant="light">
                    <IconCurrencyLira size="0.8rem" />
                  </ThemeIcon>
                }
                size="lg"
                radius="md"
                style={{
                  '--input-bg': 'var(--card-bg)',
                  '--input-border': 'var(--card-border)',
                }}
              />

              {/* Hızlı Tutar Butonları */}
              <Box>
                <Text size="md" mb="sm" c="var(--foreground)" fw={600}>
                  Hızlı Tutar Seçimi
                </Text>
                <Group gap="sm">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleQuickAmount(totalAmount)}
                    className="cafe-button-secondary hover-scale"
                  >
                    Tam Para
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleQuickAmount(Math.ceil(totalAmount / 5) * 5)}
                    className="cafe-button-secondary hover-scale"
                  >
                                         5₺&apos;e Yuvarla
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleQuickAmount(Math.ceil(totalAmount / 10) * 10)}
                    className="cafe-button-secondary hover-scale"
                  >
                                         10₺&apos;e Yuvarla
                  </Button>
                </Group>
              </Box>

              {/* Para Üstü Hesaplama */}
              {receivedAmount > 0 && (
                <Alert 
                  color={receivedAmount >= totalAmount ? "green" : "red"}
                  icon={receivedAmount >= totalAmount ? <IconCheck size="1.2rem" /> : <IconAlertCircle size="1.2rem" />}
                  radius="md"
                  className="animate-slide-in-up"
                  style={{
                    background: receivedAmount >= totalAmount ? 
                      'rgba(76, 175, 80, 0.1)' : 
                      'rgba(244, 67, 54, 0.1)',
                  }}
                >
                  {receivedAmount >= totalAmount ? (
                    <Group justify="space-between" align="center">
                      <Text fw={600} size="md">Para Üstü:</Text>
                      <Box className="cafe-gradient-light" p="sm" style={{ borderRadius: '8px' }}>
                        <Text fw={700} size="lg" c="var(--cafe-primary)">
                          ₺{changeAmount.toFixed(2)}
                        </Text>
                      </Box>
                    </Group>
                  ) : (
                    <Text fw={600} size="md">
                      Yetersiz tutar! Eksik: ₺{(totalAmount - receivedAmount).toFixed(2)}
                    </Text>
                  )}
                </Alert>
              )}
            </Stack>
          </Card>
        )}

        {/* Ödeme Notu */}
        <Card className="cafe-card">
          <Textarea
            label={
              <Text fw={600} size="md" c="var(--foreground)">
                Ödeme Notu (Opsiyonel)
              </Text>
            }
            placeholder="Ödeme ile ilgili ek bilgiler..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            radius="md"
            style={{
              '--input-bg': 'var(--card-bg)',
              '--input-border': 'var(--card-border)',
            }}
          />
        </Card>

        {/* İşlem Butonları */}
        <Group justify="space-between" mt="xl">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={loading}
            className="cafe-button-secondary hover-scale"
            style={{
              borderColor: 'var(--card-border)',
              color: 'var(--foreground-muted)',
            }}
          >
            İptal
          </Button>
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={!canComplete || loading}
            loading={loading}
            leftSection={<IconCheck size="1.2rem" />}
            className="cafe-button-primary hover-lift"
            style={{
              background: 'var(--gradient-primary)',
              minWidth: '180px',
            }}
          >
            Ödemeyi Tamamla
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
} 