"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Link as LinkIcon, Loader2, Trash2, User } from "lucide-react";
import { Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ROLE_LABEL, type Role } from "@/lib/auth-types";
import type { Profil } from "@/lib/data/master";
import { createClient } from "@/lib/supabase/client";
import { inisialNama } from "@/lib/utils";

const ROLES = Object.keys(ROLE_LABEL) as Role[];

/**
 * Kompres gambar di browser menggunakan Canvas agar ukurannya tidak melebihi batas request body (menghindari HTTP 413).
 * Foto beresolusi tinggi (5MB-15MB) akan otomatis diubah menjadi ~100-200 KB tanpa mengurangi kualitas tampilan.
 */
async function kompresGambar(file: File, maxDimensi = 1000, kualitas = 0.82): Promise<Blob> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimensi || height > maxDimensi) {
          if (width > height) {
            height = Math.round((height * maxDimensi) / width);
            width = maxDimensi;
          } else {
            width = Math.round((width * maxDimensi) / height);
            height = maxDimensi;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          kualitas,
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function GuruFields({ profil }: { profil?: Profil }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(profil?.foto_url ?? null);
  const [hapusFoto, setHapusFoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState(profil?.foto_url ?? "");
  const [mengunggah, setMengunggah] = useState(false);
  const [unggahSukses, setUnggahSukses] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tampilkan preview lokal instan
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setHapusFoto(false);
    setMengunggah(true);
    setUnggahSukses(false);

    try {
      // 1. Kompres gambar di browser (ukuran mengecil drastis dari multi-MB ke ~100-200 KB)
      const compressedBlob = await kompresGambar(file, 1000, 0.82);
      const compressedFile = new File([compressedBlob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });

      // 2. Upload langsung ke Supabase Storage (client-side) untuk menghindari payload besar ke server
      const supabase = createClient();
      const filename = `guru-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;

      // Coba upload ke bucket 'guru'
      let uploadRes = await supabase.storage.from("guru").upload(filename, compressedFile, {
        contentType: "image/jpeg",
        upsert: true,
      });

      // Fallback ke bucket 'pengaturan' jika bucket 'guru' belum ada
      if (uploadRes.error) {
        uploadRes = await supabase.storage.from("pengaturan").upload(`guru-${filename}`, compressedFile, {
          contentType: "image/jpeg",
          upsert: true,
        });
      }

      if (!uploadRes.error) {
        const bucketDipakai = uploadRes.data?.fullPath?.split("/")[0] || "guru";
        const pathFile = bucketDipakai === "pengaturan" ? `guru-${filename}` : filename;
        const { data } = supabase.storage.from(bucketDipakai).getPublicUrl(pathFile);
        setUrlValue(data.publicUrl);
        setPreview(data.publicUrl);
        setUnggahSukses(true);
        // Kosongkan file input agar form submit hanya mengirim URL (tidak mengirim file binary besar)
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        // Jika client-side upload gagal (misal RLS belum dikonfigurasi), simpan file kecil terkompresi di input
        if (typeof DataTransfer !== "undefined" && fileInputRef.current) {
          const dt = new DataTransfer();
          dt.items.add(compressedFile);
          fileInputRef.current.files = dt.files;
        }
      }
    } catch (err) {
      console.warn("Upload klien foto guru gagal, menggunakan fallback form action:", err);
    } finally {
      setMengunggah(false);
    }
  }

  function onHapus() {
    setPreview(null);
    setHapusFoto(true);
    setUrlValue("");
    setUnggahSukses(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.trim();
    setUrlValue(val);
    if (val) {
      setPreview(val);
      setHapusFoto(false);
    } else {
      setPreview(profil?.foto_url ?? null);
    }
  }

  return (
    <>
      {/* Upload Foto Guru */}
      <Field label="Foto Profil Guru" htmlFor="foto_file" hint="Format JPG, PNG, atau WebP. Otomatis dikompres & dioptimasi.">
        <div className="flex flex-col gap-3 rounded-2xl border p-4 bg-muted/20">
          <div className="flex items-center gap-4">
            {/* Pratinjau Foto */}
            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-muted shadow-sm">
              {preview && !hapusFoto ? (
                // eslint-disable-next-line @next/next/no-img-element -- pratinjau foto lokal / URL
                <img src={preview} alt="Pratinjau Foto" className="size-full object-cover object-top" />
              ) : (
                <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold text-lg select-none">
                  {profil?.nama ? inisialNama(profil.nama) : <User className="size-6 text-white/80" />}
                </div>
              )}

              {/* Status Loading saat Upload */}
              {mengunggah && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                  <Loader2 className="size-5 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Tombol Aksi Foto */}
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                id="foto_file"
                name="foto_file"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onFileChange}
                disabled={mengunggah}
                className="hidden"
              />
              <input type="hidden" name="hapus_foto" value={hapusFoto ? "1" : "0"} />
              <input type="hidden" name="foto_url" value={urlValue} />

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={mengunggah}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-dashed"
              >
                {mengunggah ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-emerald-600" />
                    Mengoptimasi...
                  </>
                ) : (
                  <>
                    <ImagePlus className="size-4" />
                    {preview && !hapusFoto ? "Ganti Foto" : "Unggah Foto"}
                  </>
                )}
              </Button>

              {unggahSukses && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <Check className="size-3.5" /> Siap disimpan
                </span>
              )}

              {preview && !hapusFoto ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={mengunggah}
                  onClick={onHapus}
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Hapus
                </Button>
              ) : null}

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 underline underline-offset-4 ml-auto"
              >
                <LinkIcon className="size-3" />
                {showUrlInput ? "Tutup input URL" : "Pakai link URL"}
              </button>
            </div>
          </div>

          {/* Opsi alternatif: Input URL langsung */}
          {showUrlInput ? (
            <div className="pt-2 border-t">
              <label htmlFor="foto_url_manual" className="block text-xs font-medium text-muted-foreground mb-1">
                Link URL Gambar (Alternatif)
              </label>
              <Input
                id="foto_url_manual"
                type="url"
                placeholder="https://contoh.com/foto-guru.jpg"
                value={urlValue}
                onChange={onUrlChange}
                className="h-8 text-xs rounded-lg"
              />
            </div>
          ) : null}
        </div>
      </Field>

      <Field label="Nama lengkap (beserta gelar)" htmlFor="nama">
        <Input id="nama" name="nama" defaultValue={profil?.nama} required />
      </Field>
      <Field label="NIP" htmlFor="nip" hint="Dicetak di blok tanda tangan rapor. Boleh dikosongkan.">
        <Input id="nip" name="nip" defaultValue={profil?.nip ?? ""} inputMode="numeric" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role" htmlFor="role">
          <NativeSelect id="role" name="role" defaultValue={profil?.role ?? "guru"} className="w-full">
            {ROLES.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {ROLE_LABEL[r]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {profil ? (
          <Field label="Status" htmlFor="aktif" hint="Akun nonaktif tidak bisa masuk.">
            <NativeSelect id="aktif" name="aktif" defaultValue={profil.aktif ? "1" : "0"} className="w-full">
              <NativeSelectOption value="1">Aktif</NativeSelectOption>
              <NativeSelectOption value="0">Nonaktif</NativeSelectOption>
            </NativeSelect>
          </Field>
        ) : null}
      </div>
    </>
  );
}
