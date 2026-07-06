export const metadata = {
  title: "من نحن — فحص داسم",
  description: "منصّة فحص داسم الفني للمركبات — من نحن.",
};

export default function AboutPage() {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14"
      dir="rtl"
    >
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">من نحن</h1>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <p>
          «فحص داسم» منصّة الفحص الفني للمركبات ضمن منظومة داسم. نربط أصحاب
          المركبات بشبكة ورش معتمدة لإجراء فحوص موثوقة — في الورشة أو ميدانياً —
          مع تقارير واضحة وسجل فني دائم لكل مركبة.
        </p>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            ماذا نقدّم
          </h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>طلب فحص فني وربطه بورشة معتمدة.</li>
            <li>تقارير فحص ببنود واضحة وحالة كل بند.</li>
            <li>سجل فني للمركبة: فحوص، صيانة، وقراءات OBD.</li>
            <li>تذكيرات صيانة وتوصيات إصلاح.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">رؤيتنا</h2>
          <p>
            رفع موثوقية سوق المركبات عبر شفافية الحالة الفنية — بحيث يشتري ويبيع
            الجميع بثقة مبنية على فحص موثّق.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            تواصل معنا
          </h2>
          <p>
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
