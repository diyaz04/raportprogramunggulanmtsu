/** Teks diagonal berulang di belakang isi rapor (PERENCANAAN §5.1). Hanya tampil kalau diaktifkan di Pengaturan. */
export function Watermark({ teks }: { teks: string }) {
  const baris = Array.from({ length: 14 }, (_, i) => i);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      <div
        className="absolute inset-[-25%] flex flex-col justify-between text-emerald-700/10"
        style={{ transform: "rotate(-35deg)", fontSize: "1.3em", fontWeight: 700, letterSpacing: "0.05em" }}
      >
        {baris.map((i) => (
          <p key={i} className="whitespace-nowrap">
            {Array.from({ length: 6 }, () => teks).join("  ")}
          </p>
        ))}
      </div>
    </div>
  );
}
