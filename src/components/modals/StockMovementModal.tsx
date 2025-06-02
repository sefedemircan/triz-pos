'use client'

import { useState } from 'react'
import {
  Modal,
  Stack,
  NumberInput,
  Select,
  Textarea,
  Button,
  Group,
  Grid,
  Alert,
  Text,
  Badge,
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconCheck, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Database } from '@/lib/types/database'

type StockItem = Database['public']['Tables']['stock_items']['Row'] & {
  stock_categories?: Database['public']['Tables']['stock_categories']['Row']
}

interface StockMovementModalProps {
  opened: boolean
  onClose: () => void
  onSuccess: () => void
  item: StockItem | null
}

interface StockMovementForm {
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  unit_cost: number
  reference_type: string
  notes: string
}

const movementTypeOptions = [
  { value: 'in', label: 'Stok Girişi', color: 'green' },
  { value: 'out', label: 'Stok Çıkışı', color: 'red' },
  { value: 'adjustment', label: 'Stok Düzeltme', color: 'blue' },
]

const referenceTypeOptions = [
  { value: 'purchase', label: 'Satın Alma' },
  { value: 'usage', label: 'Kullanım' },
  { value: 'waste', label: 'Fire/Zayi' },
  { value: 'manual', label: 'Manuel Düzeltme' },
  { value: 'expired', label: 'Son Kullanma Tarihi' },
  { value: 'return', label: 'İade' },
  { value: 'transfer', label: 'Transfer' },
]

export function StockMovementModal({ opened, onClose, onSuccess, item }: StockMovementModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const form = useForm<StockMovementForm>({
    initialValues: {
      movement_type: 'in',
      quantity: 0,
      unit_cost: item?.unit_cost || 0,
      reference_type: 'manual',
      notes: '',
    },
    validate: {
      quantity: (value, values) => {
        if (value <= 0) return 'Miktar 0\'dan büyük olmalı'
        if (values.movement_type === 'out' && item && value > item.current_stock) {
          return `Maksimum ${item.current_stock} ${item.unit} çıkış yapabilirsiniz`
        }
        return null
      },
      unit_cost: (value) => value < 0 ? 'Birim maliyet 0\'dan küçük olamaz' : null,
    },
  })

  const calculateNewStock = () => {
    if (!item) return 0
    const quantity = form.values.quantity || 0
    const currentStock = item.current_stock

    switch (form.values.movement_type) {
      case 'in':
        return currentStock + quantity
      case 'out':
        return Math.max(0, currentStock - quantity)
      case 'adjustment':
        return quantity // Düzeltmede direkt yeni miktar
      default:
        return currentStock
    }
  }

  const handleSubmit = async (values: StockMovementForm) => {
    if (!user || !item) {
      notifications.show({
        title: 'Hata',
        message: 'Oturum açmanız gerekli',
        color: 'red',
      })
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      const newStock = calculateNewStock()
      let adjustedQuantity = values.quantity

      // Düzeltme işleminde quantity'yi hesapla
      if (values.movement_type === 'adjustment') {
        adjustedQuantity = values.quantity - item.current_stock
      }

      // Stok hareketi kaydet
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          stock_item_id: item.id,
          movement_type: values.movement_type,
          quantity: Math.abs(adjustedQuantity),
          previous_stock: item.current_stock,
          new_stock: newStock,
          unit_cost: values.unit_cost,
          reference_type: values.reference_type,
          user_id: user.id,
          notes: values.notes || null,
        })

      if (movementError) throw movementError

      notifications.show({
        title: 'Başarılı',
        message: `Stok hareketi kaydedildi`,
        color: 'green',
        icon: <IconCheck size="1rem" />,
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Stock movement error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Stok hareketi kaydedilirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  const newStock = calculateNewStock()
  const movementType = movementTypeOptions.find(type => type.value === form.values.movement_type)

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Stok Hareketi"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Ürün Bilgisi */}
          <Alert color="blue" title="Ürün Bilgisi">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={500}>{item.name}</Text>
                <Badge color="gray" variant="light">
                  {item.stock_categories?.name}
                </Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Mevcut Stok:</Text>
                <Text fw={500}>
                  {item.current_stock.toFixed(3)} {item.unit}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Birim Maliyet:</Text>
                <Text fw={500}>₺{item.unit_cost.toFixed(2)}</Text>
              </Group>
            </Stack>
          </Alert>

          <Divider />

          {/* Hareket Türü */}
          <Select
            label="Hareket Türü"
            placeholder="Hareket türü seçin"
            required
            data={movementTypeOptions.map(type => ({
              value: type.value,
              label: type.label
            }))}
            {...form.getInputProps('movement_type')}
          />

          {/* Miktar */}
          <Grid>
            <Grid.Col span={8}>
              <NumberInput
                label={
                  form.values.movement_type === 'adjustment' 
                    ? `Yeni Stok Miktarı (${item.unit})`
                    : `Miktar (${item.unit})`
                }
                placeholder="0"
                min={0}
                step={0.001}
                required
                {...form.getInputProps('quantity')}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <NumberInput
                label="Birim Maliyet (₺)"
                placeholder="0.00"
                min={0}
                step={0.01}
                {...form.getInputProps('unit_cost')}
              />
            </Grid.Col>
          </Grid>

          {/* İşlem Türü */}
          <Select
            label="İşlem Türü"
            placeholder="İşlem türü seçin"
            data={referenceTypeOptions}
            {...form.getInputProps('reference_type')}
          />

          {/* Notlar */}
          <Textarea
            label="Notlar"
            placeholder="İşlem hakkında ek bilgiler"
            rows={3}
            {...form.getInputProps('notes')}
          />

          {/* Özet Bilgisi */}
          <Alert 
            color={movementType?.color || 'blue'} 
            title="İşlem Özeti"
            icon={
              form.values.movement_type === 'in' ? 
                <IconArrowUp size="1rem" /> : 
                <IconArrowDown size="1rem" />
            }
          >
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm">Mevcut Stok:</Text>
                <Text fw={500}>{item.current_stock.toFixed(3)} {item.unit}</Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">İşlem:</Text>
                <Text fw={500} c={movementType?.color}>
                  {form.values.movement_type === 'in' ? '+' : form.values.movement_type === 'out' ? '-' : '='} 
                  {form.values.quantity || 0} {item.unit}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Yeni Stok:</Text>
                <Text fw={500} size="lg" c={newStock <= item.min_stock_level ? 'red' : 'green'}>
                  {newStock.toFixed(3)} {item.unit}
                </Text>
              </Group>
              {form.values.quantity > 0 && (
                <Group justify="space-between">
                  <Text size="sm">Toplam Maliyet:</Text>
                  <Text fw={500}>
                    ₺{((form.values.quantity || 0) * (form.values.unit_cost || 0)).toFixed(2)}
                  </Text>
                </Group>
              )}
            </Stack>
          </Alert>

          {/* Uyarılar */}
          {form.values.movement_type === 'out' && form.values.quantity > item.current_stock && (
            <Alert color="red" icon={<IconAlertTriangle size="1rem" />}>
              Çıkış miktarı mevcut stoktan fazla olamaz!
            </Alert>
          )}

          {newStock <= item.min_stock_level && newStock > 0 && (
            <Alert color="yellow" icon={<IconAlertTriangle size="1rem" />}>
              Yeni stok seviyesi minimum seviyenin altında kalacak!
            </Alert>
          )}

          {newStock <= 0 && (
            <Alert color="red" icon={<IconAlertTriangle size="1rem" />}>
              Stok tükeniyor! Bu işlem sonrası stok sıfırlanacak.
            </Alert>
          )}

          {/* Butonlar */}
          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" loading={loading} color={movementType?.color}>
              {movementType?.label || 'Kaydet'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
} 