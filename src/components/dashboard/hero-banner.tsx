import { Calendar, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { inisialNama } from "@/lib/utils";

type HeroBannerProps = {
  nama: string;
  role?: string;
  roleLabel?: string;
  nip?: string | null;
  fotoUrl?: string | null;
  namaMadrasah: string;
  motto: string;
};

export function HeroBanner({
  nama,
  roleLabel = "Pendidik",
  nip,
  fotoUrl,
  namaMadrasah,
  motto,
}: HeroBannerProps) {
  const tanggalHariIni = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-700/30 text-white shadow-xl shadow-emerald-950/15">
      {/* Background Image & Gradient Layers */}
      {/* eslint-disable-next-line @next/next/no-img-element -- background madrasah statis */}
      <img
        src="/login-bg.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover object-center filter brightness-95 scale-105 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-emerald-900/85 to-teal-950/80 backdrop-blur-[2px]" />
      
      {/* Decorative Glow Elements */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-teal-400/15 blur-3xl" />

      {/* Main Content */}
      <div className="relative z-10 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Sisi Kiri: Foto Guru + Sambutan */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            
            {/* Foto Profil Guru dengan Frame Keren */}
            <div className="relative shrink-0 group">
              <div className="relative size-24 sm:size-28 rounded-2xl p-1 bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-500/30">
                <div className="relative size-full rounded-xl overflow-hidden bg-emerald-950 ring-2 ring-emerald-950/50">
                  {fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- foto guru dinamis
                    <img
                      src={fotoUrl}
                      alt={nama}
                      className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white select-none">
                      <span className="text-2xl sm:text-3xl font-extrabold tracking-wider text-emerald-50 drop-shadow">
                        {inisialNama(nama)}
                      </span>
                      <span className="mt-0.5 text-[10px] uppercase tracking-widest text-emerald-200/80 font-medium">
                        Guru
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge Aktif */}
              <div
                className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full bg-emerald-950/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 shadow-md border border-emerald-400/40 backdrop-blur-sm"
                title="Status Akun Aktif"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                <span>Aktif</span>
              </div>
            </div>

            {/* Informasi Guru & Greeting */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/25 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30 backdrop-blur-md shadow-sm">
                  <Sparkles className="size-3 text-amber-300 animate-pulse" />
                  {roleLabel}
                </span>

                {nip && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-emerald-100/90 border border-white/15 backdrop-blur-sm font-mono">
                    <ShieldCheck className="size-3 text-teal-300" />
                    NIP. {nip}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                Assalamu&rsquo;alaikum, <span className="text-emerald-200">{nama}</span>
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/85 max-w-xl font-normal leading-relaxed">
                Selamat datang di sistem manajemen Rapor Program Unggulan{" "}
                <span className="font-semibold text-white">{namaMadrasah}</span>.
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Kartu Tanggal & Motto */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-4 border-t border-white/10 lg:pt-0 lg:border-t-0">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-medium text-emerald-100 border border-white/15 backdrop-blur-md shadow-sm">
              <Calendar className="size-3.5 text-amber-300" />
              <span>{tanggalHariIni}</span>
            </div>

            <div className="hidden sm:block max-w-xs text-right">
              <p className="text-xs italic text-emerald-200/90 leading-snug">
                &ldquo;{motto}&rdquo;
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
