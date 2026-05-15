-- Storage bucket for inspection attachments (private; signed download URLs from server).

INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-attachments', 'inspection-attachments', false)
ON CONFLICT (id) DO NOTHING;
