import { Upload } from "lucide-react";
import { Field, FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importNilaiExcel } from "./actions";

export function ImportNilaiDialog({ programId, periodeId }: { programId: string; periodeId: string }) {
  return (
    <FormDialog
      trigger={
        <Button variant="outline" size="sm">
          <Upload /> Import Excel
        </Button>
      }
      title="Import nilai dari Excel"
      description='Unggah file hasil "Unduh Excel" yang sudah diisi/dikoreksi. Sel yang dikosongkan tidak mengubah nilai yang sudah tersimpan.'
      submitLabel="Import"
      action={importNilaiExcel.bind(null, programId, periodeId)}
    >
      <Field label="File Excel (.xlsx)" htmlFor="file">
        <Input id="file" name="file" type="file" accept=".xlsx" required />
      </Field>
    </FormDialog>
  );
}
