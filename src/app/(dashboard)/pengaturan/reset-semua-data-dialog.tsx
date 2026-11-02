"use client";

import { useActionState, useState } from "react";
import { AlertOctagon, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action";
import { resetSemuaDataAction } from "./actions";

const FRASE = "hapus semua data siswa";

export function ResetSemuaDataDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <AlertOctagon /> Reset Semua Data Siswa
      </DialogTrigger>
      <DialogContent>
        {open ? <IsiDialog onDone={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function IsiDialog({ onDone }: { onDone: () => void }) {
  const [konfirmasi, setKonfirmasi] = useState("");
  const [resetIndikator, setResetIndikator] = useState(false);
  const cocok = konfirmasi.trim().toLowerCase() === FRASE;

  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await resetSemuaDataAction(resetIndikator, prev, formData);
    if (result.ok) {
      toast.success(result.message ?? "Semua data berhasil direset", { duration: 12000 });
      onDone();
    }
    return result;
  }, {});

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertOctagon className="size-5 shrink-0" />
          Reset Semua Data (Termasuk Data Siswa)
        </DialogTitle>
        <DialogDescription>
          Tindakan ini sangat berbahaya dan <b>TIDAK BISA dibatalkan</b>.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="size-4 shrink-0" />
          Perhatian Penting:
        </div>
        <p>
          Data yang akan <b>DIHAPUS PERMANEN</b>:
        </p>
        <ul className="ml-5 list-disc space-y-0.5 text-xs">
          <li>Seluruh data siswa (biodata, NIS, NISN)</li>
          <li>Seluruh kelas dan penempatan rombel siswa</li>
          <li>Seluruh kepesertaan & kelompok program unggulan</li>
          <li>Seluruh nilai indikator, rapor (termasuk draf/terkunci), dan capaian</li>
          <li>Seluruh catatan kehadiran, proyek riset, riwayat tahfidz, dan prestasi</li>
        </ul>
        <div className="mt-1 rounded border border-emerald-300 bg-emerald-50/80 p-2 text-xs font-medium text-emerald-900">
          ✓ <b>Aman:</b> Akun pengguna (login), data profil guru, pengaturan madrasah, dan master program <b>TIDAK</b> akan terhapus.
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border p-3 text-xs cursor-pointer hover:bg-muted/50">
        <input
          type="checkbox"
          checked={resetIndikator}
          onChange={(e) => setResetIndikator(e.target.checked)}
          className="mt-0.5 size-4 rounded border-gray-300 text-destructive focus:ring-destructive"
        />
        <div className="grid gap-0.5">
          <span className="font-semibold text-foreground">Sertakan reset indikator & template deskripsi</span>
          <span className="text-muted-foreground">
            Jika dicentang, seluruh indikator capaian dan template narasi rapor di semua program juga akan ikut dikosongkan.
          </span>
        </div>
      </label>

      <div className="grid gap-1.5">
        <label htmlFor="konfirmasi_semua" className="text-sm font-medium">
          Ketik persis <span className="font-mono text-destructive font-bold">{FRASE}</span> untuk konfirmasi
        </label>
        <Input
          id="konfirmasi_semua"
          name="konfirmasi"
          value={konfirmasi}
          onChange={(e) => setKonfirmasi(e.target.value)}
          autoComplete="off"
          placeholder={FRASE}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.error}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
        <Button type="submit" variant="destructive" disabled={!cocok || pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
          Hapus Semua Data Siswa Sekarang
        </Button>
      </DialogFooter>
    </form>
  );
}
