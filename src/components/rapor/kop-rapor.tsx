import type { Pengaturan } from "@/lib/data/master";

type KopProps = Pick<
  Pengaturan,
  "instansi_induk" | "nama_madrasah" | "alamat" | "wilayah" | "logo_kiri_url" | "logo_kanan_url"
>;

/**
 * Kop surat rapor, meniru rapor reguler madrasah: logo kiri (Kemenag) + logo kanan (madrasah),
 * teks tengah, garis tebal di bawah. Dipakai di pratinjau Pengaturan dan nanti di rapor A4.
 */
export function KopRapor({ instansi_induk, nama_madrasah, alamat, wilayah, logo_kiri_url, logo_kanan_url }: KopProps) {
  return (
    <header className="border-b-2 border-black pb-2 text-black">
      <div className="flex items-center gap-3">
        <Logo src={logo_kiri_url} alt="Logo kiri" />
        <div className="flex-1 text-center leading-tight">
          <p className="text-[0.8em] font-bold uppercase">{instansi_induk}</p>
          <p className="font-serif text-[1.35em] font-bold uppercase leading-snug">{nama_madrasah}</p>
          <p className="font-serif text-[0.7em] italic">{alamat}</p>
          <p className="font-serif text-[0.7em] italic">{wilayah}</p>
        </div>
        <Logo src={logo_kanan_url} alt="Logo kanan" />
      </div>
    </header>
  );
}

function Logo({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="flex size-[4.5em] shrink-0 items-center justify-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL publik Supabase Storage; <img> menjaga hasil cetak apa adanya
        <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
      ) : (
        <div className="flex size-full items-center justify-center rounded border border-dashed border-gray-300 text-center text-[0.55em] text-gray-400 print:border-transparent">
          Logo
        </div>
      )}
    </div>
  );
}
