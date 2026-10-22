import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramByKode } from "@/lib/data/program";
import { bangunLegerWorkbook } from "@/lib/leger/bangun-leger";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await requireRole("admin", "koordinator");

  const url = new URL(request.url);
  const periodeId = url.searchParams.get("periode");
  const programKode = url.searchParams.get("program");

  if (!periodeId) return NextResponse.json({ error: "Parameter periode wajib diisi" }, { status: 400 });

  const daftarPeriode = await getPeriodeList();
  const periode = daftarPeriode.find((p) => p.id === periodeId);
  if (!periode) return NextResponse.json({ error: "Periode tidak ditemukan" }, { status: 404 });

  let programId: string | null = null;
  if (programKode && programKode !== "semua") {
    const program = await getProgramByKode(programKode);
    if (!program) return NextResponse.json({ error: "Program tidak ditemukan" }, { status: 404 });
    programId = program.id;
  }

  const workbook = await bangunLegerWorkbook(periodeId, programId);
  const buffer = await workbook.xlsx.writeBuffer();

  const supabase = await createClient();
  await supabase.from("audit_log").insert({
    siapa: user.id,
    tabel: "leger",
    aksi: "unduh_leger",
    data_baru: { periode_id: periodeId, program: programKode ?? "semua" },
  });

  const namaFile = `Leger_ProgramUnggulan_${labelPeriode(periode).replace(/[^a-zA-Z0-9]+/g, "_")}.xlsx`;
  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFile}"`,
    },
  });
}
