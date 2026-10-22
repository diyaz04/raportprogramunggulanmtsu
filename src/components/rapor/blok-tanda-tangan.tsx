import { formatTanggal } from "@/lib/format";

export type GuruTtd = { nama: string; nip: string | null; label_jabatan: string };

/**
 * Blok tanda tangan dinamis: 1–3 guru program + Kepala Madrasah selalu paling bawah
 * (PERENCANAAN §5.3). Kepala TIDAK ikut daftar `guru` — namanya dari Pengaturan.
 */
export function BlokTandaTangan({
  guru,
  kepalaNama,
  kepalaNip,
  kota,
  tanggalRapor,
}: {
  guru: GuruTtd[];
  kepalaNama: string | null;
  kepalaNip: string | null;
  kota: string;
  tanggalRapor: string | null;
}) {
  const kepala = (
    <TtdBlok label="Kepala Madrasah" nama={kepalaNama ?? "—"} nip={kepalaNip} />
  );

  return (
    <div className="mt-4 grid gap-6 text-[0.85em]">
      <p className="text-right">
        {kota}, {formatTanggal(tanggalRapor)}
      </p>

      {guru.length <= 1 ? (
        <div className="grid grid-cols-2 gap-4">
          {guru[0] ? <TtdBlok label={guru[0].label_jabatan} nama={guru[0].nama} nip={guru[0].nip} /> : <div />}
          {kepala}
        </div>
      ) : (
        <div className="grid gap-8">
          <div className={guru.length === 2 ? "grid grid-cols-2 gap-4" : "grid grid-cols-3 gap-4"}>
            {guru.map((g, i) => (
              <TtdBlok key={i} label={g.label_jabatan} nama={g.nama} nip={g.nip} />
            ))}
          </div>
          <div className="flex justify-center">
            <div className="text-center">
              <p>Mengetahui</p>
              <p className="mb-8">Kepala Madrasah</p>
              <p className="font-bold underline">{kepalaNama ?? "—"}</p>
              {kepalaNip ? <p>NIP. {kepalaNip}</p> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TtdBlok({ label, nama, nip }: { label: string; nama: string; nip: string | null }) {
  return (
    <div className="text-center">
      <p>{label}</p>
      <div className="h-12" />
      <p className="font-bold underline">{nama}</p>
      {nip ? <p>NIP. {nip}</p> : null}
    </div>
  );
}
