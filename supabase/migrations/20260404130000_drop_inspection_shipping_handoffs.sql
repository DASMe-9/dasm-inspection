-- إزالة مجال الشحن من خدمة الفحص؛ الشحن يُدار في مستودع منفصل.
-- يعمل سواء وُجد الجدول (ترقية من مخطط قديم) أم لا (تثبيت جديد بعد إزالة الشحن من الهجرة الأساسية).
DROP TABLE IF EXISTS inspection_shipping_handoffs CASCADE;
DROP TYPE IF EXISTS inspection_handoff_status;
