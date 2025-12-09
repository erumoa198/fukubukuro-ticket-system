-- =====================================================
-- 福袋電子チケットシステム - Supabaseテーブル設計
-- =====================================================
-- このSQLをSupabaseのSQL Editorで実行してください

-- 1. チケットセット（福袋1つ = 1レコード）
CREATE TABLE ticket_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_type TEXT NOT NULL CHECK (set_type IN (
    'artmake_repeater',  -- アートメイク リピーター様セット
    'artmake_new',       -- アートメイク ご新規様セット
    'esthe_basic',       -- エステ 肌底上げセット
    'esthe_reward'       -- エステ ご褒美セット
  )),
  customer_note TEXT,           -- 購入者メモ（任意）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT '2025-12-31 23:59:59+09'  -- 有効期限
);

-- 2. 個別チケット
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES ticket_sets(id) ON DELETE CASCADE,
  ticket_type TEXT NOT NULL CHECK (ticket_type IN ('A', 'B', 'C', 'D', 'E')),
  ticket_name TEXT NOT NULL,
  ticket_description TEXT,      -- チケットの説明
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  used_by TEXT,                 -- 消込したスタッフ名
  used_menu TEXT,               -- 選択した施術メニュー
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. スタッフマスタ
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL DEFAULT '0000',  -- 4桁のPINコード
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 管理者認証用（シンプルなパスワード管理）
CREATE TABLE admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 初期データ投入
-- =====================================================

-- スタッフ登録（サンプル - 実際の名前とPINに変更してください）
INSERT INTO staff (name, pin) VALUES
  ('山田', '1111'),
  ('佐藤', '2222'),
  ('鈴木', '3333'),
  ('田中', '4444');

-- 管理画面パスワード設定（本番では変更してください）
INSERT INTO admin_settings (setting_key, setting_value) VALUES
  ('admin_password', 'fukubukuro2025'),
  ('staff_pin', '1234');

-- =====================================================
-- チケットセット発行用の関数
-- =====================================================

-- アートメイク リピーター様セット発行
CREATE OR REPLACE FUNCTION create_artmake_repeater_set(note TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_set_id UUID;
BEGIN
  -- セット作成
  INSERT INTO ticket_sets (set_type, customer_note)
  VALUES ('artmake_repeater', note)
  RETURNING id INTO new_set_id;

  -- チケットA: 施術チケット
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES (new_set_id, 'A', '施術チケット', 'アートメイク施術1回');

  -- チケットB: 物販10%割引
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES (new_set_id, 'B', '物販10%割引チケット', '物販商品10%OFF');

  RETURN new_set_id;
END;
$$ LANGUAGE plpgsql;

-- アートメイク ご新規様セット発行
CREATE OR REPLACE FUNCTION create_artmake_new_set(note TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_set_id UUID;
BEGIN
  INSERT INTO ticket_sets (set_type, customer_note)
  VALUES ('artmake_new', note)
  RETURNING id INTO new_set_id;

  -- チケットC: 施術2回チケット（1枚で2回分）
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES (new_set_id, 'C', '施術2回チケット', 'アートメイク施術2回分（1回ずつ消費可）');

  RETURN new_set_id;
END;
$$ LANGUAGE plpgsql;

-- エステ 肌底上げセット発行
CREATE OR REPLACE FUNCTION create_esthe_basic_set(note TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_set_id UUID;
BEGIN
  INSERT INTO ticket_sets (set_type, customer_note)
  VALUES ('esthe_basic', note)
  RETURNING id INTO new_set_id;

  -- チケットD: 施術1メニュー無料券
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES (new_set_id, 'D', '施術1メニュー無料券', 'エステ施術1メニュー無料');

  -- チケットE: 美肌アイテム引換券
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES (new_set_id, 'E', '選べる美肌アイテム引換券', '美容アイテム1点と交換');

  -- チケットB: 物販10%割引
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES (new_set_id, 'B', '物販10%割引チケット', '物販商品10%OFF');

  RETURN new_set_id;
END;
$$ LANGUAGE plpgsql;

-- エステ ご褒美セット発行
CREATE OR REPLACE FUNCTION create_esthe_reward_set(note TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_set_id UUID;
BEGIN
  INSERT INTO ticket_sets (set_type, customer_note)
  VALUES ('esthe_reward', note)
  RETURNING id INTO new_set_id;

  -- チケットD: 施術1メニュー無料券 ×2
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES
    (new_set_id, 'D', '施術1メニュー無料券①', 'エステ施術1メニュー無料'),
    (new_set_id, 'D', '施術1メニュー無料券②', 'エステ施術1メニュー無料');

  -- チケットE: 美肌アイテム引換券
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES (new_set_id, 'E', '選べる美肌アイテム引換券', '美容アイテム1点と交換');

  -- チケットB: 物販10%割引
  INSERT INTO tickets (set_id, ticket_type, ticket_name, ticket_description)
  VALUES (new_set_id, 'B', '物販10%割引チケット', '物販商品10%OFF');

  RETURN new_set_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row Level Security (RLS) 設定
-- =====================================================

-- RLS有効化
ALTER TABLE ticket_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 全員読み取り可能（認証なしアクセス用）
CREATE POLICY "Allow public read ticket_sets" ON ticket_sets
  FOR SELECT USING (true);

CREATE POLICY "Allow public read tickets" ON tickets
  FOR SELECT USING (true);

CREATE POLICY "Allow public read staff" ON staff
  FOR SELECT USING (true);

-- 更新・挿入はサービスロールのみ（API経由）
CREATE POLICY "Allow service role all ticket_sets" ON ticket_sets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role all tickets" ON tickets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role all staff" ON staff
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role all admin_settings" ON admin_settings
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- インデックス
-- =====================================================

CREATE INDEX idx_tickets_set_id ON tickets(set_id);
CREATE INDEX idx_tickets_is_used ON tickets(is_used);
CREATE INDEX idx_ticket_sets_set_type ON ticket_sets(set_type);
