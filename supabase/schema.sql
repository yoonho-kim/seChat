-- SeChat Database Schema
-- Run this in your Supabase SQL Editor

-- Rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(4) NOT NULL,
  admin_label VARCHAR(120),
  status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  CONSTRAINT unique_active_code UNIQUE (code)
);

-- Participants table (max 2 per room: 1 counselor + 1 client)
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('counselor', 'client')),
  display_name VARCHAR(100),
  session_id UUID DEFAULT gen_random_uuid(),
  joined_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_role_per_room UNIQUE (room_id, role)
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  sender_role VARCHAR(10) NOT NULL CHECK (sender_role IN ('counselor', 'client', 'admin', 'system')),
  sender_name VARCHAR(100),
  client_message_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_message_per_client UNIQUE (room_id, client_message_id)
);

-- Global app settings table (admin-managed)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rooms_code ON rooms(code) WHERE status = 'active';
CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_participants_session ON participants(session_id);

-- Enable Realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- RLS Policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service_role (API routes use service_role key)
-- For anon key (browser realtime), allow SELECT on messages
CREATE POLICY "Allow public read on messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on participants" ON participants
  FOR SELECT USING (true);

-- Seed default entry message setting
INSERT INTO app_settings (key, value)
VALUES ('room_entry_message', '')
ON CONFLICT (key) DO NOTHING;
