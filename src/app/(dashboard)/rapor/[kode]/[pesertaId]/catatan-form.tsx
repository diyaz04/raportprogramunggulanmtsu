"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/action";
import { simpanCatatanFinal } from "../actions";

export function CatatanForm({
  pesertaProgramId,
  catatanFinal,
  catatanFinalTerjemahan,
  tampilkanTerjemahan,
}: {
  pesertaProgramId: string;
  catatanFinal: string | null;
  catatanFinalTerjemahan: string | null;
  tampilkanTerjemahan: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await simpanCatatanFinal(pesertaProgramId, prev, formData);
    if (result.ok) toast.success(result.message ?? "Catatan disimpan");
    return result;
  }, {});

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border p-4">
      <p className="text-sm font-medium">Catatan Guru Program</p>
      <Field label="Catatan" htmlFor="catatan_final" hint="Draf otomatis bisa diedit bebas di sini.">
        <Textarea id="catatan_final" name="catatan_final" rows={5} defaultValue={catatanFinal ?? ""} />
      </Field>
      {tampilkanTerjemahan ? (
        <Field label="Terjemahan Indonesia" htmlFor="catatan_final_terjemahan">
          <Textarea id="catatan_final_terjemahan" name="catatan_final_terjemahan" rows={4} defaultValue={catatanFinalTerjemahan ?? ""} />
        </Field>
      ) : null}
      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" size="sm" disabled={pending} className="w-fit">
        {pending ? <Loader2 className="animate-spin" /> : null} Simpan catatan
      </Button>
    </form>
  );
}
