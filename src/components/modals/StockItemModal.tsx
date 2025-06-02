'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Button,
  Group,
  Grid,
  Alert,
  Switch,
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertTriangle, IconCheck } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Database } from '@/lib/types/database'

type StockCategory = Database['public']['Tables']['stock_categories']['Row']
type StockItem = Database['public']['Tables']['stock_items']['Row']

interface StockItemModalProps {
  opened: boolean
  onClose: () => void
  onSuccess: () => void
  item?: StockItem | null
  categories: StockCategory[]
}

interface StockItemForm {
  name: string
  category_id: string
  unit: string
  min_stock_level: number
  max_stock_level: number
  current_stock: number
  unit_cost: number
  supplier: string
  barcode: string
  expiry_date: Date | null
  location: string
  description: string
  is_active: boolean
}

const unitOptions = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'litre', label: 'Litre (L)' },
  { value: 'ml', label: 'Mililitre (ml)' },
  { value: 'adet', label: 'Adet' },
  { value: 'paket', label: 'Paket' },
  { value: 'kutu', label: 'Kutu' },
  { value: 'şişe', label: 'Şişe' },
  { value: 'bardak', label: 'Bardak' },
  { value: 'tabak', label: 'Tabak' },
  { value: 'porsiyon', label: 'Porsiyon' },
]

export function StockItemModal({ opened, onClose, onSuccess, item, categories }: StockItemModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const isEditing = !!item

  const form = useForm<StockItemForm>({
    initialValues: {
      name: '',
      category_id: '',
      unit: 'adet',
      min_stock_level: 0,
      max_stock_level: 0,
      current_stock: 0,
      unit_cost: 0,
      supplier: '',
      barcode: '',
      expiry_date: null,
      location: '',
      description: '',
      is_active: true,
    },
    validate: {
      name: (value) => value.length < 2 ? 'Ürün adı en az 2 karakter olmalı' : null,
      category_id: (value) => !value ? 'Kategori seçimi zorunlu' : null,
      unit: (value) => !value ? 'Birim seçimi zorunlu' : null,
      min_stock_level: (value) => value < 0 ? 'Minimum stok seviyesi 0\'dan küçük olamaz' : null,
      max_stock_level: (value, values) => 
        value > 0 && value < values.min_stock_level 
          ? 'Maksimum stok seviyesi minimum seviyeden küçük olamaz' 
          : null,
      current_stock: (value) => value < 0 ? 'Mevcut stok 0\'dan küçük olamaz' : null,
      unit_cost: (value) => value < 0 ? 'Birim maliyet 0\'dan küçük olamaz' : null,
    },
  })

  // Modal açıldığında form'u sıfırla veya mevcut değerlerle doldur
  useEffect(() => {
    if (opened) {
      if (item) {
        form.setValues({
          name: item.name,
          category_id: item.category_id || '',
          unit: item.unit,
          min_stock_level: item.min_stock_level,
          max_stock_level: item.max_stock_level,
          current_stock: item.current_stock,
          unit_cost: item.unit_cost,
          supplier: item.supplier || '',
          barcode: item.barcode || '',
          expiry_date: item.expiry_date ? new Date(item.expiry_date) : null,
          location: item.location || '',
          description: item.description || '',
          is_active: item.is_active,
        })
      } else {
        form.reset()
      }
    }
  }, [opened, item])

  const handleSubmit = async (values: StockItemForm) => {
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
      
      const dataToSave = {
        ...values,
        expiry_date: values.expiry_date && values.expiry_date instanceof Date 
          ? values.expiry_date.toISOString().split('T')[0] 
          : null,
      }

      if (isEditing && item) {
        // Güncelleme
        const { error } = await supabase
          .from('stock_items')
          .update(dataToSave)
          .eq('id', item.id)

        if (error) throw error

        // Eğer stok miktarı değiştiyse hareket kaydı oluştur
        if (values.current_stock !== item.current_stock) {
          const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
              stock_item_id: item.id,
              movement_type: 'adjustment',
              quantity: values.current_stock - item.current_stock,
              previous_stock: item.current_stock,
              new_stock: values.current_stock,
              unit_cost: values.unit_cost,
              reference_type: 'manual',
              user_id: user.id,
              notes: `Stok düzenleme - ${values.name}`,
            })

          if (movementError) throw movementError
        }

        notifications.show({
          title: 'Başarılı',
          message: 'Stok kalemi güncellendi',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        })
      } else {
        // Yeni ekleme
        const { error } = await supabase
          .from('stock_items')
          .insert(dataToSave)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Yeni stok kalemi eklendi',
          color: 'green',
          icon: <IconCheck size="1rem" />,
        })
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Stock item save error:', error)
      notifications.show({
        title: 'Hata',
        message: isEditing ? 'Stok kalemi güncellenirken hata oluştu' : 'Stok kalemi eklenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name
  }))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? 'Stok Kalemi Düzenle' : 'Yeni Stok Kalemi'}
      size="lg"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Temel Bilgiler */}
          <Grid>
            <Grid.Col span={12}>
              <TextInput
                label="Ürün Adı"
                placeholder="Ürün adını girin"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label="Kategori"
                placeholder="Kategori seçin"
                required
                data={categoryOptions}
                {...form.getInputProps('category_id')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Select
                label="Birim"
                placeholder="Birim seçin"
                required
                data={unitOptions}
                searchable
                {...form.getInputProps('unit')}
              />
            </Grid.Col>
          </Grid>

          <Divider label="Stok Bilgileri" labelPosition="left" />

          {/* Stok Seviyeleri */}
          <Grid>
            <Grid.Col span={4}>
              <NumberInput
                label="Mevcut Stok"
                placeholder="0"
                min={0}
                step={0.001}
                {...form.getInputProps('current_stock')}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <NumberInput
                label="Minimum Seviye"
                placeholder="0"
                min={0}
                step={0.001}
                {...form.getInputProps('min_stock_level')}
              />
            </Grid.Col>

            <Grid.Col span={4}>
              <NumberInput
                label="Maksimum Seviye"
                placeholder="0"
                min={0}
                step={0.001}
                {...form.getInputProps('max_stock_level')}
              />
            </Grid.Col>
          </Grid>

          {/* Fiyat ve Tedarikçi */}
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Birim Maliyet (₺)"
                placeholder="0.00"
                min={0}
                step={0.01}
                {...form.getInputProps('unit_cost')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Tedarikçi"
                placeholder="Tedarikçi adı"
                {...form.getInputProps('supplier')}
              />
            </Grid.Col>
          </Grid>

          <Divider label="Ek Bilgiler" labelPosition="left" />

          {/* Ek Bilgiler */}
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Barkod"
                placeholder="Barkod numarası"
                {...form.getInputProps('barcode')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Depo Konumu"
                placeholder="Depo lokasyonu"
                {...form.getInputProps('location')}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <TextInput
                label="Son Kullanma Tarihi"
                placeholder="YYYY-MM-DD formatında girin"
                type="date"
                {...form.getInputProps('expiry_date')}
                value={form.values.expiry_date instanceof Date 
                  ? form.values.expiry_date.toISOString().split('T')[0] 
                  : form.values.expiry_date || ''
                }
                onChange={(event) => {
                  const value = event.currentTarget.value
                  form.setFieldValue('expiry_date', value ? new Date(value) : null)
                }}
              />
            </Grid.Col>

            <Grid.Col span={6}>
              <Switch
                label="Aktif"
                description="Bu stok kalemi aktif mi?"
                {...form.getInputProps('is_active', { type: 'checkbox' })}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Açıklama"
            placeholder="Ürün hakkında ek notlar"
            rows={3}
            {...form.getInputProps('description')}
          />

          {/* Uyarı Mesajları */}
          {form.values.max_stock_level > 0 && form.values.max_stock_level < form.values.min_stock_level && (
            <Alert
              color="yellow"
              icon={<IconAlertTriangle size="1rem" />}
              title="Uyarı"
            >
              Maksimum stok seviyesi minimum seviyeden küçük olamaz.
            </Alert>
          )}

          {form.values.current_stock > 0 && form.values.current_stock <= form.values.min_stock_level && (
            <Alert
              color="orange"
              icon={<IconAlertTriangle size="1rem" />}
              title="Stok Uyarısı"
            >
              Mevcut stok minimum seviyenin altında. Bu ürün için stok uyarısı oluşturulacak.
            </Alert>
          )}

          {/* Butonlar */}
          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              İptal
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Güncelle' : 'Ekle'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
} 