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
  ActionIcon,
  Box,
  ThemeIcon,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconChefHat,
  IconInfoCircle,
  IconMinus,
  IconPlus,
  IconShoppingCart,
  IconCurrencyLira,
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
      className={`cafe-card hover-lift ${isSelected ? 'cafe-card-active' : ''}`}
      style={{
        opacity: !product.is_available || isOutOfStock ? 0.6 : 1,
        border: isSelected ? '2px solid var(--cafe-primary)' : undefined,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isSelected ? 'var(--background-tertiary)' : 'var(--card-bg)',
      }}
    >
      <Stack gap="md">
        {/* Ürün Başlığı ve Stok Badge */}
        <Group justify="space-between" align="flex-start">
          <Box style={{ flex: 1 }}>
            <Text fw={600} size="lg" c="var(--foreground)" lineClamp={2}>
              {product.name}
            </Text>
            {product.description && (
              <Text size="sm" c="var(--foreground-muted)" lineClamp={2} mt={4}>
                {product.description}
              </Text>
            )}
          </Box>
          
          {/* Stok Durumu Badge'i */}
          <Group gap="xs">
            {loading ? (
              <Loader size="sm" color="orange" />
            ) : (
              <Tooltip label={`Stok durumu: ${availability.text}`} position="top">
                <Badge
                  color={availability.color}
                  variant="light"
                  size="md"
                  style={{ 
                    cursor: 'help',
                    fontWeight: 600,
                  }}
                  className="hover-glow"
                >
                  {availability.text}
                </Badge>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Kategori ve Fiyat */}
        <Group justify="space-between" align="center" mt="sm">
          {product.categories && (
            <Badge
              color="orange"
              variant="light"
              size="md"
              leftSection={<IconChefHat size="0.8rem" />}
              className="hover-scale"
              style={{
                background: 'var(--cafe-cream)',
                color: 'var(--cafe-primary)',
                border: '1px solid var(--cafe-peach)',
              }}
            >
              {product.categories.name}
            </Badge>
          )}
          
          <Group gap="xs" align="center">
            <ThemeIcon
              size="lg"
              radius="md"
              color="green"
              variant="light"
              className="hover-glow"
            >
              <IconCurrencyLira size="1.2rem" />
            </ThemeIcon>
            <Text fw={700} size="xl" c="green" className="animate-pulse">
              {product.price.toFixed(2)}
            </Text>
          </Group>
        </Group>

        {/* Uyarı Mesajları */}
        {!product.is_available && (
          <Alert 
            color="red" 
            icon={<IconX size="1rem" />}
            radius="md"
            className="animate-slide-in-up"
          >
            Bu ürün şu anda mevcut değil
          </Alert>
        )}

        {isOutOfStock && product.is_available && (
          <Alert 
            color="red" 
            icon={<IconAlertTriangle size="1rem" />}
            radius="md"
            className="animate-slide-in-up"
          >
            Stok tükendi - Üretim yapılamıyor
          </Alert>
        )}

        {isLowStock && !isOutOfStock && (
          <Alert 
            color="orange" 
            icon={<IconInfoCircle size="1rem" />}
            radius="md"
            className="animate-slide-in-up"
          >
            Düşük stok seviyesi - Dikkatli sipariş alın
          </Alert>
        )}

        {/* Miktar ve Ekleme Butonları */}
        {product.is_available && !isOutOfStock && (
          <Box mt="md">
            <Group justify="space-between" align="center" mb="sm">
              {/* Miktar Kontrolü */}
              <Group gap="sm" align="center">
                <Text size="sm" fw={500} c="var(--foreground)">
                  Miktar:
                </Text>
                <Group gap="xs" align="center">
                  <ActionIcon
                    size="md"
                    variant="outline"
                    color="orange"
                    onClick={() => onQuantityChange(product.id, Math.max(0, quantity - 1))}
                    disabled={quantity <= 0}
                    className="hover-scale"
                    style={{
                      borderColor: 'var(--cafe-primary)',
                      color: 'var(--cafe-primary)',
                    }}
                  >
                    <IconMinus size="1rem" />
                  </ActionIcon>
                  
                  <Box
                    style={{
                      minWidth: '40px',
                      textAlign: 'center',
                      padding: '8px 12px',
                      background: 'var(--cafe-cream)',
                      border: '1px solid var(--cafe-peach)',
                      borderRadius: '8px',
                      fontWeight: 600,
                      color: 'var(--cafe-primary)',
                    }}
                  >
                    {quantity}
                  </Box>
                  
                  <ActionIcon
                    size="md"
                    variant="outline"
                    color="orange"
                    onClick={() => onQuantityChange(product.id, quantity + 1)}
                    disabled={
                      productionCapacity !== null && 
                      productionCapacity !== Infinity && 
                      quantity >= productionCapacity
                    }
                    className="hover-scale"
                    style={{
                      borderColor: 'var(--cafe-primary)',
                      color: 'var(--cafe-primary)',
                    }}
                  >
                    <IconPlus size="1rem" />
                  </ActionIcon>
                </Group>
              </Group>

              {/* Sepete Ekle Butonu */}
              <Button
                className="cafe-button-primary hover-lift"
                size="md"
                disabled={!canAddToOrder() || quantity === 0}
                onClick={() => onAddToOrder(product.id)}
                leftSection={<IconShoppingCart size="1rem" />}
                style={{
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Sepete Ekle
              </Button>
            </Group>

            {/* Kapasite Bilgisi */}
            {!loading && productionCapacity !== null && productionCapacity !== Infinity && (
              <Group justify="space-between" align="center" mt="sm">
                <Text size="xs" c="var(--foreground-muted)">
                  Maksimum sipariş: {productionCapacity} porsiyon
                </Text>
                {quantity > 0 && (
                  <Badge
                    color={quantity <= productionCapacity ? 'green' : 'red'}
                    variant="light"
                    size="sm"
                  >
                    Seçilen: {quantity}
                  </Badge>
                )}
              </Group>
            )}
          </Box>
        )}
      </Stack>
    </Card>
  )
} 