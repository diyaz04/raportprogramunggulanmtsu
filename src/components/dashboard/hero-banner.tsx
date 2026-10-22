export function HeroBanner({ nama, namaMadrasah, motto }: { nama: string; namaMadrasah: string; motto: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl text-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- foto madrasah statis, bukan perlu optimasi next/image */}
      <img src="/login-bg.jpg" alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-800/80 to-emerald-600/60" />

      <div className="relative z-10 grid gap-3 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Assalamu&rsquo;alaikum, {nama}</h1>
          <p className="mt-1 text-sm text-white/85">Selamat datang di sistem Rapor Program Unggulan {namaMadrasah}</p>
          <div className="mt-4 h-px w-20 bg-white/40" />
        </div>
        <p className="hidden max-w-[220px] text-right text-sm leading-snug font-medium text-white/90 italic sm:block">
          &ldquo;{motto}&rdquo;
        </p>
      </div>
    </div>
  );
}
