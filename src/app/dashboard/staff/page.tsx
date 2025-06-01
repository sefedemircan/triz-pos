'use client'

import { useEffect, useState } from 'react'
import {
  Stack,
  Title,
  Group,
  Button,
  Card,
  Text,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  Alert,
  Loader,
  Center,
  Table,
  Avatar,
} from '@mantine/core'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconUsers,
  IconMail,
  IconShield,
  IconInfoCircle,
} from '@tabler/icons-react'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Database } from '@/lib/types/database'

type User = Database['public']['Tables']['users']['Row']

export default function StaffPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpened, setModalOpened] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const form = useForm({
    initialValues: {
      email: '',
      full_name: '',
      role: 'garson',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Geçersiz email adresi'),
      full_name: (value) => (value.length < 2 ? 'Ad soyad en az 2 karakter olmalı' : null),
    },
  })

  const fetchUsers = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Users fetch error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Kullanıcılar yüklenirken hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const supabase = createClient()

      if (editingUser) {
        // Güncelleme
        const { error } = await supabase
          .from('users')
          .update({
            email: values.email,
            full_name: values.full_name,
            role: values.role as 'admin' | 'garson' | 'mutfak',
          })
          .eq('id', editingUser.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Kullanıcı güncellendi',
          color: 'green',
        })
      } else {
        // Yeni ekleme - sadece database'e ekle, auth kullanıcısı manuel oluşturulacak
        const { error } = await supabase
          .from('users')
          .insert({
            email: values.email,
            full_name: values.full_name,
            role: values.role as 'admin' | 'garson' | 'mutfak',
          })

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Kullanıcı eklendi. Kullanıcı kendi şifresini register sayfasından oluşturabilir.',
          color: 'green',
        })
      }

      setModalOpened(false)
      setEditingUser(null)
      form.reset()
      fetchUsers()
    } catch (error) {
      console.error('User save error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Kullanıcı kaydedilirken hata oluştu',
        color: 'red',
      })
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.setValues({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    })
    setModalOpened(true)
  }

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      notifications.show({
        title: 'Hata',
        message: 'Kendi hesabınızı silemezsiniz',
        color: 'red',
      })
      return
    }

    if (!confirm(`"${user.full_name}" kullanıcısını silmek istediğinizden emin misiniz?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Kullanıcı silindi',
        color: 'green',
      })

      fetchUsers()
    } catch (error) {
      console.error('User delete error:', error)
      notifications.show({
        title: 'Hata',
        message: 'Kullanıcı silinirken hata oluştu',
        color: 'red',
      })
    }
  }

  const handleNewUser = () => {
    setEditingUser(null)
    form.reset()
    setModalOpened(true)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red'
      case 'garson':
        return 'blue'
      case 'mutfak':
        return 'green'
      default:
        return 'gray'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin'
      case 'garson':
        return 'Garson'
      case 'mutfak':
        return 'Mutfak'
      default:
        return role
    }
  }

  // Admin kontrolü
  if (currentUser?.role !== 'admin') {
    return (
      <DashboardLayout>
        <Alert icon={<IconShield size="1rem" />} color="red">
          Bu sayfaya erişim yetkiniz yok. Sadece admin kullanıcıları personel yönetebilir.
        </Alert>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Center h={400}>
          <Stack align="center">
            <Loader size="lg" />
            <Text>Personel listesi yükleniyor...</Text>
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
            <Title order={1}>
              <IconUsers size="2rem" style={{ marginRight: 8 }} />
              Personel Yönetimi
            </Title>
            <Text c="dimmed">Cafe personelini yönetin</Text>
          </div>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={handleNewUser}
          >
            Yeni Personel
          </Button>
        </Group>

        {users.length === 0 ? (
          <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
            Henüz personel eklenmemiş.
          </Alert>
        ) : (
          <Card withBorder>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Personel</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Rol</Table.Th>
                  <Table.Th>Kayıt Tarihi</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar size="sm" radius="xl">
                          {user.full_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Text fw={500}>{user.full_name}</Text>
                          {user.id === currentUser?.id && (
                            <Badge size="xs" color="blue" variant="light">
                              Siz
                            </Badge>
                          )}
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconMail size="0.9rem" />
                        <Text size="sm">{user.email}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={getRoleColor(user.role)} variant="light">
                        {getRoleText(user.role)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleEdit(user)}
                        >
                          <IconEdit size="1rem" />
                        </ActionIcon>
                        {user.id !== currentUser?.id && (
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => handleDelete(user)}
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        )}

        {/* Personel Ekleme/Düzenleme Modal */}
        <Modal
          opened={modalOpened}
          onClose={() => {
            setModalOpened(false)
            setEditingUser(null)
            form.reset()
          }}
          title={editingUser ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
          size="md"
        >
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Ad Soyad"
                placeholder="Örn: Ahmet Yılmaz"
                required
                {...form.getInputProps('full_name')}
              />

              <TextInput
                label="Email"
                placeholder="ahmet@example.com"
                required
                {...form.getInputProps('email')}
              />

              <Select
                label="Rol"
                placeholder="Rol seçin"
                required
                data={[
                  { value: 'admin', label: 'Admin - Sistem Yöneticisi' },
                  { value: 'garson', label: 'Garson - Sipariş Alma' },
                  { value: 'mutfak', label: 'Mutfak - Sipariş Hazırlama' },
                ]}
                {...form.getInputProps('role')}
              />

              {!editingUser && (
                <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                  Kullanıcı eklendikten sonra, kendi şifresini register sayfasından oluşturabilir.
                </Alert>
              )}

              <Group justify="flex-end" mt="md">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalOpened(false)
                    setEditingUser(null)
                    form.reset()
                  }}
                >
                  İptal
                </Button>
                <Button type="submit">
                  {editingUser ? 'Güncelle' : 'Ekle'}
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>
      </Stack>
    </DashboardLayout>
  )
} 