"use client";

import { useActionState, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { ActionState } from "@/lib/action";
import { resetDataPeriode } from "./actions";

const FRASE = "reset nilai sekarang";

export function ResetPeriodeDialog({ daftarPeriode }: { daftarPeriode: { id: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2 /> Reset Data Periode
      </DialogTrigger>
      <DialogContent>
        {open ? <IsiDialog daftarPeriode={daftarPeriode} onDone={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function IsiDialog({ daftarPeriode, onDone }: { daftarPeriode: { id: string; label: string }[]; onDone: () => void }) {
  const [periodeId, setPeriodeId] = useState(daftarPeriode[0]?.id ?? "");
  const [konfirmasi, setKonfirmasi] = useState("");
  const cocok = konfirmasi.trim().toLowerCase() === FRASE;

  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await resetDataPeriode(periodeId, prev, formData);
    if (result.ok) {
      toast.success(result.message ?? "Data direset", { duration: 10000 });
      onDone();
    }
    return result;
  }, {});

  return (
    <form action={formAction} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Reset Data Periode</DialogTitle>
        <DialogDescription>Tindakan ini TIDAK BISA dibatalkan.</DialogDescription>
      </DialogHeader>

      <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        <AlertTriangle className="size-4 shrink-0" />
        <p>
          Semua <b>nilai indikator</b>, <b>rapor</b> (termasuk yang sudah <b>disetujui & terkunci/diterbitkan</b>),
          <b> kehadiran</b>, <b>proyek riset</b>, <b>hafalan tahfidz yang disetor pada periode ini</b>, dan{" "}
          <b>prestasi</b> pada periode yang dipilih akan DIHAPUS PERMANEN. Data siswa, program, dan indikator itu
          sendiri tidak terhapus.
        </p>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="periode_reset" className="text-sm font-medium">
          Periode yang akan direset
        </label>
        <NativeSelect id="periode_reset" value={periodeId} onChange={(e) => setPeriodeId(e.target.value)} className="w-full">
          {daftarPeriode.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="konfirmasi" className="text-sm font-medium">
          Ketik <span className="font-mono">{FRASE}</span> untuk konfirmasi
        </label>
        <Input
          id="konfirmasi"
          name="konfirmasi"
          value={konfirmasi}
          onChange={(e) => setKonfirmasi(e.target.value)}
          autoComplete="off"
          placeholder={FRASE}
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Batal</DialogClose>
        <Button type="submit" variant="destructive" disabled={!cocok || !periodeId || pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
          Reset sekarang
        </Button>
      </DialogFooter>
    </form>
  );
}
