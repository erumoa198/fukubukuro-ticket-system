import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ビルド時・環境変数がない場合用のダミークライアント
const createDummyClient = (): SupabaseClient => {
  const chainable = {
    select: () => chainable,
    insert: () => chainable,
    update: () => chainable,
    delete: () => chainable,
    eq: () => chainable,
    order: () => chainable,
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (value: { data: unknown[], error: null }) => void) => {
      resolve({ data: [], error: null })
      return Promise.resolve({ data: [], error: null })
    },
  }

  return {
    from: () => chainable,
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => Promise.resolve(),
  } as unknown as SupabaseClient
}

export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient()

// サーバーサイド用（Service Role Key使用）
export const createServerSupabaseClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    return createDummyClient()
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}
