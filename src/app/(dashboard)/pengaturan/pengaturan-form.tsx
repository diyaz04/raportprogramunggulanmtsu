"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ActionState } from "@/lib/action";
import type { Pengaturan } from "@/lib/data/master";
import { simpanPengaturan } from "./actions";

export function PengaturanForm({ pengaturan }: { pengaturan: Pengaturan }) {
  const [watermarkAktif, setWatermarkAktif] = useState(pengaturan.watermark_aktif);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const hasil = await simpanPengaturan(prev, formData);
    if (hasil.ok) toast.success(hasil.message ?? "Pengaturan disimpan");
    return hasil;
  }, {});

  return (
    <form action={action} className="grid gap-5">
      <fieldset className="grid gap-4">
        <legend className="mb-1 text-sm font-semibold">Kop rapor</legend>
        <Field label="Instansi induk" htmlFor="instansi_induk">
          <Input id="instansi_induk" name="instansi_induk" defaultValue={pengaturan.instansi_induk} required />
        </Field>
        <Field label="Nama madrasah" htmlFor="nama_madrasah">
          <Input id="nama_madrasah" name="nama_madrasah" defaultValue={pengaturan.nama_madrasah} required />
        </Field>
        <Field label="Alamat" htmlFor="alamat">
          <Input id="alamat" name="alamat" defaultValue={pengaturan.alamat} required />
        </Field>
        <Field label="Kecamatan, kabupaten, provinsi" htmlFor="wilayah">
          <Input id="wilayah" name="wilayah" defaultValue={pengaturan.wilayah} required />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-sm font-semibold">Tanda tangan</legend>
        <Field label="Kota" htmlFor="kota" hint="Dicetak sebelum tanggal rapor, mis. “Tasikmalaya, 20 Desember 2026”.">
          <Input id="kota" name="kota" defaultValue={pengaturan.kota} required />
        </Field>
        <Field label="Nama kepala madrasah (beserta gelar)" htmlFor="kepala_nama">
          <Input id="kepala_nama" name="kepala_nama" defaultValue={pengaturan.kepala_nama ?? ""} />
        </Field>
        <Field label="NIP kepala madrasah" htmlFor="kepala_nip">
          <Input id="kepala_nip" name="kepala_nip" defaultValue={pengaturan.kepala_nip ?? ""} inputMode="numeric" />
        </Field>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-1 text-sm font-semibold">Watermark rapor</legend>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={watermarkAktif}
            onCheckedChange={setWatermarkAktif}
            name="watermark_aktif"
            value="1"
          />
          Tampilkan watermark saat dicetak
        </label>
        <Field label="Teks watermark" htmlFor="watermark_teks">
          <Input id="watermark_teks" name="watermark_teks" defaultValue={pengaturan.watermark_teks} required />
        </Field>
      </fieldset>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Simpan pengaturan
        </Button>
      </div>
    </form>
  );
}
