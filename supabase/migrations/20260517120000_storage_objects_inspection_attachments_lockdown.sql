-- Lock down Storage objects in bucket `inspection-attachments` for client roles.
-- Upload/download للمرفقات يتم عبر الخادم باستخدام مفتاح الخدمة فقط (يتجاوز RLS).
-- سياسات RESTRICTIVE تُنكر الصفوف في هذا الدلو حتى لو وُجدت سياسات permissive عامة على storage.objects.

DROP POLICY IF EXISTS "inspection_attachments_storage_restrict_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "inspection_attachments_storage_restrict_anon" ON storage.objects;

CREATE POLICY "inspection_attachments_storage_restrict_authenticated"
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (NOT (bucket_id = 'inspection-attachments'))
WITH CHECK (NOT (bucket_id = 'inspection-attachments'));

CREATE POLICY "inspection_attachments_storage_restrict_anon"
ON storage.objects
AS RESTRICTIVE
FOR ALL
TO anon
USING (NOT (bucket_id = 'inspection-attachments'))
WITH CHECK (NOT (bucket_id = 'inspection-attachments'));
