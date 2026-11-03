import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Plus, Trash2, UserMinus } from "lucide-react";
import { Field, FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getKelasByPeriode, getPeriodeList, labelPeriode } from "@/lib/data/master";
import {
  getKelompokProgram,
  getPenandaTangan,
  getPenugasanGuru,
  getProfilAktif,
  getProgramByKode,
} from "@/lib/data/program";
import { hapusGuruProgram, hapusPenandaTangan, tambahGuruProgram, tambahPenandaTangan } from "../../actions";
import { ReorderButtons } from "./reorder-buttons";

export default function GuruProgramPage(props: PageProps<"/program/[kode]/guru">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Isi params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Isi({
  params,
  searchParams,
}: {
  params: PageProps<"/program/[kode]/guru">["params"];
  searchParams: PageProps<"/program/[kode]/guru">["searchParams"];
}) {
  await requireRole("admin", "koordinator");
  const { kode } = await params;
  const { periode: periodeParam } = await searchParams;

  const program = await getProgramByKode(kode);
  if (!program) notFound();

  const daftarPeriode = await getPeriodeList();
  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }

  const dipilih =
    daftarPeriode.find((p) => p.id === (Array.isArray(periodeParam) ? periodeParam[0] : periodeParam)) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  const [kelompok, penugasan, penandaTangan, profil, daftarKelas] = await Promise.all([
    getKelompokProgram(program.id, dipilih.id),
    getPenugasanGuru(program.id, dipilih.id),
    getPenandaTangan(program.id, dipilih.id),
    getProfilAktif(),
    getKelasByPeriode(dipilih.id),
  ]);

  return (
    <div className="grid gap-6">
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      {/* ===== Guru ditugaskan ===== */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Guru Program</h2>
          <FormDialog
            trigger={
              <Button size="sm">
                <Plus /> Tugaskan guru
              </Button>
            }
            title="Tugaskan guru ke program"
            action={tambahGuruProgram.bind(null, program.id, dipilih.id)}
          >
            <Field label="Guru" htmlFor="guru_id">
              <NativeSelect id="guru_id" name="guru_id" className="w-full" required defaultValue="">
                <NativeSelectOption value="" disabled>
                  Pilih guru…
                </NativeSelectOption>
                {profil.map((g) => (
                  <NativeSelectOption key={g.id} value={g.id}>
                    {g.nama}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field
              label="Cakupan Penugasan"
              htmlFor="cakupan"
              hint="Guru untuk seluruh program, spesifik kelas (mis. KSM), atau satu kelompok/halaqah."
            >
              <NativeSelect id="cakupan" name="cakupan" className="w-full" defaultValue="">
                <optgroup label="Umum">
                  <NativeSelectOption value="">Seluruh program</NativeSelectOption>
                </optgroup>
                {daftarKelas.length > 0 && (
                  <optgroup label="Spesifik Kelas">
                    {daftarKelas.map((k) => (
                      <NativeSelectOption key={k.id} value={`kelas:${k.id}`}>
                        Kelas {k.nama} (Tingkat {k.tingkat})
                      </NativeSelectOption>
                    ))}
                  </optgroup>
                )}
                {kelompok.length > 0 && (
                  <optgroup label="Spesifik Kelompok">
                    {kelompok.map((k) => (
                      <NativeSelectOption key={k.id} value={`kelompok:${k.id}`}>
                        Kelompok {k.nama}
                      </NativeSelectOption>
                    ))}
                  </optgroup>
                )}
              </NativeSelect>
            </Field>
          </FormDialog>
        </div>

        {penugasan.length === 0 ? (
          <EmptyState title="Belum ada guru ditugaskan" description="Klik Tugaskan guru untuk menambahkan." />
        ) : (
          <div className="grid gap-2">
            {penugasan.map((p) => {
              const labelCakupan = p.kelas_nama
                ? `Kelas ${p.kelas_nama}`
                : p.kelompok_nama
                ? `Kelompok ${p.kelompok_nama}`
                : "Seluruh program";
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <div className="grid gap-0.5">
                    <span className="font-medium">{p.guru.nama}</span>
                    {p.guru.nip ? <span className="text-xs text-muted-foreground">NIP. {p.guru.nip}</span> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.kelas_nama ? "default" : p.kelompok_nama ? "secondary" : "outline"}>
                      {labelCakupan}
                    </Badge>
                    <FormDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Hapus penugasan ${p.guru.nama}`}>
                          <UserMinus />
                        </Button>
                      }
                      title={`Hapus penugasan ${p.guru.nama}?`}
                      description={`Cakupan: ${labelCakupan}`}
                      submitLabel="Hapus"
                      destructive
                      action={hapusGuruProgram.bind(null, p.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== Penanda tangan rapor (maks 3, berurutan) ===== */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Penanda Tangan Rapor</h2>
            <p className="text-sm text-muted-foreground">
              Maks. 3 guru per program. Kepala Madrasah otomatis tercetak paling bawah (lihat menu Pengaturan).
            </p>
          </div>
          {penandaTangan.length < 3 ? (
            <FormDialog
              trigger={
                <Button size="sm" variant="outline">
                  <Plus /> Tambah
                </Button>
              }
              title="Tambah penanda tangan"
              action={tambahPenandaTangan.bind(null, program.id, dipilih.id, penandaTangan.length + 1)}
            >
              <Field label="Guru" htmlFor="guru_id">
                <NativeSelect id="guru_id" name="guru_id" className="w-full" required defaultValue="">
                  <NativeSelectOption value="" disabled>
                    Pilih guru…
                  </NativeSelectOption>
                  {profil.map((g) => (
                    <NativeSelectOption key={g.id} value={g.id}>
                      {g.nama}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Label jabatan" htmlFor="label_jabatan" hint='Contoh: "Guru Program", "Koordinator Program"'>
                <Input id="label_jabatan" name="label_jabatan" defaultValue="Guru Program" required />
              </Field>
            </FormDialog>
          ) : null}
        </div>

        {penandaTangan.length === 0 ? (
          <EmptyState title="Belum ada penanda tangan" description="Klik Tambah untuk menetapkan guru penanda tangan." />
        ) : (
          <div className="grid gap-2">
            {penandaTangan.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border p-3">
                <ReorderButtons
                  programId={program.id}
                  periodeId={dipilih.id}
                  id={p.id}
                  isFirst={i === 0}
                  isLast={i === penandaTangan.length - 1}
                />
                <Badge className="shrink-0">{p.urutan}</Badge>
                <div className="grid flex-1 gap-0.5">
                  <span className="font-medium">{p.guru.nama}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.label_jabatan}
                    {p.guru.nip ? ` · NIP. ${p.guru.nip}` : ""}
                  </span>
                </div>
                <FormDialog
                  trigger={
                    <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${p.guru.nama} dari penanda tangan`}>
                      <Trash2 />
                    </Button>
                  }
                  title={`Hapus ${p.guru.nama} dari penanda tangan?`}
                  submitLabel="Hapus"
                  destructive
                  action={hapusPenandaTangan.bind(null, program.id, dipilih.id, p.id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
