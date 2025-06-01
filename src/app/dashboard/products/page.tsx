'use client'

import { useEffect, useState } from 'react'
import {
  Stack,
  Title,
  Group,
  Button,
  TextInput,
  Select,
  Card,
  Text,
  Badge,
  ActionIcon,
  Modal,
  NumberInput,
  Textarea,
  SimpleGrid,
  Alert,
  Loader,
  Center,
  Image,
  Box,
} from '@mantine/core'
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconChefHat,
  IconCurrencyLira,
  IconInfoCircle,
  IconPhoto,
  IconPhotoOff,
} from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface ProductWithCategory extends Product {
  categories?: Category
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpened, setModalOpened] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      price: 0,
      category_id: '',
      image_url: '',
      is_available: true,
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Ürün adı en az 2 karakter olmalı' : null),
      price: (value) => (value <= 0 ? 'Fiyat 0\'dan büyük olmalı' : null),
      category_id: (value) => (!value ? 'Kategori seçmelisiniz' : null),
      image_url: (value) => {
        if (value && !isValidImageUrl(value)) {
          return 'Geçerli bir resim URL\'si girin (jpg, jpeg, png, gif, webp)'
        }
        return null
      },
    },
  })

  const fetchProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            color
          )
        `)
        .order('name')

      if (error) {
        console.error('Products query error:', error)
        throw error
      }
      
      console.log('Products fetched successfully:', data?.length || 0, 'items')
      setProducts(data || [])
    } catch (error) {
      console.error('Products fetch error:', error)
      notifications.show({
        title: 'Hata',
        message: `Ürünler yüklenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
        color: 'red',
      })
    }
  }

  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Categories fetch error:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchCategories()])
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const supabase = createClient()

      if (editingProduct) {
        // Güncelleme
        const { error } = await supabase
          .from('products')
          .update({
            name: values.name,
            description: values.description,
            price: values.price,
            category_id: values.category_id,
            image_url: values.image_url || null,
            is_available: values.is_available,
          })
          .eq('id', editingProduct.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Ürün güncellendi',
          color: 'green',
        })
      } else {
        // Yeni ekleme
        const { error } = await supabase
          .from('products')
          .insert({
            name: values.name,
            description: values.description,
            price: values.price,
            category_id: values.category_id,
            image_url: values.image_url || null,
            is_available: values.is_available,
          })

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Ürün eklendi',
          color: 'green',
        })
      }

      setModalOpened(false)
      setEditingProduct(null)
      form.reset()
      fetchProducts()
    } catch (error) {
      console.error('Product save error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Ürün kaydedilirken hata oluştu',
        color: 'red',
      })
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    form.setValues({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id,
      image_url: product.image_url || '',
      is_available: product.is_available,
    })
    setModalOpened(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.name}" ürününü silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Ürün silindi',
        color: 'green',
      })

      fetchProducts()
    } catch (error) {
      console.error('Product delete error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Ürün silinirken hata oluştu',
        color: 'red',
      })
    }
  }

  const handleNewProduct = () => {
    setEditingProduct(null)
    form.reset()
    setModalOpened(true)
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  // URL validasyon fonksiyonu
  const isValidImageUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      const pathname = urlObj.pathname.toLowerCase()
      return validExtensions.some(ext => pathname.endsWith(ext)) || 
             url.includes('unsplash.com') || 
             url.includes('images.') ||
             url.includes('cdn.') ||
             url.includes('imgur.com')
    } catch {
      return false
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Center h={400}>
          <Stack align="center">
            <Loader size="lg" />
            <Text>Ürünler yükleniyor...</Text>
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
            <Title order={1}>Ürünler</Title>
            <Text c="dimmed">Menü ürünlerini yönetin</Text>
          </div>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleNewProduct}
          >
            Yeni Ürün
          </Button>
        </Group>

        {/* Filtreler */}
        <Card withBorder p="md">
          <Group>
            <TextInput
              placeholder="Ürün ara..."
              leftSection={<IconSearch size="1rem" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
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
        </Card>

        {/* Ürün Listesi */}
        {filteredProducts.length === 0 ? (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            {searchQuery || selectedCategory ? 'Filtrelere uygun ürün bulunamadı.' : 'Henüz ürün eklenmemiş.'}
          </Alert>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
            {filteredProducts.map((product) => (
              <Card key={product.id} withBorder>
                {/* Ürün Görseli */}
                {product.image_url ? (
                  <Card.Section>
                    <Image
                      src={product.image_url}
                      height={160}
                      alt={product.name}
                      fallbackSrc="https://via.placeholder.com/300x160?text=Resim+Yüklenemedi"
                      onError={() => {
                        console.log('Image load error for:', product.image_url)
                      }}
                    />
                  </Card.Section>
                ) : (
                  <Card.Section>
                    <Box
                      h={160}
                      style={{
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <IconPhotoOff size="2rem" color="#adb5bd" />
                      <Text size="sm" c="dimmed">Resim yok</Text>
                    </Box>
                  </Card.Section>
                )}

                <Stack gap="md" p="md">
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Text fw={500} size="lg">{product.name}</Text>
                      {product.description && (
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {product.description}
                        </Text>
                      )}
                    </div>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => handleEdit(product)}
                      >
                        <IconEdit size="1rem" />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => handleDelete(product)}
                      >
                        <IconTrash size="1rem" />
                      </ActionIcon>
                    </Group>
                  </Group>

                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <IconCurrencyLira size="1rem" />
                      <Text fw={700} size="lg" c="green">
                        {product.price.toFixed(2)}
                      </Text>
                    </Group>
                    <Badge
                      color={product.is_available ? 'green' : 'red'}
                      variant="light"
                    >
                      {product.is_available ? 'Mevcut' : 'Tükendi'}
                    </Badge>
                  </Group>

                  {product.categories && (
                    <Badge
                      color={product.categories.color || 'blue'}
                      variant="outline"
                      size="sm"
                    >
                      <IconChefHat size="0.8rem" style={{ marginRight: 4 }} />
                      {product.categories.name}
                    </Badge>
                  )}
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Ürün Ekleme/Düzenleme Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => {
            setModalOpened(false)
            setEditingProduct(null)
            form.reset()
          }}
          title={editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          size="md"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Ürün Adı"
                placeholder="Örn: Türk Kahvesi"
                required
                {...form.getInputProps('name')}
              />

              <Textarea
                label="Açıklama"
                placeholder="Ürün açıklaması (opsiyonel)"
                rows={3}
                {...form.getInputProps('description')}
              />

              <NumberInput
                label="Fiyat (₺)"
                placeholder="0.00"
                min={0}
                step={0.01}
                decimalScale={2}
                required
                {...form.getInputProps('price')}
              />

              <Select
                label="Kategori"
                placeholder="Kategori seçin"
                required
                data={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                {...form.getInputProps('category_id')}
              />

              <TextInput
                label="Resim URL"
                placeholder="https://example.com/image.jpg"
                leftSection={<IconPhoto size="1rem" />}
                description="Ürün fotoğrafının URL'sini girin (jpg, png, gif, webp formatları desteklenir)"
                {...form.getInputProps('image_url')}
              />

              {/* Resim Önizlemesi */}
              {form.values.image_url && isValidImageUrl(form.values.image_url) && (
                <Box>
                  <Text size="sm" fw={500} mb="xs">Resim Önizlemesi:</Text>
                  <Image
                    src={form.values.image_url}
                    height={120}
                    width={200}
                    alt="Önizleme"
                    radius="md"
                    fallbackSrc="https://via.placeholder.com/200x120?text=Resim+Yüklenemedi"
                    style={{ border: '1px solid #e9ecef' }}
                  />
                </Box>
              )}

              <Select
                label="Durum"
                data={[
                  { value: 'true', label: 'Mevcut' },
                  { value: 'false', label: 'Tükendi' },
                ]}
                value={form.values.is_available.toString()}
                onChange={(value) => form.setFieldValue('is_available', value === 'true')}
              />

              <Group justify="flex-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalOpened(false)
                    setEditingProduct(null)
                    form.reset()
                  }}
                >
                  İptal
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Güncelle' : 'Ekle'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </DashboardLayout>
  )
} 