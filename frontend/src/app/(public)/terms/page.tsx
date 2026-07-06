export const metadata = {
  title: "الشروط والأحكام — داسم للفحص",
  description: "شروط وأحكام استخدام منصّة داسم للفحص الفني للمركبات.",
};

export default function TermsPage() {
  return (
    <article
      className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14"
      dir="rtl"
    >
      <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
        الشروط والأحكام
      </h1>
      <p className="mt-2 text-sm text-gray-500">آخر تحديث: 1447هـ</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            قبول الشروط
          </h2>
          <p>
            باستخدامك منصّة «داسم للفحص» فإنك توافق على هذه الشروط. إن لم توافق،
            يُرجى عدم استخدام الخدمة.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">الخدمة</h2>
          <p>
            توفّر المنصّة وسيطاً لطلب الفحص الفني للمركبات لدى ورش معتمدة، وإصدار
            تقارير، وحفظ السجل الفني. التقارير استرشادية وتعكس حالة المركبة وقت
            الفحص.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            المسؤوليات
          </h2>
          <ul className="list-disc space-y-1 pr-5">
            <li>تقديم بيانات صحيحة عن المركبة والطلب.</li>
            <li>الالتزام بمواعيد الفحص المتّفق عليها مع الورشة.</li>
            <li>سداد رسوم الخدمة عبر وسائل الدفع المعتمدة.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            الرسوم والدفع
          </h2>
          <p>
            تُعرض رسوم الخدمة قبل التأكيد. تتم المدفوعات عبر مزوّد دفع معتمد.
            تُوضّح سياسة الاسترداد عند الطلب حسب حالة الخدمة.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">التواصل</h2>
          <p>
            للاستفسارات:{" "}
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
