'use client'

import { useState } from 'react'
import {
  Group,
  Button,
  Modal,
  Stack,
  Text,
  NumberInput,
  Textarea,
  Alert,
  Badge,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconArrowUp, 
  IconArrowDown, 
  IconAdjustments,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Database } from '@/lib/types/database'

type StockItem = Database['public']['Tables']['stock_items']['Row'] & {
  stock_categories?: Database['public']['Tables']['stock_categories']['Row']
}

interface QuickStockActionsProps {
  item: StockItem
  onSuccess: () => void
}

interface QuickMovementForm {
  quantity: number
  notes: string
}

export function QuickStockActions({ item, onSuccess }: QuickStockActionsProps) {
  const { user } = useAuth()
  const [modalOpened, setModalOpened] = useState(false)
  const [actionType, setActionType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [loading, setLoading] = useState(false)

  const form = useForm<QuickMovementForm>({
    initialValues: {
      quantity: 0,
      notes: '',
    },
    validate: {
      quantity: (value) => {
        if (value <= 0) return 'Miktar 0\'dan büyük olmalı'
        if (actionType === 'out' && value > item.current_stock) {
          return `Maksimum ${item.current_stock} ${item.unit} çıkış yapabilirsiniz`
        }
        return null
      },
    },
  })

  const handleQuickAction = (type: 'in' | 'out' | 'adjustment') => {
    setActionType(type)
    form.reset()
    setModalOpened(true)
  }

  const calculateNewStock = () => {
    const quantity = form.values.quantity || 0
    const currentStock = item.current_stock

    switch (actionType) {
      case 'in':
        return currentStock + quantity
      case 'out':
        return Math.max(0, currentStock - quantity)
      case 'adjustment':
        return quantity
      default:
        return currentStock
    }
  }

  const handleSubmit = async (values: QuickMovementForm) => {
    if (!user) {
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

      if (actionType === 'adjustment') {
        adjustedQuantity = values.quantity - item.current_stock
      }

      const { error } = await supabase
        .from('stock_movements')
        .insert({
          stock_item_id: item.id,
          movement_type: actionType,
          quantity: Math.abs(adjustedQuantity),
          previous_stock: item.current_stock,
          new_stock: newStock,
          unit_cost: item.unit_cost,
          reference_type: 'manual',
          user_id: user.id,
          notes: values.notes || null,
        })

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: `Stok ${actionType === 'in' ? 'girişi' : actionType === 'out' ? 'çıkışı' : 'düzeltmesi'} kaydedildi`,
        color: 'green',
        icon: <IconCheck size="1rem" />,
      })

      setModalOpened(false)
      onSuccess()
    } catch (error) {
      console.error('Quick stock action error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Stok işlemi kaydedilirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const getActionConfig = () => {
    switch (actionType) {
      case 'in':
        return {
          title: 'Hızlı Stok Girişi',
          color: 'green',
          icon: <IconArrowUp size="1rem" />,
          label: 'Giriş Miktarı',
        }
      case 'out':
        return {
          title: 'Hızlı Stok Çıkışı',
          color: 'red',
          icon: <IconArrowDown size="1rem" />,
          label: 'Çıkış Miktarı',
        }
      case 'adjustment':
        return {
          title: 'Hızlı Stok Düzeltme',
          color: 'blue',
          icon: <IconAdjustments size="1rem" />,
          label: 'Yeni Stok Miktarı',
        }
      default:
        return {
          title: 'Stok İşlemi',
          color: 'gray',
          icon: <IconAdjustments size="1rem" />,
          label: 'Miktar',
        }
    }
  }

  const config = getActionConfig()
  const newStock = calculateNewStock()

  return (
    <>
      <Group gap="xs">
        <Button
          size="xs"
          variant="light"
          color="green"
          leftSection={<IconArrowUp size="0.8rem" />}
          onClick={() => handleQuickAction('in')}
        >
          Giriş
        </Button>
        
        <Button
          size="xs"
          variant="light"
          color="red"
          leftSection={<IconArrowDown size="0.8rem" />}
          onClick={() => handleQuickAction('out')}
          disabled={item.current_stock <= 0}
        >
          Çıkış
        </Button>
        
        <Button
          size="xs"
          variant="light"
          color="blue"
          leftSection={<IconAdjustments size="0.8rem" />}
          onClick={() => handleQuickAction('adjustment')}
        >
          Düzelt
        </Button>
      </Group>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={config.title}
        size="sm"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Ürün Bilgisi */}
            <Alert color="blue" title="Ürün">
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
                    {item.current_stock.toFixed(1)} {item.unit}
                  </Text>
                </Group>
              </Stack>
            </Alert>

            {/* Miktar */}
            <NumberInput
              label={`${config.label} (${item.unit})`}
              placeholder="0"
              min={0}
              step={0.001}
              required
              leftSection={config.icon}
              {...form.getInputProps('quantity')}
            />

            {/* Notlar */}
            <Textarea
              label="Notlar"
              placeholder="İşlem hakkında kısa not"
              rows={2}
              {...form.getInputProps('notes')}
            />

            {/* Özet */}
            {form.values.quantity > 0 && (
              <Alert color={config.color} title="İşlem Özeti">
                <Group justify="space-between">
                  <Text size="sm">Yeni Stok:</Text>
                  <Text fw={500} c={newStock <= item.min_stock_level ? 'red' : 'green'}>
                    {newStock.toFixed(1)} {item.unit}
                  </Text>
                </Group>
              </Alert>
            )}

            {/* Uyarılar */}
            {actionType === 'out' && form.values.quantity > item.current_stock && (
              <Alert color="red" icon={<IconAlertTriangle size="1rem" />}>
                Çıkış miktarı mevcut stoktan fazla!
              </Alert>
            )}

            {newStock <= item.min_stock_level && newStock > 0 && (
              <Alert color="yellow" icon={<IconAlertTriangle size="1rem" />}>
                Stok minimum seviyenin altında kalacak!
              </Alert>
            )}

            {/* Butonlar */}
            <Group justify="flex-end" mt="md">
              <Button 
                variant="outline" 
                onClick={() => setModalOpened(false)} 
                disabled={loading}
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                loading={loading} 
                color={config.color}
                leftSection={config.icon}
              >
                {actionType === 'in' ? 'Giriş Yap' : actionType === 'out' ? 'Çıkış Yap' : 'Düzelt'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  )
} 