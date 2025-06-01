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
  TextInput,
  Textarea,
  NumberInput,
  Switch,
  ActionIcon,
  Loader,
  Center,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconCategory,
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database'

type Category = Database['public']['Tables']['categories']['Row']

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [opened, { open, close }] = useDisclosure(false)

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      display_order: 0,
      is_active: true,
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Kategori adı en az 2 karakter olmalı' : null),
      display_order: (value) => (value < 0 ? 'Sıralama değeri 0\'dan büyük olmalı' : null),
    },
  })

  const fetchCategories = async () => {
    try {
      const supabase = createClient()
      
      // Debug: Current user bilgisini kontrol et
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order')

      console.log('Categories data:', data)
      console.log('Categories error:', error)

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      notifications.show({
        title: 'Hata',
        message: 'Kategoriler yüklenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const supabase = createClient()
      
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(values)
          .eq('id', editingCategory.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Kategori güncellendi',
          color: 'green',
        })
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert(values)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Yeni kategori eklendi',
          color: 'green',
        })
      }

      close()
      form.reset()
      setEditingCategory(null)
      fetchCategories()
    } catch (err) {
      console.error('Error submitting category:', err)
      notifications.show({
        title: 'Hata',
        message: 'Kategori kaydedilirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    form.setValues({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      is_active: category.is_active,
    })
    open()
  }

  const handleDelete = async (category: Category) => {
    if (!confirm('Bu kategoriyi silmek istediğinizden emin misiniz?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Kategori silindi',
        color: 'green',
      })
      fetchCategories()
    } catch (err) {
      console.error('Error deleting category:', err)
      notifications.show({
        title: 'Hata',
        message: 'Kategori silinirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const toggleActive = async (category: Category) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: `Kategori ${!category.is_active ? 'aktif' : 'pasif'} edildi`,
        color: 'green',
      })
      fetchCategories()
    } catch (err) {
      console.error('Error toggling category status:', err)
      notifications.show({
        title: 'Hata',
        message: 'Kategori durumu değiştirilirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    form.reset()
    open()
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <Center style={{ height: 400 }}>
          <Stack align="center">
            <Loader size="lg" />
            <Text>Kategoriler yükleniyor...</Text>
          </Stack>
        </Center>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>Kategori Yönetimi</Title>
            <Text c="dimmed">Menü kategorilerini yönetin</Text>
          </div>
          <Button leftSection={<IconPlus size="1rem" />} onClick={handleAddNew}>
            Yeni Kategori
          </Button>
        </Group>

        {categories.length === 0 ? (
          <Card shadow="sm" padding="xl" radius="md" withBorder>
            <Stack align="center" py="xl">
              <IconCategory size={48} color="var(--mantine-color-gray-6)" />
              <Text size="lg" fw={500} c="dimmed">
                Henüz kategori eklenmemiş
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Menünüz için kategoriler oluşturun (İçecekler, Yemekler, Tatlılar vb.)
              </Text>
              <Button leftSection={<IconPlus size="1rem" />} onClick={handleAddNew}>
                İlk Kategoriyi Ekle
              </Button>
            </Stack>
          </Card>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {categories.map((category) => (
              <Card key={category.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Group>
                    <IconCategory size="1.5rem" />
                    <Text fw={500} size="lg">
                      {category.name}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <ActionIcon
                      variant="light"
                      color={category.is_active ? 'yellow' : 'green'}
                      size="sm"
                      onClick={() => toggleActive(category)}
                      title={category.is_active ? 'Pasif Et' : 'Aktif Et'}
                    >
                      {category.is_active ? <IconEye size="0.9rem" /> : <IconEyeOff size="0.9rem" />}
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <IconEdit size="0.9rem" />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="sm"
                      onClick={() => handleDelete(category)}
                    >
                      <IconTrash size="0.9rem" />
                    </ActionIcon>
                  </Group>
                </Group>

                <Group justify="space-between" mb="md">
                  <Badge 
                    color={category.is_active ? 'green' : 'gray'} 
                    variant="light"
                  >
                    {category.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    Sıra: {category.display_order}
                  </Badge>
                </Group>

                {category.description && (
                  <Text size="sm" c="dimmed" mb="md">
                    {category.description}
                  </Text>
                )}

                <Text size="xs" c="dimmed">
                  Oluşturulma: {new Date(category.created_at).toLocaleDateString('tr-TR')}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        )}

        <Modal
          opened={opened}
          onClose={close}
          title={editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
          centered
          size="md"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Kategori Adı"
                placeholder="Kategori adını girin (ör: İçecekler, Yemekler)"
                required
                {...form.getInputProps('name')}
              />

              <Textarea
                label="Açıklama"
                placeholder="Kategori açıklaması (isteğe bağlı)"
                rows={3}
                {...form.getInputProps('description')}
              />

              <NumberInput
                label="Görüntüleme Sırası"
                placeholder="Kategori sıralaması"
                min={0}
                {...form.getInputProps('display_order')}
              />

              <Switch
                label="Aktif Durum"
                description="Bu kategori menüde görüntülensin mi?"
                {...form.getInputProps('is_active', { type: 'checkbox' })}
              />

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={close}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Güncelle' : 'Ekle'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </DashboardLayout>
  )
} 