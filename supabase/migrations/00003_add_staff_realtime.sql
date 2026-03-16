-- Add staff table to realtime publication
-- The initial schema (00001) included beds, patients, requests, equipment, hospitals
-- but omitted staff from supabase_realtime publication.
ALTER PUBLICATION supabase_realtime ADD TABLE staff;
