'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  Text,
  Title,
  Group,
  Stack,
  SimpleGrid,
  Badge,
  Button,
  Modal,
  NumberInput,
  Select,
  ActionIcon,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconTable,
  IconPlus,
  IconUsers,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'

type Table = Database['public']['Tables']['tables']['Row']

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [isClient, setIsClient] = useState(false)

  // Client-side mounting kontrolü
  useEffect(() => {
    setIsClient(true)
  }, [])

  const form = useForm({
    initialValues: {
      table_number: 0,
      capacity: 4,
      status: 'empty' as 'empty' | 'occupied' | 'reserved',
    },
    validate: {
      table_number: (value) => (value < 1 ? 'Masa numarası 1\'den büyük olmalı' : null),
      capacity: (value) => (value < 1 ? 'Kapasite 1\'den büyük olmalı' : null),
    },
  })

  const fetchTables = async () => {
    try {
      const supabase = createClient()
      
      // Debug: Current user bilgisini kontrol et
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user in tables:', user)
      
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number')

      console.log('Tables data:', data)
      console.log('Tables error:', error)

      if (error) throw error
      setTables(data || [])
    } catch (err) {
      console.error('Error fetching tables:', err)
      notifications.show({
        title: 'Hata',
        message: 'Masalar yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const supabase = createClient()
      
      if (editingTable) {
        // Update existing table
        const { error } = await supabase
          .from('tables')
          .update(values)
          .eq('id', editingTable.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Masa güncellendi',
          color: 'green',
        })
      } else {
        // Create new table
        const { error } = await supabase
          .from('tables')
          .insert(values)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Yeni masa eklendi',
          color: 'green',
        })
      }

      close()
      form.reset()
      setEditingTable(null)
      fetchTables()
    } catch (err) {
      console.error('Error submitting table:', err)
      notifications.show({
        title: 'Hata',
        message: 'Masa kaydedilirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleEdit = (table: Table) => {
    setEditingTable(table)
    form.setValues({
      table_number: table.table_number,
      capacity: table.capacity,
      status: table.status as 'empty' | 'occupied' | 'reserved',
    })
    open()
  }

  const handleDelete = async (table: Table) => {
    if (!confirm('Bu masayı silmek istediğinizden emin misiniz?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', table.id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Masa silindi',
        color: 'green',
      })
      fetchTables()
    } catch (err) {
      console.error('Error deleting table:', err)
      notifications.show({
        title: 'Hata',
        message: 'Masa silinirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleAddNew = () => {
    setEditingTable(null)
    form.reset()
    open()
  }

  useEffect(() => {
    fetchTables()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'empty':
        return 'green'
      case 'occupied':
        return 'red'
      case 'reserved':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'empty':
        return 'Boş'
      case 'occupied':
        return 'Dolu'
      case 'reserved':
        return 'Rezerve'
      default:
        return 'Bilinmiyor'
    }
  }

  return (
    <DashboardLayout>
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Masa Yönetimi</Title>
            <Text c="dimmed">Kafedeki masaları yönetin</Text>
          </div>
          <Button leftSection={<IconPlus size="1rem" />} onClick={handleAddNew}>
            Yeni Masa
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
          {tables.map((table) => (
            <Card key={table.id} shadow="sm" padding="lg" radius="md" withBorder
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '12px',
                '&:hover': {
                  transform: 'scale(1.05)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                }
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
              }}>
              <Group justify="space-between" mb="xs">
                <Group>
                  <IconTable size="1.5rem" />
                  <Text fw={500} size="lg">
                    Masa {table.table_number}
                  </Text>
                </Group>
                <Group gap="xs">
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="sm"
                    onClick={() => handleEdit(table)}
                  >
                    <IconEdit size="0.9rem" />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() => handleDelete(table)}
                  >
                    <IconTrash size="0.9rem" />
                  </ActionIcon>
                </Group>
              </Group>

              <Group justify="space-between" mb="md">
                <Badge color={getStatusColor(table.status)} variant="light">
                  {getStatusLabel(table.status)}
                </Badge>
                <Group gap="xs">
                  <IconUsers size="1rem" />
                  <Text size="sm" c="dimmed">
                    {table.capacity} kişi
                  </Text>
                </Group>
              </Group>

              <Text size="xs" c="dimmed">
                Son güncelleme: {isClient ? new Date(table.updated_at).toLocaleDateString('tr-TR') : 'Yükleniyor...'}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        <Modal
          opened={opened}
          onClose={close}
          title={editingTable ? 'Masa Düzenle' : 'Yeni Masa Ekle'}
          centered
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <NumberInput
                label="Masa Numarası"
                placeholder="Masa numarasını girin"
                required
                {...form.getInputProps('table_number')}
              />

              <NumberInput
                label="Kapasite"
                placeholder="Kaç kişilik masa"
                required
                min={1}
                {...form.getInputProps('capacity')}
              />

              <Select
                label="Durum"
                placeholder="Masa durumu"
                required
                data={[
                  { value: 'empty', label: 'Boş' },
                  { value: 'occupied', label: 'Dolu' },
                  { value: 'reserved', label: 'Rezerve' },
                ]}
                {...form.getInputProps('status')}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={close}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingTable ? 'Güncelle' : 'Ekle'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </DashboardLayout>
  )
} 