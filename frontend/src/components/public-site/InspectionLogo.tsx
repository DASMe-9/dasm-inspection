type Props = { compact?: boolean };

/** شعار DASM INSPECT الكامل المعتمد. */
export function InspectionLogo({ compact }: Props) {
  return (
    <div
      className="overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-white/15"
      style={{ width: compact ? 64 : 88, height: compact ? 64 : 88 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/dasm-inspect.png"
        alt="DASM INSPECT"
        className="h-full w-full object-contain"
      />
    </div>
  );
}
