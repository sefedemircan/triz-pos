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
  Table,
  ScrollArea,
  ActionIcon,
  Progress,
  ThemeIcon,
  Alert,
  Tabs,
  TextInput,
  Select,
  Menu,
} from '@mantine/core'
import {
  IconBox,
  IconRefresh,
  IconPlus,
  IconSearch,
  IconFilter,
  IconAlertTriangle,
  IconTrendingDown,
  IconPackage,
  IconCurrencyLira,
  IconChefHat,
  IconCup,
  IconSpray,
  IconTool,
  IconEdit,
  IconHistory,
  IconAlertCircle,
  IconDots,
  IconArrowUp,
  IconArrowDown,
  IconAdjustments,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { StockItemModal } from '@/components/modals/StockItemModal'
import { StockMovementModal } from '@/components/modals/StockMovementModal'
import { StockHistoryModal } from '@/components/modals/StockHistoryModal'
import { QuickStockActions } from '@/components/QuickStockActions'
import type { Database } from '@/lib/types/database'

type StockCategory = Database['public']['Tables']['stock_categories']['Row']
type StockItem = Database['public']['Tables']['stock_items']['Row'] & {
  stock_categories?: StockCategory
}
type StockAlert = Database['public']['Tables']['stock_alerts']['Row'] & {
  stock_items?: StockItem
}

interface StockStats {
  totalItems: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  totalCategories: number
  criticalAlerts: number
}

export default function AdminStockPage() {
  const { user } = useAuth()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<StockCategory[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [stats, setStats] = useState<StockStats>({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalCategories: 0,
    criticalAlerts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  // Modal states
  const [itemModalOpened, setItemModalOpened] = useState(false)
  const [movementModalOpened, setMovementModalOpened] = useState(false)
  const [historyModalOpened, setHistoryModalOpened] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Stok kategorileri
      const { data: categoriesData } = await supabase
        .from('stock_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      // Stok kalemleri
      const { data: itemsData } = await supabase
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
      
      // Aktif uyarılar
      const { data: alertsData } = await supabase
        .from('stock_alerts')
        .select(`
          *,
          stock_items (
            id,
            name,
            unit,
            current_stock
          )
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })

      setCategories(categoriesData || [])
      setStockItems(itemsData || [])
      setAlerts(alertsData || [])

      // İstatistikleri hesapla
      if (itemsData) {
        const totalValue = itemsData.reduce((sum, item) => 
          sum + (item.current_stock * item.unit_cost), 0
        )
        const lowStockItems = itemsData.filter(item => 
          item.current_stock <= item.min_stock_level && item.current_stock > 0
        ).length
        const outOfStockItems = itemsData.filter(item => 
          item.current_stock <= 0
        ).length

        setStats({
          totalItems: itemsData.length,
          totalValue,
          lowStockItems,
          outOfStockItems,
          totalCategories: categoriesData?.length || 0,
          criticalAlerts: alertsData?.length || 0,
        })
      }
    } catch (error) {
      console.error('Data fetch error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Stok verileri yüklenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Real-time güncellemeler
    const supabase = createClient()
    const subscription = supabase
      .channel('stock-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_items',
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_alerts',
        },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_movements',
        },
        () => fetchData()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Modal handlers
  const handleNewItem = () => {
    setSelectedItem(null)
    setItemModalOpened(true)
  }

  const handleEditItem = (item: StockItem) => {
    setSelectedItem(item)
    setItemModalOpened(true)
  }

  const handleStockMovement = (item: StockItem) => {
    setSelectedItem(item)
    setMovementModalOpened(true)
  }

  const handleStockHistory = (item: StockItem) => {
    setSelectedItem(item)
    setHistoryModalOpened(true)
  }

  const handleModalSuccess = () => {
    fetchData()
  }

  const getFilteredItems = () => {
    let filtered = stockItems

    // Arama filtresi
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Kategori filtresi
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category_id === categoryFilter)
    }

    // Stok durumu filtresi
    if (stockFilter) {
      switch (stockFilter) {
        case 'low':
          filtered = filtered.filter(item => 
            item.current_stock <= item.min_stock_level && item.current_stock > 0
          )
          break
        case 'out':
          filtered = filtered.filter(item => item.current_stock <= 0)
          break
        case 'normal':
          filtered = filtered.filter(item => item.current_stock > item.min_stock_level)
          break
      }
    }

    // Tab filtresi
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'low':
          filtered = filtered.filter(item => 
            item.current_stock <= item.min_stock_level && item.current_stock > 0
          )
          break
        case 'out':
          filtered = filtered.filter(item => item.current_stock <= 0)
          break
        case 'normal':
          filtered = filtered.filter(item => item.current_stock > item.min_stock_level)
          break
      }
    }

    return filtered
  }

  const getStockStatusColor = (item: StockItem) => {
    if (item.current_stock <= 0) return 'red'
    if (item.current_stock <= item.min_stock_level) return 'yellow'
    return 'green'
  }

  const getStockStatusText = (item: StockItem) => {
    if (item.current_stock <= 0) return 'Tükendi'
    if (item.current_stock <= item.min_stock_level) return 'Kritik'
    return 'Normal'
  }

  const getCategoryIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      IconChefHat,
      IconCup,
      IconSpray,
      IconPackage,
      IconTool,
      IconBox,
    }
    return iconMap[iconName] || IconBox
  }

  const statCards = [
    {
      title: 'Toplam Ürün',
      value: stats.totalItems,
      icon: IconPackage,
      color: 'blue',
    },
    {
      title: 'Toplam Değer',
      value: `₺${stats.totalValue.toFixed(2)}`,
      icon: IconCurrencyLira,
      color: 'green',
    },
    {
      title: 'Kritik Stok',
      value: stats.lowStockItems,
      icon: IconAlertTriangle,
      color: 'yellow',
    },
    {
      title: 'Tükenen Stok',
      value: stats.outOfStockItems,
      icon: IconTrendingDown,
      color: 'red',
    },
    {
      title: 'Kategori Sayısı',
      value: stats.totalCategories,
      icon: IconBox,
      color: 'purple',
    },
    {
      title: 'Aktif Uyarı',
      value: stats.criticalAlerts,
      icon: IconAlertCircle,
      color: 'orange',
    },
  ]

  const filteredItems = getFilteredItems()

  return (
    <DashboardLayout>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={1}>
              <IconBox size="2rem" style={{ marginRight: 8 }} />
              Stok Yönetimi
            </Title>
            <Text c="dimmed">Hoş geldiniz, {user?.full_name} - Stok Kontrolü</Text>
          </div>
          <Group>
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={handleNewItem}
            >
              Yeni Stok
            </Button>
            <ActionIcon
              variant="outline"
              size="lg"
              onClick={fetchData}
              loading={loading}
            >
              <IconRefresh size="1.1rem" />
            </ActionIcon>
          </Group>
        </Group>

        {/* İstatistik Kartları */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {statCards.map((stat) => (
            <Card 
              key={stat.title} 
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
                  <Text size="sm" c="dimmed" fw={700}>
                    {stat.title}
                  </Text>
                  <Text fw={700} size="xl">
                    {stat.value}
                  </Text>
                </div>
                <ThemeIcon
                  color={stat.color}
                  variant="light"
                  size="lg"
                  radius="md"
                >
                  <stat.icon size="1.4rem" />
                </ThemeIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        {/* Kritik Uyarılar */}
        {alerts.length > 0 && (
          <Alert 
            icon={<IconAlertTriangle size="1rem" />} 
            color="orange"
            title="Stok Uyarıları"
          >
            <Stack gap="xs">
              {alerts.slice(0, 3).map((alert) => (
                <Group key={alert.id} justify="space-between">
                  <Text size="sm">
                    <strong>{alert.stock_items?.name}</strong> - {alert.message}
                  </Text>
                  <Badge color={alert.alert_type === 'out_of_stock' ? 'red' : 'yellow'} size="sm">
                    {alert.alert_type === 'out_of_stock' ? 'Tükendi' : 'Kritik'}
                  </Badge>
                </Group>
              ))}
              {alerts.length > 3 && (
                <Text size="xs" c="dimmed">
                  +{alerts.length - 3} uyarı daha...
                </Text>
              )}
            </Stack>
          </Alert>
        )}

        {/* Filtreler */}
        <Card withBorder>
          <Group>
            <TextInput
              placeholder="Stok ara..."
              leftSection={<IconSearch size="1rem" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Kategori"
              leftSection={<IconFilter size="1rem" />}
              data={[
                { value: '', label: 'Tüm Kategoriler' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value || '')}
              style={{ minWidth: 200 }}
            />
            <Select
              placeholder="Stok Durumu"
              data={[
                { value: '', label: 'Tüm Durumlar' },
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Kritik' },
                { value: 'out', label: 'Tükendi' },
              ]}
              value={stockFilter}
              onChange={(value) => setStockFilter(value || '')}
              style={{ minWidth: 150 }}
            />
          </Group>
        </Card>

        {/* Stok Listesi */}
        <Card withBorder>
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')}>
            <Tabs.List>
              <Tabs.Tab value="all">
                Tümü ({stockItems.length})
              </Tabs.Tab>
              <Tabs.Tab value="normal" color="green">
                Normal ({stockItems.filter(i => i.current_stock > i.min_stock_level).length})
              </Tabs.Tab>
              <Tabs.Tab value="low" color="yellow">
                Kritik ({stats.lowStockItems})
              </Tabs.Tab>
              <Tabs.Tab value="out" color="red">
                Tükendi ({stats.outOfStockItems})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab} pt="md">
              <ScrollArea>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Ürün</Table.Th>
                      <Table.Th>Kategori</Table.Th>
                      <Table.Th>Mevcut Stok</Table.Th>
                      <Table.Th>Min. Seviye</Table.Th>
                      <Table.Th>Birim Fiyat</Table.Th>
                      <Table.Th>Toplam Değer</Table.Th>
                      <Table.Th>Durum</Table.Th>
                      <Table.Th>İşlemler</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredItems.map((item) => {
                      const CategoryIcon = getCategoryIcon(item.stock_categories?.icon || 'IconBox')
                      const stockPercentage = item.max_stock_level > 0 
                        ? (item.current_stock / item.max_stock_level) * 100 
                        : 0
                      
                      return (
                        <Table.Tr key={item.id}>
                          <Table.Td>
                            <div>
                              <Text fw={500}>{item.name}</Text>
                              {item.supplier && (
                                <Text size="xs" c="dimmed">{item.supplier}</Text>
                              )}
                            </div>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ThemeIcon
                                size="sm"
                                color={item.stock_categories?.color}
                                variant="light"
                              >
                                <CategoryIcon size="0.8rem" />
                              </ThemeIcon>
                              <Text size="sm">{item.stock_categories?.name}</Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Stack gap="xs">
                              <Text fw={500}>
                                {item.current_stock.toFixed(1)} {item.unit}
                              </Text>
                              {item.max_stock_level > 0 && (
                                <Progress
                                  value={stockPercentage}
                                  color={getStockStatusColor(item)}
                                  size="sm"
                                />
                              )}
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {item.min_stock_level.toFixed(1)} {item.unit}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              ₺{item.unit_cost.toFixed(2)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" fw={500} c="green">
                              ₺{(item.current_stock * item.unit_cost).toFixed(2)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge 
                              color={getStockStatusColor(item)} 
                              variant="light"
                              size="sm"
                            >
                              {getStockStatusText(item)}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon 
                                variant="light" 
                                color="blue" 
                                size="sm"
                                onClick={() => handleEditItem(item)}
                              >
                                <IconEdit size="0.8rem" />
                              </ActionIcon>
                              
                              <Menu shadow="md" width={200}>
                                <Menu.Target>
                                  <ActionIcon 
                                    variant="light" 
                                    color="gray" 
                                    size="sm"
                                  >
                                    <IconDots size="0.8rem" />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item
                                    leftSection={<IconArrowUp size="0.8rem" />}
                                    color="green"
                                    onClick={() => handleStockMovement(item)}
                                  >
                                    Stok Girişi
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<IconArrowDown size="0.8rem" />}
                                    color="red"
                                    onClick={() => handleStockMovement(item)}
                                  >
                                    Stok Çıkışı
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<IconAdjustments size="0.8rem" />}
                                    color="blue"
                                    onClick={() => handleStockMovement(item)}
                                  >
                                    Stok Düzeltme
                                  </Menu.Item>
                                  <Menu.Divider />
                                  <Menu.Item
                                    leftSection={<IconHistory size="0.8rem" />}
                                    onClick={() => handleStockHistory(item)}
                                  >
                                    Hareket Geçmişi
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      )
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>

              {filteredItems.length === 0 && (
                <Alert color="blue" mt="md">
                  {searchQuery || categoryFilter || stockFilter
                    ? 'Filtrelere uygun stok kalemi bulunamadı.'
                    : 'Henüz stok kalemi bulunmuyor.'}
                </Alert>
              )}
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>

      {/* Modal'lar */}
      <StockItemModal
        opened={itemModalOpened}
        onClose={() => setItemModalOpened(false)}
        onSuccess={handleModalSuccess}
        item={selectedItem}
        categories={categories}
      />

      <StockMovementModal
        opened={movementModalOpened}
        onClose={() => setMovementModalOpened(false)}
        onSuccess={handleModalSuccess}
        item={selectedItem}
      />

      <StockHistoryModal
        opened={historyModalOpened}
        onClose={() => {
          setHistoryModalOpened(false)
          setSelectedItem(null)
        }}
        stockItem={selectedItem}
      />
    </DashboardLayout>
  )
} 