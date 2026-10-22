"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { StatusRapor } from "@/lib/data/rapor";
import { ajukanReview, bukaKembaliRapor, buatUlangDraf, kunciRapor, setujuiRapor } from "../actions";

export function AksiRapor({ pesertaProgramId, status }: { pesertaProgramId: string; status: StatusRapor }) {
  const [pending, startTransition] = useTransition();

  function jalankan(aksi: (id: string, prev: object) => Promise<{ error?: string; message?: string }>, pesanSukses: string) {
    startTransition(async () => {
      const result = await aksi(pesertaProgramId, {});
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? pesanSukses);
    });
  }

  return (
    <div className="grid gap-2 rounded-xl border p-4">
      <p className="text-sm font-medium">Aksi</p>

      {status === "draft" || status === "review" ? (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => jalankan(buatUlangDraf, "Dihitung ulang")}>
          {pending ? <Loader2 className="animate-spin" /> : null} Hitung ulang nilai & draf
        </Button>
      ) : null}

      {status === "draft" ? (
        <Button size="sm" disabled={pending} onClick={() => jalankan(ajukanReview, "Diajukan")}>
          Ajukan untuk ditinjau
        </Button>
      ) : null}

      {status === "review" ? (
        <Button size="sm" disabled={pending} onClick={() => jalankan(setujuiRapor, "Disetujui")}>
          Setujui
        </Button>
      ) : null}

      {status === "disetujui" ? (
        <Button size="sm" disabled={pending} onClick={() => jalankan(kunciRapor, "Dikunci")}>
          Kunci &amp; terbitkan
        </Button>
      ) : null}

      {status === "disetujui" || status === "terkunci" ? (
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => jalankan(bukaKembaliRapor, "Dibuka kembali")}>
          Buka kembali ke draf (admin)
        </Button>
      ) : null}
    </div>
  );
}
