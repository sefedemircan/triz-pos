'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Text,
  Badge,
  Group,
  Button,
  Stack,
  Alert,
  Tooltip,
  Loader,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChefHat,
  IconInfoCircle,
} from '@tabler/icons-react'
import { getProductionCapacity } from '@/lib/services/stockService'
import type { Database } from '@/lib/types/database'

type Product = Database['public']['Tables']['products']['Row'] & {
  categories?: Database['public']['Tables']['categories']['Row']
}

interface StockAwareProductCardProps {
  product: Product
  quantity: number
  onQuantityChange: (productId: string, newQuantity: number) => void
  onAddToOrder: (productId: string) => void
  isSelected?: boolean
}

export function StockAwareProductCard({
  product,
  quantity,
  onQuantityChange,
  onAddToOrder,
  isSelected = false,
}: StockAwareProductCardProps) {
  const [productionCapacity, setProductionCapacity] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const capacity = await getProductionCapacity(product.id)
        setProductionCapacity(capacity)
      } catch (error) {
        console.error('Error fetching production capacity:', error)
        setProductionCapacity(Infinity) // Hata durumunda sınırsız kabul et
      } finally {
        setLoading(false)
      }
    }

    fetchCapacity()
  }, [product.id])

  const getAvailabilityStatus = () => {
    if (loading) return { status: 'loading', text: 'Kontrol ediliyor...', color: 'gray' }
    if (productionCapacity === null) return { status: 'unknown', text: 'Bilinmiyor', color: 'gray' }
    if (productionCapacity === Infinity) return { status: 'unlimited', text: 'Sınırsız', color: 'green' }
    if (productionCapacity === 0) return { status: 'unavailable', text: 'Stok Yok', color: 'red' }
    if (productionCapacity <= 5) return { status: 'low', text: `${productionCapacity} porsiyon`, color: 'yellow' }
    if (productionCapacity <= 10) return { status: 'medium', text: `${productionCapacity} porsiyon`, color: 'orange' }
    return { status: 'available', text: `${productionCapacity}+ porsiyon`, color: 'green' }
  }

  const canAddToOrder = () => {
    if (loading || !product.is_available) return false
    if (productionCapacity === null || productionCapacity === 0) return false
    if (productionCapacity !== Infinity && quantity >= productionCapacity) return false
    return true
  }

  const availability = getAvailabilityStatus()
  const isLowStock = productionCapacity !== null && productionCapacity !== Infinity && productionCapacity <= 5
  const isOutOfStock = productionCapacity === 0

  return (
    <Card
      withBorder
      radius="md"
      style={{
        opacity: !product.is_available || isOutOfStock ? 0.6 : 1,
        borderColor: isSelected ? '#228be6' : undefined,
        borderWidth: isSelected ? 2 : 1,
      }}
    >
      <Stack gap="sm">
        {/* Ürün Başlığı */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text fw={500} size="md" lineClamp={2}>
              {product.name}
            </Text>
            {product.description && (
              <Text size="sm" c="dimmed" lineClamp={2}>
                {product.description}
              </Text>
            )}
          </div>
          
          {/* Stok Durumu Badge'i */}
          <Group gap="xs">
            {loading ? (
              <Loader size="xs" />
            ) : (
              <Tooltip label={`Stok durumu: ${availability.text}`}>
                <Badge
                  color={availability.color}
                  variant="light"
                  size="sm"
                  style={{ cursor: 'help' }}
                >
                  {availability.text}
                </Badge>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Kategori ve Fiyat */}
        <Group justify="space-between" align="center">
          {product.categories && (
            <Badge
              color={product.categories.color || 'blue'}
              variant="outline"
              size="sm"
              leftSection={<IconChefHat size="0.7rem" />}
            >
              {product.categories.name}
            </Badge>
          )}
          
          <Text fw={700} size="lg" c="green">
            ₺{product.price.toFixed(2)}
          </Text>
        </Group>

        {/* Uyarı Mesajları */}
        {!product.is_available && (
          <Alert color="red" icon={<IconX size="0.8rem" />}>
            Bu ürün şu anda mevcut değil
          </Alert>
        )}

        {isOutOfStock && product.is_available && (
          <Alert color="red" icon={<IconAlertTriangle size="0.8rem" />}>
            Stok tükendi - Üretim yapılamıyor
          </Alert>
        )}

        {isLowStock && !isOutOfStock && (
          <Alert color="yellow" icon={<IconInfoCircle size="0.8rem" />}>
            Düşük stok seviyesi - Dikkatli sipariş alın
          </Alert>
        )}

        {/* Miktar ve Ekleme Butonları */}
        {product.is_available && !isOutOfStock && (
          <Group justify="space-between" align="center">
            {/* Miktar Kontrolü */}
            <Group gap="xs">
              <Button
                size="xs"
                variant="outline"
                onClick={() => onQuantityChange(product.id, Math.max(0, quantity - 1))}
                disabled={quantity <= 0}
              >
                -
              </Button>
              
              <Text fw={500} style={{ minWidth: '20px', textAlign: 'center' }}>
                {quantity}
              </Text>
              
              <Button
                size="xs"
                variant="outline"
                onClick={() => onQuantityChange(product.id, quantity + 1)}
                disabled={
                  productionCapacity !== null && 
                  productionCapacity !== Infinity && 
                  quantity >= productionCapacity
                }
              >
                +
              </Button>
            </Group>

            {/* Sepete Ekle Butonu */}
            <Button
              size="sm"
              disabled={!canAddToOrder() || quantity === 0}
              onClick={() => onAddToOrder(product.id)}
              leftSection={<IconCheck size="0.8rem" />}
            >
              Sepete Ekle
            </Button>
          </Group>
        )}

        {/* Kapasite Bilgisi */}
        {!loading && productionCapacity !== null && productionCapacity !== Infinity && (
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              Maksimum sipariş: {productionCapacity} porsiyon
            </Text>
            {quantity > 0 && (
              <Text size="xs" c={quantity <= productionCapacity ? 'green' : 'red'}>
                Seçilen: {quantity}
              </Text>
            )}
          </Group>
        )}
      </Stack>
    </Card>
  )
} 