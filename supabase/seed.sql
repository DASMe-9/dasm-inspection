-- ============================================================================
-- DASM Inspection — بيانات اختبار إنتاجية الطابع (Production-like test data)
-- ============================================================================
-- تحمل هوية داسم، غير حسّاسة، بلا بيانات شخصية/تجارية حقيقية. كافية لتظهر في
-- تطبيق الفاحص بشكل مقنع لمراجعة Apple وللاختبارات الداخلية.
--
-- إعادة التشغيل آمنة (idempotent): معرّفات ثابتة + ON CONFLICT.
-- لاستبدالها ببيانات تشغيل فعلية لاحقاً: عدّل القيم أدناه أو استبدل الملف.
--
-- 🔑 نقطة الربط الوحيدة القابلة للتغيير: TRIAL_INSPECTOR_DASM_USER_ID
--    = معرّف مستخدم منصّة داسم (DASM-core users.id) المخصّص لحساب الفاحص التجريبي.
--    الحساب التجريبي الحالي: inspector.demo@dasm.com.sa → users.id = 319.
--    عند تغيير الحساب: بدّل القيمة '319' في صفّ الفاحص I1 أدناه فقط.
-- ============================================================================

-- 1) الورش (DASM-branded)
INSERT INTO inspection_workshops (id, slug, name, city, phone, email, is_verified, dasm_partner_ref) VALUES
('d5000001-0000-4000-8000-000000000001','dasm-inspection-dammam','ورشة داسم للفحص - الدمام','الدمام','+966138100101','dammam@inspect.dasm.com.sa',true,'DASM-WS-101'),
('d5000001-0000-4000-8000-000000000002','dasm-vehicle-inspection-riyadh','مركز داسم لفحص المركبات - الرياض','الرياض','+966118100102','riyadh@inspect.dasm.com.sa',true,'DASM-WS-102'),
('d5000001-0000-4000-8000-000000000003','dasm-mobile-inspection-jeddah','مركز داسم للفحص المتنقل - جدة','جدة','+966128100103','jeddah@inspect.dasm.com.sa',true,'DASM-WS-103')
ON CONFLICT (id) DO UPDATE SET
  slug=EXCLUDED.slug, name=EXCLUDED.name, city=EXCLUDED.city, phone=EXCLUDED.phone,
  email=EXCLUDED.email, is_verified=EXCLUDED.is_verified, dasm_partner_ref=EXCLUDED.dasm_partner_ref;

-- 2) الفاحصون. I1 = حساب الدخول التجريبي (مربوط بـ DASM-core user 319).
--    I2/I3 فاحصو عرض بلا دخول (dasm_user_id اصطناعي لا يقابل حساباً حقيقياً).
INSERT INTO inspection_inspectors (id, workshop_id, full_name, dasm_user_id, active) VALUES
('d5000002-0000-4000-8000-000000000001','d5000001-0000-4000-8000-000000000001','فاحص داسم التجريبي','319',true),   -- 🔑 TRIAL_INSPECTOR_DASM_USER_ID
('d5000002-0000-4000-8000-000000000002','d5000001-0000-4000-8000-000000000002','فاحص داسم - الرياض','demo-inspector-riyadh',true),
('d5000002-0000-4000-8000-000000000003','d5000001-0000-4000-8000-000000000003','فاحص داسم - جدة','demo-inspector-jeddah',true)
ON CONFLICT (id) DO UPDATE SET
  workshop_id=EXCLUDED.workshop_id, full_name=EXCLUDED.full_name,
  dasm_user_id=EXCLUDED.dasm_user_id, active=EXCLUDED.active;

-- 3) التسعير (افتراضي المنصّة + لكل ورشة)
INSERT INTO inspection_service_pricing (id, workshop_id, service_mode, price_sar, currency, is_active, notes) VALUES
('d5000003-0000-4000-8000-000000000001',NULL,'workshop',350.00,'SAR',true,'سعر افتراضي — فحص في الورشة'),
('d5000003-0000-4000-8000-000000000002',NULL,'field',550.00,'SAR',true,'سعر افتراضي — فحص ميداني'),
('d5000003-0000-4000-8000-000000000011','d5000001-0000-4000-8000-000000000001','workshop',350.00,'SAR',true,'ورشة داسم الدمام — في الورشة'),
('d5000003-0000-4000-8000-000000000012','d5000001-0000-4000-8000-000000000001','field',550.00,'SAR',true,'ورشة داسم الدمام — ميداني'),
('d5000003-0000-4000-8000-000000000021','d5000001-0000-4000-8000-000000000002','workshop',375.00,'SAR',true,'مركز داسم الرياض — في الورشة'),
('d5000003-0000-4000-8000-000000000031','d5000001-0000-4000-8000-000000000003','field',600.00,'SAR',true,'مركز داسم المتنقل جدة — ميداني')
ON CONFLICT (id) DO UPDATE SET
  workshop_id=EXCLUDED.workshop_id, service_mode=EXCLUDED.service_mode,
  price_sar=EXCLUDED.price_sar, currency=EXCLUDED.currency,
  is_active=EXCLUDED.is_active, notes=EXCLUDED.notes;

-- 4) طلبات الفحص عبر دورة الحياة. المُسندة تذهب للفاحص التجريبي I1 @ الدمام.
INSERT INTO inspection_requests (id, title, dasm_car_id, vehicle_label, dasm_user_id, status, workshop_id, inspector_id, service_mode) VALUES
('d5000004-0000-4000-8000-000000000001','طلب فحص Toyota Camry 2021','DEMO-CAR-2001','Toyota Camry 2021','demo-owner-1','submitted',NULL,NULL,'workshop'),
('d5000004-0000-4000-8000-000000000002','طلب فحص Hyundai Elantra 2020','DEMO-CAR-2002','Hyundai Elantra 2020','demo-owner-2','assigned','d5000001-0000-4000-8000-000000000001','d5000002-0000-4000-8000-000000000001','workshop'),
('d5000004-0000-4000-8000-000000000003','طلب فحص Ford Taurus 2022','DEMO-CAR-2003','Ford Taurus 2022','demo-owner-3','in_progress','d5000001-0000-4000-8000-000000000001','d5000002-0000-4000-8000-000000000001','workshop'),
('d5000004-0000-4000-8000-000000000004','طلب فحص Chevrolet Malibu 2020','DEMO-CAR-2004','Chevrolet Malibu 2020','demo-owner-4','approved','d5000001-0000-4000-8000-000000000001','d5000002-0000-4000-8000-000000000001','workshop')
ON CONFLICT (id) DO UPDATE SET
  title=EXCLUDED.title, dasm_car_id=EXCLUDED.dasm_car_id, vehicle_label=EXCLUDED.vehicle_label,
  dasm_user_id=EXCLUDED.dasm_user_id, status=EXCLUDED.status,
  workshop_id=EXCLUDED.workshop_id, inspector_id=EXCLUDED.inspector_id, service_mode=EXCLUDED.service_mode;

-- 5) تقرير مكتمل للطلب المعتمد + بنود الفحص
INSERT INTO inspection_reports (id, request_id, workshop_id, inspector_id, overall_summary, submitted_at, approved_at, approved_by_role) VALUES
('d5000005-0000-4000-8000-000000000001','d5000004-0000-4000-8000-000000000004','d5000001-0000-4000-8000-000000000001','d5000002-0000-4000-8000-000000000001','المركبة بحالة جيدة عموماً. لا ملاحظات جوهرية على الهيكل أو المحرك؛ يُنصح بمتابعة تآكل الإطارات الأمامية.', now(), now(), 'inspection_admin')
ON CONFLICT (id) DO UPDATE SET
  overall_summary=EXCLUDED.overall_summary, approved_at=EXCLUDED.approved_at, approved_by_role=EXCLUDED.approved_by_role;

UPDATE inspection_requests SET report_id='d5000005-0000-4000-8000-000000000001'
  WHERE id='d5000004-0000-4000-8000-000000000004';

INSERT INTO inspection_report_items (id, report_id, section, label, status, notes, sort_order) VALUES
('d5000006-0000-4000-8000-000000000001','d5000005-0000-4000-8000-000000000001','المحرك','حالة المحرك العامة','pass',NULL,1),
('d5000006-0000-4000-8000-000000000002','d5000005-0000-4000-8000-000000000001','الفرامل','كفاءة الفرامل','pass',NULL,2),
('d5000006-0000-4000-8000-000000000003','d5000005-0000-4000-8000-000000000001','الإطارات','عمق مداس الإطارات الأمامية','warn','تآكل خفيف — يُنصح بالاستبدال خلال 3 أشهر',3),
('d5000006-0000-4000-8000-000000000004','d5000005-0000-4000-8000-000000000001','الهيكل','سلامة الهيكل والدهان','pass',NULL,4),
('d5000006-0000-4000-8000-000000000005','d5000005-0000-4000-8000-000000000001','الكهرباء','الأنظمة الكهربائية','pass',NULL,5)
ON CONFLICT (id) DO UPDATE SET
  section=EXCLUDED.section, label=EXCLUDED.label, status=EXCLUDED.status,
  notes=EXCLUDED.notes, sort_order=EXCLUDED.sort_order;

-- 6) سجلّ حالة الطلبات
INSERT INTO inspection_status_history (id, request_id, status, note, actor_role) VALUES
('d5000007-0000-4000-8000-000000000001','d5000004-0000-4000-8000-000000000001','submitted','طلب فحص جديد','dasm_user'),
('d5000007-0000-4000-8000-000000000002','d5000004-0000-4000-8000-000000000002','submitted','طلب فحص جديد','dasm_user'),
('d5000007-0000-4000-8000-000000000003','d5000004-0000-4000-8000-000000000002','assigned','تم تعيين ورشة داسم الدمام والفاحص التجريبي','inspection_admin'),
('d5000007-0000-4000-8000-000000000004','d5000004-0000-4000-8000-000000000003','submitted','طلب فحص جديد','dasm_user'),
('d5000007-0000-4000-8000-000000000005','d5000004-0000-4000-8000-000000000003','assigned','تم التعيين','inspection_admin'),
('d5000007-0000-4000-8000-000000000006','d5000004-0000-4000-8000-000000000003','in_progress','بدأ الفحص','inspector'),
('d5000007-0000-4000-8000-000000000007','d5000004-0000-4000-8000-000000000004','submitted','طلب فحص جديد','dasm_user'),
('d5000007-0000-4000-8000-000000000008','d5000004-0000-4000-8000-000000000004','assigned','تم التعيين','inspection_admin'),
('d5000007-0000-4000-8000-000000000009','d5000004-0000-4000-8000-000000000004','in_progress','بدأ الفحص','inspector'),
('d5000007-0000-4000-8000-00000000000a','d5000004-0000-4000-8000-000000000004','pending_review','رُفع التقرير للمراجعة','inspector'),
('d5000007-0000-4000-8000-00000000000b','d5000004-0000-4000-8000-000000000004','approved','اعتُمد التقرير','inspection_admin')
ON CONFLICT (id) DO NOTHING;
