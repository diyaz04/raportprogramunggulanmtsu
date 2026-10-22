"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action";
import type { SuratDiJuz } from "@/lib/data/tahfidz";
import { tambahHafalan, tambahJuzPenuh } from "../actions";

const JUZ_LIST = Array.from({ length: 30 }, (_, i) => i + 1);

export function HafalanForm({ siswaId, periodeSetorId, semuaSuratPerJuz }: { siswaId: string; periodeSetorId: string; semuaSuratPerJuz: SuratDiJuz[] }) {
  const [juz, setJuz] = useState(30);
  const [suratTerpilih, setSuratTerpilih] = useState<SuratDiJuz | null>(null);
  const [nilaiSeragam, setNilaiSeragam] = useState("");
  const [pendingJuzPenuh, startTransition] = useTransition();

  const suratDiJuzIni = useMemo(
    () => semuaSuratPerJuz.filter((s) => s.juz === juz).sort((a, b) => a.ayat_awal - b.ayat_awal),
    [semuaSuratPerJuz, juz],
  );

  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await tambahHafalan(siswaId, periodeSetorId, prev, formData);
    if (result.ok) toast.success(result.message ?? "Tersimpan");
    return result;
  }, {});

  function tambahSatuJuzPenuh() {
    const nilai = nilaiSeragam.trim() === "" ? null : Number(nilaiSeragam);
    startTransition(async () => {
      const result = await tambahJuzPenuh(siswaId, periodeSetorId, juz, nilai, {});
      if (result.error) toast.error(result.error);
      else toast.success(result.message);
    });
  }

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Tambah Hafalan</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="Nilai seragam"
            className="h-8 w-28"
            value={nilaiSeragam}
            onChange={(e) => setNilaiSeragam(e.target.value)}
            aria-label="Nilai seragam untuk 1 juz penuh (opsional)"
          />
          <Button type="button" variant="outline" size="sm" disabled={pendingJuzPenuh} onClick={tambahSatuJuzPenuh}>
            {pendingJuzPenuh ? <Loader2 className="animate-spin" /> : null} Tandai 1 juz penuh
          </Button>
        </div>
      </div>
      <p className="-mt-1 text-xs text-muted-foreground">
        Isi &ldquo;Nilai seragam&rdquo; untuk menandai semua surat di juz terpilih sudah hafal dengan nilai yang sama sekaligus
        (surat yang sudah tercatat tapi belum punya nilai ikut diisi). Kosongkan kalau mau menilai per surat secara
        manual di bawah.
      </p>

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Juz" htmlFor="juz">
          <NativeSelect
            id="juz"
            name="juz"
            className="w-full"
            value={juz}
            onChange={(e) => {
              setJuz(Number(e.target.value));
              setSuratTerpilih(null);
            }}
          >
            {JUZ_LIST.map((j) => (
              <NativeSelectOption key={j} value={j}>
                Juz {j}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Surat" htmlFor="surat_no">
          <NativeSelect
            id="surat_no"
            name="surat_no"
            className="w-full"
            required
            value={suratTerpilih?.surat_no ?? ""}
            onChange={(e) => {
              const s = suratDiJuzIni.find((x) => x.surat_no === Number(e.target.value)) ?? null;
              setSuratTerpilih(s);
            }}
          >
            <NativeSelectOption value="" disabled>
              Pilih surat…
            </NativeSelectOption>
            {suratDiJuzIni.map((s) => (
              <NativeSelectOption key={s.surat_no} value={s.surat_no}>
                {s.nama_latin} ({s.ayat_awal}-{s.ayat_akhir})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Ayat awal" htmlFor="ayat_awal">
          <Input
            id="ayat_awal"
            name="ayat_awal"
            type="number"
            min={suratTerpilih?.ayat_awal ?? 1}
            max={suratTerpilih?.ayat_akhir}
            defaultValue={suratTerpilih?.ayat_awal}
            key={`awal-${suratTerpilih?.surat_no}`}
            required
          />
        </Field>
        <Field label="Ayat akhir" htmlFor="ayat_akhir">
          <Input
            id="ayat_akhir"
            name="ayat_akhir"
            type="number"
            min={suratTerpilih?.ayat_awal}
            max={suratTerpilih?.ayat_akhir}
            defaultValue={suratTerpilih?.ayat_akhir}
            key={`akhir-${suratTerpilih?.surat_no}`}
            required
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <Field label="Nilai" htmlFor="nilai" hint="Opsional, bisa dikosongkan dulu">
          <Input id="nilai" name="nilai" type="number" min={0} max={100} className="w-24" />
        </Field>
        <Field label="Catatan" htmlFor="catatan" hint="Opsional">
          <Textarea id="catatan" name="catatan" rows={1} />
        </Field>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? <Loader2 className="animate-spin" /> : <Plus />} Simpan
      </Button>
    </form>
  );
}
