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
  SimpleGrid,
  Badge,
  NumberInput,
  Textarea,
  Select,
  Alert,
  ActionIcon,
  Divider,
  ScrollArea,
  Image,
  Box,
} from '@mantine/core'
import {
  IconShoppingCart,
  IconPlus,
  IconMinus,
  IconTrash,
  IconCheck,
  IconArrowLeft,
  IconTable,
  IconCurrencyLira,
  IconPhotoOff,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Database } from '@/lib/types/database'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Table = Database['public']['Tables']['tables']['Row']

interface ProductWithCategory extends Product {
  categories?: Category
}

interface CartItem {
  product: ProductWithCategory
  quantity: number
  notes?: string
}

export default function NewOrderPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tableId = searchParams.get('table')

  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<string>(tableId || '')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Ürünleri kategorilerle birlikte al
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            color
          )
        `)
        .eq('is_available', true)
        .order('name')

      // Kategorileri al
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      // Boş masaları al
      const { data: tablesData } = await supabase
        .from('tables')
        .select('*')
        .order('table_number')

      setProducts(productsData || [])
      setCategories(categoriesData || [])
      setTables(tablesData || [])
    } catch (error) {
      console.error('Data fetch error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Veriler yüklenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category_id === selectedCategory)
    : products

  const addToCart = (product: ProductWithCategory) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id)
      if (existingItem) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prev, { product, quantity: 1 }]
      }
    })
  }

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateCartItemNotes = (productId: string, notes: string) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, notes }
          : item
      )
    )
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const submitOrder = async () => {
    if (!selectedTable) {
      notifications.show({
        title: 'Hata',
        message: 'Lütfen bir masa seçin',
        color: 'red',
      })
      return
    }

    if (cart.length === 0) {
      notifications.show({
        title: 'Hata',
        message: 'Sepete en az bir ürün ekleyin',
        color: 'red',
      })
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      
      // Siparişi oluştur
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: selectedTable,
          user_id: user?.id,
          status: 'active',
          total_amount: getTotalAmount(),
          notes: orderNotes || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Sipariş ürünlerini ekle
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        notes: item.notes || null,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Masa durumunu güncelle
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTable)

      notifications.show({
        title: 'Başarılı',
        message: 'Sipariş başarıyla oluşturuldu',
        color: 'green',
      })

      router.push('/dashboard/garson')
    } catch (error) {
      console.error('Order submit error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Sipariş oluşturulurken hata oluştu',
        color: 'red',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getAvailableTables = () => {
    return tables.filter(table => {
      // Eğer URL'den gelen masa varsa, o masayı da dahil et
      if (tableId && table.id === tableId) return true
      // Diğer durumlarda sadece boş masaları göster
      return table.status === 'empty'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Text>Yükleniyor...</Text>
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
                <IconShoppingCart size="2rem" style={{ marginRight: 8 }} />
                Yeni Sipariş
              </Title>
            </Group>
            <Text c="dimmed">Sipariş oluşturun ve sepete ürün ekleyin</Text>
          </div>
        </Group>

        <Group align="flex-start" gap="md">
          {/* Sol Panel - Ürünler */}
          <Card withBorder style={{ flex: 2 }}>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>Ürünler</Title>
                <Select
                  placeholder="Kategori filtrele"
                  data={[
                    { value: '', label: 'Tüm Kategoriler' },
                    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                  ]}
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value || '')}
                  style={{ minWidth: 200 }}
                />
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {filteredProducts.map((product) => (
                  <Card key={product.id} withBorder p="sm">
                    {/* Ürün Görseli */}
                    {product.image_url ? (
                      <Card.Section>
                        <Image
                          src={product.image_url}
                          height={120}
                          alt={product.name}
                          fallbackSrc="https://via.placeholder.com/200x120?text=Resim+Yüklenemedi"
                        />
                      </Card.Section>
                    ) : (
                      <Card.Section>
                        <Box
                          h={120}
                          style={{
                            backgroundColor: '#f8f9fa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '4px'
                          }}
                        >
                          <IconPhotoOff size="1.5rem" color="#adb5bd" />
                          <Text size="xs" c="dimmed">Resim yok</Text>
                        </Box>
                      </Card.Section>
                    )}

                    <Stack gap="xs" mt="sm">
                      <Text fw={500} size="sm">{product.name}</Text>
                      
                      {product.description && (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {product.description}
                        </Text>
                      )}

                      <Group justify="space-between" align="center">
                        <Group gap="xs">
                          <IconCurrencyLira size="0.8rem" />
                          <Text fw={600} c="green">
                            {product.price.toFixed(2)}
                          </Text>
                        </Group>
                        
                        {product.categories && (
                          <Badge
                            color={product.categories.color || 'blue'}
                            variant="light"
                            size="xs"
                          >
                            {product.categories.name}
                          </Badge>
                        )}
                      </Group>

                      <Button
                        size="xs"
                        fullWidth
                        onClick={() => addToCart(product)}
                      >
                        Sepete Ekle
                      </Button>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            </Stack>
          </Card>

          {/* Sağ Panel - Sepet */}
          <Card withBorder style={{ flex: 1, minWidth: 350 }}>
            <Stack gap="md">
              <Title order={3}>
                <IconShoppingCart size="1.5rem" style={{ marginRight: 8 }} />
                Sepet ({cart.length})
              </Title>

              {/* Masa Seçimi */}
              <Select
                label="Masa"
                placeholder="Masa seçin"
                required
                data={getAvailableTables().map(table => ({
                  value: table.id,
                  label: `Masa ${table.table_number} (${table.capacity} kişilik)`
                }))}
                value={selectedTable}
                onChange={(value) => setSelectedTable(value || '')}
                leftSection={<IconTable size="1rem" />}
              />

              <Divider />

              {/* Sepet Ürünleri */}
              <ScrollArea h={300}>
                {cart.length === 0 ? (
                  <Alert color="blue">
                    Sepet boş. Ürün eklemek için sol panelden seçim yapın.
                  </Alert>
                ) : (
                  <Stack gap="sm">
                    {cart.map((item) => (
                      <Card key={item.product.id} withBorder p="sm">
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text fw={500} size="sm">{item.product.name}</Text>
                            <ActionIcon
                              color="red"
                              variant="light"
                              size="sm"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <IconTrash size="0.8rem" />
                            </ActionIcon>
                          </Group>

                          <Group justify="space-between">
                            <Group gap="xs">
                              <ActionIcon
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                              >
                                <IconMinus size="0.8rem" />
                              </ActionIcon>
                              
                              <NumberInput
                                value={item.quantity}
                                onChange={(value) => updateCartItemQuantity(item.product.id, Number(value))}
                                min={1}
                                max={99}
                                size="xs"
                                style={{ width: 60 }}
                              />
                              
                              <ActionIcon
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                              >
                                <IconPlus size="0.8rem" />
                              </ActionIcon>
                            </Group>

                            <Text fw={600} c="green">
                              ₺{(item.product.price * item.quantity).toFixed(2)}
                            </Text>
                          </Group>

                          <Textarea
                            placeholder="Özel not (opsiyonel)"
                            value={item.notes || ''}
                            onChange={(e) => updateCartItemNotes(item.product.id, e.target.value)}
                            size="xs"
                            rows={2}
                          />
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                )}
              </ScrollArea>

              {cart.length > 0 && (
                <>
                  <Divider />
                  
                  {/* Sipariş Notu */}
                  <Textarea
                    label="Sipariş Notu"
                    placeholder="Genel sipariş notu (opsiyonel)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={3}
                  />

                  {/* Toplam */}
                  <Group justify="space-between" p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <Text fw={600} size="lg">Toplam:</Text>
                    <Text fw={700} size="xl" c="green">
                      ₺{getTotalAmount().toFixed(2)}
                    </Text>
                  </Group>

                  {/* Sipariş Ver Butonu */}
                  <Button
                    size="lg"
                    fullWidth
                    onClick={submitOrder}
                    loading={submitting}
                    leftSection={<IconCheck size="1.2rem" />}
                  >
                    Siparişi Onayla
                  </Button>
                </>
              )}
            </Stack>
          </Card>
        </Group>
      </Stack>
    </DashboardLayout>
  )
} 