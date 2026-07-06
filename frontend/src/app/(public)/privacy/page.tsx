export const metadata = {
  title: "سياسة الخصوصية — فحص داسم",
  description: "سياسة خصوصية منصّة فحص داسم الفني للمركبات.",
};

export default function PrivacyPage() {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14"
      dir="rtl"
    >
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
        سياسة الخصوصية
      </h1>
      <p className="mt-2 text-sm text-gray-500">آخر تحديث: 1447هـ</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">مقدمة</h2>
          <p>
            تحترم منصّة «فحص داسم» خصوصيتك. توضّح هذه السياسة البيانات التي
            نعالجها عند استخدامك لخدمات الفحص الفني للمركبات، وكيف نستخدمها
            ونحميها.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            البيانات التي نعالجها
          </h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>معرّفات حسابك في منصّة داسم (معرّف المستخدم والمركبة).</li>
            <li>
              بيانات طلبات الفحص: نوع الخدمة، الورشة، حالة الطلب، والتقارير
              الناتجة.
            </li>
            <li>السجل الفني للمركبة: الصيانة، فحوص OBD، والتقارير المرفوعة.</li>
            <li>بيانات الموقع أثناء الفحص الميداني (عند تفعيله من الفاحص).</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            كيف نستخدم البيانات
          </h2>
          <p>
            نستخدم بياناتك لتقديم خدمة الفحص، ربط الطلبات بالورش المعتمدة، إصدار
            التقارير، وحفظ السجل الفني لمركبتك. لا نبيع بياناتك لأطراف خارجية.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            المشاركة والحماية
          </h2>
          <p>
            تُشارك بيانات الطلب مع الورشة المعتمدة المسؤولة عن فحص مركبتك فقط.
            تُحفظ البيانات بضوابط وصول وتشفير أثناء النقل (HTTPS)، وسياسات أمان
            على مستوى الصفوف في قاعدة البيانات.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">حقوقك</h2>
          <p>
            يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذف حسابك عبر التواصل
            معنا. تُعالَج الطلبات وفق الأنظمة المعمول بها في المملكة العربية
            السعودية.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">التواصل</h2>
          <p>
            لأي استفسار حول الخصوصية:{" "}
            <a
              href="mailto:support@dasm.com.sa"
              className="font-medium text-[#1E74E8] hover:underline"
            >
              support@dasm.com.sa
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}
