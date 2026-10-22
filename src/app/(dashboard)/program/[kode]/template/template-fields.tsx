import { Field } from "@/components/form-dialog";
import { Textarea } from "@/components/ui/textarea";
import type { BahasaProgram } from "@/lib/data/program";
import { PREDIKAT_KODE, type IndikatorDenganTemplate, type SkalaPredikat } from "@/lib/data/indikator";

const LABEL_PREDIKAT: Record<string, string> = { SARAN: "Saran tindak lanjut (opsional, biasanya untuk predikat C/D)" };

export function TemplateFields({
  indikator,
  bahasaUtama,
  tampilkanTerjemahan,
  skala,
}: {
  indikator: IndikatorDenganTemplate;
  bahasaUtama: BahasaProgram;
  tampilkanTerjemahan: boolean;
  skala: SkalaPredikat[];
}) {
  const rtl = bahasaUtama === "ar";
  const skalaPerKode = new Map(skala.map((s) => [s.kode, s]));

  return (
    <div className="grid gap-4">
      {PREDIKAT_KODE.map((kode) => {
        const s = kode !== "SARAN" ? skalaPerKode.get(kode) : undefined;
        const label = s ? `Predikat ${s.kode} — ${s.label} (${s.min}–${s.max})` : LABEL_PREDIKAT[kode];
        const existing = indikator.template[kode];

        return (
          <div key={kode} className="grid gap-2 rounded-lg border p-3">
            <p className="text-sm font-medium">{label}</p>
            <Field label={bahasaUtama === "id" ? "Kalimat" : "Kalimat (utama)"} htmlFor={`teks_${kode}`}>
              <Textarea
                id={`teks_${kode}`}
                name={`teks_${kode}`}
                rows={2}
                dir={rtl ? "rtl" : undefined}
                className={rtl ? "font-arabic" : undefined}
                defaultValue={existing?.teks ?? ""}
              />
            </Field>
            {tampilkanTerjemahan ? (
              <Field label="Terjemahan Indonesia" htmlFor={`terjemahan_${kode}`}>
                <Textarea
                  id={`terjemahan_${kode}`}
                  name={`terjemahan_${kode}`}
                  rows={2}
                  className="italic"
                  defaultValue={existing?.teks_terjemahan ?? ""}
                />
              </Field>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
