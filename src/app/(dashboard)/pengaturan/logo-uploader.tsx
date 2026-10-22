"use client";

import { useRef, useState, useTransition } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { simpanLogo } from "./actions";

const MAKS_BYTE = 2 * 1024 * 1024;
const TIPE_OK = ["image/png", "image/jpeg", "image/webp"];

export function LogoUploader({
  slot,
  label,
  currentUrl,
}: {
  slot: "kiri" | "kanan";
  label: string;
  currentUrl: string | null;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [mengunggah, setMengunggah] = useState(false);
  const [, startTransition] = useTransition();

  async function onPilih(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // izinkan memilih file yang sama lagi
    if (!file) return;

    if (!TIPE_OK.includes(file.type)) return void toast.error("Format harus PNG, JPG, atau WebP");
    if (file.size > MAKS_BYTE) return void toast.error("Ukuran logo maksimal 2 MB");

    setMengunggah(true);
    try {
      const supabase = createClient();
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `logo-${slot}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from("pengaturan").upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from("pengaturan").getPublicUrl(path);

      startTransition(async () => {
        const hasil = await simpanLogo(slot, data.publicUrl);
        if (hasil.ok) toast.success(`${label} diperbarui`);
        else toast.error(hasil.error ?? "Gagal menyimpan logo");
      });
    } catch (err) {
      toast.error(`Gagal mengunggah: ${err instanceof Error ? err.message : "tidak diketahui"}`);
    } finally {
      setMengunggah(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau URL publik Supabase Storage
          <img src={currentUrl} alt={label} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs text-muted-foreground">Kosong</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">PNG transparan disarankan. Maks. 2 MB.</p>
      </div>
      <input ref={input} type="file" accept={TIPE_OK.join(",")} className="hidden" onChange={onPilih} />
      <Button type="button" variant="outline" size="sm" disabled={mengunggah} onClick={() => input.current?.click()}>
        {mengunggah ? <Loader2 className="animate-spin" /> : <ImageUp />}
        {currentUrl ? "Ganti" : "Unggah"}
      </Button>
    </div>
  );
}
