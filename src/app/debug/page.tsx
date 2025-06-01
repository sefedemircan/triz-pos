'use client'

import { Container, Title, Text, Stack, Paper, Code, Button, JsonInput } from '@mantine/core'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function DebugPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [tableCheck, setTableCheck] = useState<string>('')
  const [sessionData, setSessionData] = useState<string>('')

  const checkSession = async () => {
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setSessionData(`Error: ${error.message}`)
        return
      }

      if (session) {
        const sessionInfo = {
          user_id: session.user.id,
          email: session.user.email,
          email_confirmed: !!session.user.email_confirmed_at,
          created_at: session.user.created_at,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata,
          token_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toLocaleString('tr-TR') : 'N/A',
          token_expires_in: session.expires_at ? `${Math.floor((session.expires_at * 1000 - Date.now()) / 1000 / 60)} dakika` : 'N/A',
        }
        setSessionData(JSON.stringify(sessionInfo, null, 2))
      } else {
        setSessionData('Session yok')
      }
    } catch (error) {
      setSessionData(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  const checkTables = async () => {
    try {
      const supabase = createClient()
      
      // Tabloların varlığını kontrol et
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['users', 'tables', 'categories', 'products', 'orders', 'order_items'])

      console.log('Tables check:', { data, error })

      if (error) {
        setTableCheck(`❌ Tablo kontrolü hatası: ${error.message}`)
      } else {
        const tableNames = data?.map(t => t.table_name) || []
        setTableCheck(`✅ Bulunan tablolar: ${tableNames.join(', ') || 'Hiç tablo bulunamadı'}`)
      }
    } catch (error) {
      setTableCheck(`❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  const testUsersTable = async () => {
    try {
      const supabase = createClient()
      
      // Önce auth durumunu kontrol et
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setTestResult('❌ Session yok - önce giriş yapın')
        return
      }

      console.log('Testing users table with user ID:', session.user.id)
      
      // Users tablosunu test et
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      console.log('Users table test result:', { data, error })

      if (error) {
        if (error.code === 'PGRST116') {
          setTestResult('❌ Kullanıcı profili bulunamadı (PGRST116)')
        } else if (error.code === '42501') {
          setTestResult('❌ RLS politika hatası - erişim izni yok (42501)')
        } else {
          setTestResult(`❌ Users tablosu hatası: ${error.message} (${error.code})`)
        }
      } else {
        setTestResult(`✅ Users tablosu erişilebilir! Kullanıcı: ${data.email} (${data.role})`)
      }
    } catch (error) {
      setTestResult(`❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...')
      
      // Environment variables
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('Environment variables:')
      console.log('URL:', url)
      console.log('Key exists:', !!key)
      
      if (!url || !key) {
        setTestResult('❌ Environment variables eksik!')
        return
      }

      // Supabase client oluştur
      const supabase = createClient()
      console.log('Supabase client created')

      // Auth durumunu kontrol et
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setTestResult(`❌ Auth hatası: ${sessionError.message}`)
        return
      }

      if (session?.user) {
        setTestResult(`✅ Kullanıcı giriş yapmış: ${session.user.email}`)
      } else {
        setTestResult('❌ Kullanıcı giriş yapmamış')
      }
      
    } catch (error) {
      console.error('Test error:', error)
      setTestResult(`❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`)
    }
  }

  return (
    <Container size="md" py="xl">
      <Title order={1} mb="xl">Debug Sayfası</Title>
      
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Title order={3} mb="md">Environment Variables</Title>
          <Stack gap="xs">
            <Text>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
              <Code>{process.env.NEXT_PUBLIC_SUPABASE_URL || 'TANIMLANMAMIŞ'}</Code>
            </Text>
            <Text>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
              <Code>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` 
                  : 'TANIMLANMAMIŞ'
                }
              </Code>
            </Text>
          </Stack>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={3} mb="md">Session Bilgileri</Title>
          <Button onClick={checkSession} mb="md">
            Session'ı Kontrol Et
          </Button>
          {sessionData && (
            <JsonInput
              label="Session İçeriği"
              value={sessionData}
              readOnly
              autosize
              minRows={10}
            />
          )}
        </Paper>

        <Paper p="md" withBorder>
          <Title order={3} mb="md">Supabase Bağlantı Testi</Title>
          <Button onClick={testSupabaseConnection} mb="md">
            Bağlantıyı Test Et
          </Button>
          {testResult && (
            <Text c={testResult.includes('✅') ? 'green' : 'red'}>
              {testResult}
            </Text>
          )}
        </Paper>

        <Paper p="md" withBorder>
          <Title order={3} mb="md">Veritabanı Tabloları</Title>
          <Button onClick={checkTables} mb="md" mr="md">
            Tabloları Kontrol Et
          </Button>
          <Button onClick={testUsersTable} mb="md">
            Users Tablosunu Test Et
          </Button>
          {tableCheck && (
            <Text c={tableCheck.includes('✅') ? 'green' : 'red'} mt="md">
              {tableCheck}
            </Text>
          )}
        </Paper>

        <Paper p="md" withBorder>
          <Title order={3} mb="md">Çözüm Adımları</Title>
          <Stack gap="xs">
            <Text><strong>1. SQL Script&apos;leri Çalıştırın:</strong></Text>
            <Text>Supabase Dashboard &gt; SQL Editor&apos;da sırayla:</Text>
            <Code block>
              1. cafe-pos/sql/1_create_tables.sql{'\n'}
              2. cafe-pos/sql/2_setup_rls.sql{'\n'}
              3. cafe-pos/sql/6_create_auth_hooks.sql
            </Code>
            <Text><strong>2. Sunucuyu yeniden başlatın:</strong> <Code>npm run dev</Code></Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
} 