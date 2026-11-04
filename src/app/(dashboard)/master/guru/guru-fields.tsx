"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link as LinkIcon, Trash2, User } from "lucide-react";
import { Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ROLE_LABEL, type Role } from "@/lib/auth-types";
import type { Profil } from "@/lib/data/master";
import { inisialNama } from "@/lib/utils";

const ROLES = Object.keys(ROLE_LABEL) as Role[];

export function GuruFields({ profil }: { profil?: Profil }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(profil?.foto_url ?? null);
  const [hapusFoto, setHapusFoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setHapusFoto(false);
    }
  }

  function onHapus() {
    setPreview(null);
    setHapusFoto(true);
    setUrlValue("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.trim();
    setUrlValue(val);
    if (val) {
      setPreview(val);
      setHapusFoto(false);
    } else if (fileInputRef.current?.files?.[0]) {
      setPreview(URL.createObjectURL(fileInputRef.current.files[0]));
    } else {
      setPreview(profil?.foto_url ?? null);
    }
  }

  return (
    <>
      {/* Upload Foto Guru */}
      <Field label="Foto Profil Guru" htmlFor="foto_file" hint="Format JPG, PNG, atau WebP. Maks. 3 MB.">
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
                className="hidden"
              />
              <input type="hidden" name="hapus_foto" value={hapusFoto ? "1" : "0"} />
              <input type="hidden" name="foto_url" value={urlValue} />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-dashed"
              >
                <ImagePlus className="size-4" />
                {preview && !hapusFoto ? "Ganti Foto" : "Unggah Foto"}
              </Button>

              {preview && !hapusFoto ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
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
