'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Table,
  Text,
  Badge,
  Group,
  ScrollArea,
  Loader,
  Center,
  Alert,
  Select,
  TextInput,
  Card,
  Pagination,
  Tooltip,
} from '@mantine/core'
import {
  IconArrowUp,
  IconArrowDown,
  IconAdjustments,
  IconAlertTriangle,
  IconSearch,
  IconCalendar,
  IconUser,
  IconReceipt,
} from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type StockItem = Database['public']['Tables']['stock_items']['Row']
type StockMovement = Database['public']['Tables']['stock_movements']['Row'] & {
  users?: { full_name: string } | null
}

interface StockHistoryModalProps {
  opened: boolean
  onClose: () => void
  stockItem: StockItem | null
}

const ITEMS_PER_PAGE = 20

export function StockHistoryModal({ opened, onClose, stockItem }: StockHistoryModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [referenceFilter, setReferenceFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchMovements = async () => {
    if (!stockItem) return

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Query'yi filtrelerle birlikte hazırla
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          users!stock_movements_user_id_fkey (
            full_name
          )
        `, { count: 'exact' })
        .eq('stock_item_id', stockItem.id)
        .order('created_at', { ascending: false })

      // Filtreleri uygula
      if (typeFilter) {
        query = query.eq('movement_type', typeFilter)
      }
      
      if (referenceFilter) {
        query = query.eq('reference_type', referenceFilter)
      }

      if (searchQuery) {
        query = query.or(`notes.ilike.%${searchQuery}%,reference_id.ilike.%${searchQuery}%`)
      }

      // Sayfalama uygula
      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      
      const { data, error, count } = await query.range(from, to)

      if (error) throw error

      setMovements(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Stock movements fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (opened && stockItem) {
      setCurrentPage(1)
      fetchMovements()
    }
  }, [opened, stockItem, typeFilter, referenceFilter, searchQuery])

  useEffect(() => {
    if (opened && stockItem) {
      fetchMovements()
    }
  }, [currentPage])

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <IconArrowUp size="1rem" color="green" />
      case 'out':
        return <IconArrowDown size="1rem" color="red" />
      case 'adjustment':
        return <IconAdjustments size="1rem" color="blue" />
      default:
        return <IconAdjustments size="1rem" color="gray" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in': return 'green'
      case 'out': return 'red'
      case 'adjustment': return 'blue'
      default: return 'gray'
    }
  }

  const getMovementText = (type: string) => {
    switch (type) {
      case 'in': return 'Giriş'
      case 'out': return 'Çıkış'
      case 'adjustment': return 'Düzeltme'
      default: return 'Bilinmiyor'
    }
  }

  const getReferenceTypeText = (refType: string | null) => {
    switch (refType) {
      case 'order': return 'Sipariş'
      case 'purchase': return 'Satın Alma'
      case 'manual': return 'Manuel'
      case 'usage': return 'Kullanım'
      case 'waste': return 'Fire'
      case 'expired': return 'Son Kullanma'
      case 'return': return 'İade'
      case 'transfer': return 'Transfer'
      case 'order_cancel': return 'Sipariş İptal'
      default: return refType || 'Diğer'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('tr-TR'),
      time: date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  if (!stockItem) return null

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${stockItem.name} - Stok Hareket Geçmişi`}
      size="xl"
    >
      <Stack gap="md">
        {/* Stok Kalemi Bilgisi */}
        <Card withBorder>
          <Group justify="space-between">
            <div>
              <Text fw={500} size="lg">{stockItem.name}</Text>
              <Text size="sm" c="dimmed">
                Mevcut Stok: {stockItem.current_stock.toFixed(1)} {stockItem.unit}
              </Text>
            </div>
            <Badge color="blue" variant="light">
              {totalCount} hareket
            </Badge>
          </Group>
        </Card>

        {/* Filtreler */}
        <Card withBorder>
          <Group>
            <TextInput
              placeholder="Notlarda ara..."
              leftSection={<IconSearch size="1rem" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            
            <Select
              placeholder="Hareket Türü"
              data={[
                { value: '', label: 'Tümü' },
                { value: 'in', label: 'Giriş' },
                { value: 'out', label: 'Çıkış' },
                { value: 'adjustment', label: 'Düzeltme' },
              ]}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || '')}
              style={{ minWidth: 140 }}
            />
            
            <Select
              placeholder="İşlem Türü"
              data={[
                { value: '', label: 'Tümü' },
                { value: 'order', label: 'Sipariş' },
                { value: 'purchase', label: 'Satın Alma' },
                { value: 'manual', label: 'Manuel' },
                { value: 'usage', label: 'Kullanım' },
                { value: 'waste', label: 'Fire' },
              ]}
              value={referenceFilter}
              onChange={(value) => setReferenceFilter(value || '')}
              style={{ minWidth: 140 }}
            />
          </Group>
        </Card>

        {/* Hareket Listesi */}
        {loading ? (
          <Center h={300}>
            <Stack align="center">
              <Loader size="lg" />
              <Text c="dimmed">Hareketler yükleniyor...</Text>
            </Stack>
          </Center>
        ) : movements.length === 0 ? (
          <Alert color="blue">
            {searchQuery || typeFilter || referenceFilter
              ? 'Filtrelere uygun hareket bulunamadı.'
              : 'Henüz hareket kaydı bulunmuyor.'}
          </Alert>
        ) : (
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tarih</Table.Th>
                  <Table.Th>İşlem</Table.Th>
                  <Table.Th>Miktar</Table.Th>
                  <Table.Th>Önceki</Table.Th>
                  <Table.Th>Sonraki</Table.Th>
                  <Table.Th>Türü</Table.Th>
                  <Table.Th>Kullanıcı</Table.Th>
                  <Table.Th>Notlar</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {movements.map((movement) => {
                  const { date, time } = formatDate(movement.created_at)
                  
                  return (
                    <Table.Tr key={movement.id}>
                      <Table.Td>
                        <Stack gap="2px">
                          <Text size="sm" fw={500}>{date}</Text>
                          <Text size="xs" c="dimmed">{time}</Text>
                        </Stack>
                      </Table.Td>
                      
                      <Table.Td>
                        <Group gap="xs">
                          {getMovementIcon(movement.movement_type)}
                          <Badge 
                            color={getMovementColor(movement.movement_type)}
                            variant="light"
                            size="sm"
                          >
                            {getMovementText(movement.movement_type)}
                          </Badge>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        <Text 
                          fw={500}
                          c={movement.movement_type === 'in' ? 'green' : movement.movement_type === 'out' ? 'red' : 'blue'}
                        >
                          {movement.movement_type === 'in' ? '+' : movement.movement_type === 'out' ? '-' : '='}
                          {movement.quantity.toFixed(1)} {stockItem.unit}
                        </Text>
                      </Table.Td>
                      
                      <Table.Td>
                        <Text size="sm">
                          {movement.previous_stock.toFixed(1)} {stockItem.unit}
                        </Text>
                      </Table.Td>
                      
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {movement.new_stock.toFixed(1)} {stockItem.unit}
                        </Text>
                      </Table.Td>
                      
                      <Table.Td>
                        <Group gap="xs">
                          {movement.reference_type === 'order' && <IconReceipt size="0.8rem" />}
                          {movement.reference_type === 'manual' && <IconUser size="0.8rem" />}
                          
                          <div>
                            <Text size="sm">
                              {getReferenceTypeText(movement.reference_type)}
                            </Text>
                            {movement.reference_id && (
                              <Text size="xs" c="dimmed">
                                #{movement.reference_id}
                              </Text>
                            )}
                          </div>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        <Text size="sm">
                          {movement.users?.full_name || 'Sistem'}
                        </Text>
                      </Table.Td>
                      
                      <Table.Td>
                        {movement.notes ? (
                          <Tooltip label={movement.notes} multiline>
                            <Text size="sm" lineClamp={2} style={{ cursor: 'help' }}>
                              {movement.notes}
                            </Text>
                          </Tooltip>
                        ) : (
                          <Text size="sm" c="dimmed">-</Text>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        )}

        {/* Sayfalama */}
        {totalPages > 1 && (
          <Group justify="center">
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="sm"
            />
            <Text size="sm" c="dimmed">
              Toplam {totalCount} kayıt, sayfa {currentPage} / {totalPages}
            </Text>
          </Group>
        )}
      </Stack>
    </Modal>
  )
} 