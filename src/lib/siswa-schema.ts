import { z } from "zod";

const spasi = (s: string) => s.replace(/\s+/g, " ").trim();

export const siswaSchema = z.object({
  nis: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(1, "NIS wajib diisi").max(30, "NIS terlalu panjang")),
  nisn: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.union([z.literal(""), z.string().regex(/^\d{10}$/, "NISN harus 10 digit angka")]))
    .transform((s) => (s === "" ? null : s)),
  nama: z
    .string()
    .transform(spasi)
    .pipe(z.string().min(1, "Nama wajib diisi").max(100, "Nama terlalu panjang")),
  jk: z.enum(["L", "P"], { error: "Jenis kelamin harus L atau P" }),
  nama_arab: z
    .string()
    .transform(spasi)
    .transform((s) => (s === "" ? null : s)),
});

export type SiswaInput = z.infer<typeof siswaSchema>;

/** Menerima "L", "P", "Laki-laki", "Perempuan", dst. */
export function normalisasiJk(nilai: string): "L" | "P" | null {
  const v = nilai.trim().toLowerCase();
  if (["l", "lk", "laki-laki", "laki laki", "pria", "male", "m"].includes(v)) return "L";
  if (["p", "pr", "perempuan", "wanita", "female", "f"].includes(v)) return "P";
  return null;
}
