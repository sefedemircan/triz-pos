'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Select,
  NumberInput,
  Button,
  Group,
  Table,
  Text,
  Badge,
  ActionIcon,
  Alert,
  Switch,
  Card,
  ThemeIcon,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconPlus, 
  IconTrash, 
  IconAlertTriangle, 
  IconCheck,
  IconChefHat,
  IconCurrencyLira,
  IconPercentage,
} from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Database } from '@/lib/types/database'

type Product = Database['public']['Tables']['products']['Row'] & {
  categories?: Database['public']['Tables']['categories']['Row']
}
type StockItem = Database['public']['Tables']['stock_items']['Row'] & {
  stock_categories?: Database['public']['Tables']['stock_categories']['Row']
}
type ProductRecipe = Database['public']['Tables']['product_recipes']['Row'] & {
  stock_items?: StockItem
}

interface ProductRecipeModalProps {
  opened: boolean
  onClose: () => void
  onSuccess: () => void
  product: Product | null
}

interface RecipeForm {
  stock_item_id: string
  quantity_needed: number
  unit: string
  is_critical: boolean
  cost_percentage: number
}

export function ProductRecipeModal({ opened, onClose, onSuccess, product }: ProductRecipeModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [recipes, setRecipes] = useState<ProductRecipe[]>([])
  const [addingIngredient, setAddingIngredient] = useState(false)

  const form = useForm<RecipeForm>({
    initialValues: {
      stock_item_id: '',
      quantity_needed: 0,
      unit: '',
      is_critical: false,
      cost_percentage: 0,
    },
    validate: {
      stock_item_id: (value) => !value ? 'Malzeme seçimi zorunlu' : null,
      quantity_needed: (value) => value <= 0 ? 'Miktar 0\'dan büyük olmalı' : null,
      cost_percentage: (value) => value < 0 || value > 100 ? 'Maliyet yüzdesi 0-100 arasında olmalı' : null,
    },
  })

  const fetchData = async () => {
    if (!product) return

    try {
      const supabase = createClient()

      // Stok kalemlerini getir
      const { data: stockData } = await supabase
        .from('stock_items')
        .select(`
          *,
          stock_categories (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('is_active', true)
        .order('name')

      // Mevcut reçeteleri getir
      const { data: recipeData } = await supabase
        .from('product_recipes')
        .select(`
          *,
          stock_items (
            id,
            name,
            unit,
            current_stock,
            min_stock_level,
            unit_cost,
            stock_categories (
              name,
              color,
              icon
            )
          )
        `)
        .eq('product_id', product.id)
        .order('created_at')

      setStockItems(stockData || [])
      setRecipes(recipeData || [])
    } catch (error) {
      console.error('Recipe data fetch error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Reçete verileri yüklenirken hata oluştu',
        color: 'red',
      })
    }
  }

  useEffect(() => {
    if (opened && product) {
      fetchData()
    }
  }, [opened, product])

  const handleAddIngredient = async (values: RecipeForm) => {
    if (!user || !product) return

    // Aynı malzeme zaten ekli mi kontrol et
    const existingRecipe = recipes.find(r => r.stock_item_id === values.stock_item_id)
    if (existingRecipe) {
      notifications.show({
        title: 'Uyarı',
        message: 'Bu malzeme zaten reçetede mevcut',
        color: 'yellow',
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('product_recipes')
        .insert({
          product_id: product.id,
          stock_item_id: values.stock_item_id,
          quantity_needed: values.quantity_needed,
          unit: values.unit,
          is_critical: values.is_critical,
          cost_percentage: values.cost_percentage,
        })

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Malzeme reçeteye eklendi',
        color: 'green',
        icon: <IconCheck size="1rem" />,
      })

      form.reset()
      setAddingIngredient(false)
      fetchData()
    } catch (error) {
      console.error('Add ingredient error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Malzeme eklenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveIngredient = async (recipeId: string) => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('product_recipes')
        .delete()
        .eq('id', recipeId)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Malzeme reçeteden çıkarıldı',
        color: 'green',
      })

      fetchData()
    } catch (error) {
      console.error('Remove ingredient error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Malzeme çıkarılırken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalCost = () => {
    return recipes.reduce((total, recipe) => {
      const stockItem = recipe.stock_items
      if (stockItem) {
        return total + (recipe.quantity_needed * stockItem.unit_cost)
      }
      return total
    }, 0)
  }

  const calculateProfitMargin = () => {
    const totalCost = calculateTotalCost()
    if (totalCost === 0 || !product) return 0
    return ((product.price - totalCost) / product.price) * 100
  }

  const getStockAvailability = (recipe: ProductRecipe) => {
    const stockItem = recipe.stock_items
    if (!stockItem) return { available: 0, color: 'red' }

    const availablePortions = Math.floor(stockItem.current_stock / recipe.quantity_needed)
    const color = availablePortions >= 10 ? 'green' : availablePortions >= 5 ? 'yellow' : 'red'
    
    return { available: availablePortions, color }
  }

  const canProduce = () => {
    return recipes.every(recipe => {
      const stockItem = recipe.stock_items
      if (!stockItem) return false
      return stockItem.current_stock >= recipe.quantity_needed
    })
  }

  const getMinProduciblePortions = () => {
    if (recipes.length === 0) return 0
    
    return Math.min(...recipes.map(recipe => {
      const stockItem = recipe.stock_items
      if (!stockItem) return 0
      return Math.floor(stockItem.current_stock / recipe.quantity_needed)
    }))
  }

  const stockItemOptions = stockItems
    .filter(item => !recipes.some(r => r.stock_item_id === item.id))
    .map(item => ({
      value: item.id,
      label: `${item.name} (${item.current_stock.toFixed(1)} ${item.unit})`,
      unit: item.unit,
    }))

  const selectedStockItem = stockItems.find(item => item.id === form.values.stock_item_id)

  if (!product) return null

  const totalCost = calculateTotalCost()
  const profitMargin = calculateProfitMargin()
  const minPortions = getMinProduciblePortions()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${product.name} - Reçete Yönetimi`}
      size="xl"
    >
      <Stack gap="md">
        {/* Ürün Özeti */}
        <Card withBorder>
          <Group justify="space-between">
            <div>
              <Text fw={500} size="lg">{product.name}</Text>
              <Text size="sm" c="dimmed">{product.categories?.name}</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text fw={500} size="lg" c="green">₺{product.price.toFixed(2)}</Text>
              <Text size="sm" c="dimmed">Satış Fiyatı</Text>
            </div>
          </Group>
        </Card>

        {/* Maliyet Analizi */}
        <Card withBorder>
          <Text fw={500} mb="sm">Maliyet Analizi</Text>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <ThemeIcon size="sm" color="red" variant="light">
                <IconCurrencyLira size="0.8rem" />
              </ThemeIcon>
              <Text size="sm">Toplam Maliyet:</Text>
            </Group>
            <Text fw={500}>₺{totalCost.toFixed(2)}</Text>
          </Group>
          
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <ThemeIcon size="sm" color="green" variant="light">
                <IconPercentage size="0.8rem" />
              </ThemeIcon>
              <Text size="sm">Kâr Marjı:</Text>
            </Group>
            <Text fw={500} c={profitMargin > 30 ? 'green' : profitMargin > 15 ? 'yellow' : 'red'}>
              %{profitMargin.toFixed(1)}
            </Text>
          </Group>

          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="sm" color="blue" variant="light">
                <IconChefHat size="0.8rem" />
              </ThemeIcon>
              <Text size="sm">Üretilebilir Porsiyon:</Text>
            </Group>
            <Badge color={minPortions >= 10 ? 'green' : minPortions >= 5 ? 'yellow' : 'red'}>
              {minPortions} porsiyon
            </Badge>
          </Group>
        </Card>

        {/* Mevcut Reçete */}
        <div>
          <Group justify="space-between" mb="sm">
            <Text fw={500}>Reçete Malzemeleri</Text>
            <Button
              size="xs"
              leftSection={<IconPlus size="0.8rem" />}
              onClick={() => setAddingIngredient(true)}
              disabled={addingIngredient}
            >
              Malzeme Ekle
            </Button>
          </Group>

          {recipes.length === 0 ? (
            <Alert color="blue">
              Henüz reçete malzemesi eklenmemiş. &quot;Malzeme Ekle&quot; butonuna tıklayarak başlayın.
            </Alert>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Malzeme</Table.Th>
                  <Table.Th>Miktar</Table.Th>
                  <Table.Th>Mevcut Stok</Table.Th>
                  <Table.Th>Porsiyon</Table.Th>
                  <Table.Th>Birim Maliyet</Table.Th>
                  <Table.Th>Kritik</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {recipes.map((recipe) => {
                  const stockItem = recipe.stock_items
                  const availability = getStockAvailability(recipe)
                  
                  return (
                    <Table.Tr key={recipe.id}>
                      <Table.Td>
                        <div>
                          <Text fw={500}>{stockItem?.name}</Text>
                          <Text size="xs" c="dimmed">
                            {stockItem?.stock_categories?.name}
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text>{recipe.quantity_needed} {recipe.unit}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c={stockItem && stockItem.current_stock <= stockItem.min_stock_level ? 'red' : 'green'}>
                          {stockItem?.current_stock.toFixed(1)} {stockItem?.unit}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={availability.color} size="sm">
                          {availability.available}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text>₺{stockItem ? (recipe.quantity_needed * stockItem.unit_cost).toFixed(2) : '0.00'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={recipe.is_critical ? 'red' : 'gray'} variant="light" size="sm">
                          {recipe.is_critical ? 'Kritik' : 'Normal'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          color="red"
                          variant="light"
                          size="sm"
                          onClick={() => handleRemoveIngredient(recipe.id)}
                          loading={loading}
                        >
                          <IconTrash size="0.8rem" />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          )}
        </div>

        {/* Malzeme Ekleme Formu */}
        {addingIngredient && (
          <Card withBorder>
            <form onSubmit={form.onSubmit(handleAddIngredient)}>
              <Stack gap="md">
                <Text fw={500}>Yeni Malzeme Ekle</Text>
                
                <Group grow>
                  <Select
                    label="Malzeme"
                    placeholder="Malzeme seçin"
                    required
                    data={stockItemOptions}
                    searchable
                    {...form.getInputProps('stock_item_id')}
                    onChange={(value) => {
                      form.setFieldValue('stock_item_id', value || '')
                      const selectedItem = stockItems.find(item => item.id === value)
                      if (selectedItem) {
                        form.setFieldValue('unit', selectedItem.unit)
                      }
                    }}
                  />
                  
                  <NumberInput
                    label={`Miktar${form.values.unit ? ` (${form.values.unit})` : ''}`}
                    placeholder="0"
                    min={0}
                    step={0.001}
                    required
                    {...form.getInputProps('quantity_needed')}
                  />
                </Group>

                <Group grow>
                  <NumberInput
                    label="Maliyet Yüzdesi (%)"
                    placeholder="0-100"
                    min={0}
                    max={100}
                    step={0.1}
                    {...form.getInputProps('cost_percentage')}
                  />
                  
                  <Switch
                    label="Kritik Malzeme"
                    description="Bu malzeme olmadan ürün yapılamaz"
                    {...form.getInputProps('is_critical', { type: 'checkbox' })}
                  />
                </Group>

                {selectedStockItem && (
                  <Alert color="blue" title="Malzeme Bilgisi">
                    <Group justify="space-between">
                      <Text size="sm">Mevcut Stok:</Text>
                      <Text fw={500}>{selectedStockItem.current_stock.toFixed(1)} {selectedStockItem.unit}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm">Birim Maliyet:</Text>
                      <Text fw={500}>₺{selectedStockItem.unit_cost.toFixed(2)}</Text>
                    </Group>
                  </Alert>
                )}

                <Group justify="flex-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAddingIngredient(false)
                      form.reset()
                    }}
                    disabled={loading}
                  >
                    İptal
                  </Button>
                  <Button type="submit" loading={loading}>
                    Ekle
                  </Button>
                </Group>
              </Stack>
            </form>
          </Card>
        )}

        {/* Uyarılar */}
        {recipes.length > 0 && !canProduce() && (
          <Alert color="red" icon={<IconAlertTriangle size="1rem" />}>
            Bu ürün şu anda üretilemiyor! Bazı malzemeler stokta yeterli değil.
          </Alert>
        )}

        {profitMargin < 15 && totalCost > 0 && (
          <Alert color="yellow" icon={<IconAlertTriangle size="1rem" />}>
            Kâr marjı düşük (%{profitMargin.toFixed(1)}). Maliyetleri veya satış fiyatını gözden geçirin.
          </Alert>
        )}

        {/* Butonlar */}
        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={onClose}>
            Kapat
          </Button>
          <Button onClick={() => { onSuccess(); onClose(); }}>
            Tamamla
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
} 