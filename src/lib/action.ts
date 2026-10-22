// Bentuk hasil standar semua Server Action yang dipakai form dialog.
export type ActionState = {
  ok?: boolean;
  error?: string;
  /** Pesan sukses khusus (menggantikan pesan bawaan dialog). */
  message?: string;
  /** Rincian tambahan, mis. daftar baris Excel yang bermasalah. */
  detail?: string[];
};

export const gagal = (error: string, detail?: string[]): ActionState => ({ error, detail });
export const sukses = (message?: string, detail?: string[]): ActionState => ({ ok: true, message, detail });

type PgLikeError = { code?: string; message: string };

/** Menerjemahkan error Postgres/Supabase yang umum menjadi pesan yang ramah. */
export function pesanError(error: PgLikeError, konteks?: { duplikat?: string }): string {
  switch (error.code) {
    case "23505":
      return konteks?.duplikat ?? "Data dengan nilai yang sama sudah ada.";
    case "23503":
      return "Data masih dipakai oleh data lain sehingga tidak bisa diubah/dihapus.";
    case "42501":
      return "Anda tidak memiliki izin untuk tindakan ini.";
    default:
      return `Terjadi kesalahan: ${error.message}`;
  }
}
