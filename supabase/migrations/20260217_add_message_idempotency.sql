ALTER TABLE messages
ADD COLUMN IF NOT EXISTS client_message_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_message_per_client'
  ) THEN
    ALTER TABLE messages
    ADD CONSTRAINT unique_message_per_client UNIQUE (room_id, client_message_id);
  END IF;
END $$;
