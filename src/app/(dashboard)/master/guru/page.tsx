import { Suspense } from "react";
import type { Metadata } from "next";
import { KeyRound, Pencil, Plus } from "lucide-react";
import { Field, FormDialog } from "@/components/form-dialog";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABEL, requireRole } from "@/lib/auth";
import { getProfilList, type Profil } from "@/lib/data/master";
import { adaSecretKey } from "@/lib/supabase/admin";
import { buatAkun, resetSandi, simpanProfil } from "./actions";
import { GuruFields } from "./guru-fields";

export const metadata: Metadata = { title: "Guru & Akun" };

export default function GuruPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi />
      </Suspense>
    </div>
  );
}

async function Isi() {
  const me = await requireRole("admin");
  const profil = await getProfilList();
  const bisaBuatAkun = adaSecretKey;
  return (
    <>
      <PageHeader
        title="Guru & Akun"
        description="Akun pengguna aplikasi beserta role-nya. Akun baru dari Supabase masuk sebagai Nonaktif sampai Anda mengaktifkannya di sini."
        actions={
          bisaBuatAkun ? (
            <FormDialog
              trigger={
                <Button size="sm">
                  <Plus /> Buat akun
                </Button>
              }
              title="Buat akun baru"
              description="Akun langsung aktif. Berikan email dan kata sandi ini kepada yang bersangkutan."
              submitLabel="Buat akun"
              action={buatAkun}
            >
              <Field label="Email" htmlFor="email">
                <Input id="email" name="email" type="email" autoComplete="off" required />
              </Field>
              <Field label="Kata sandi awal" htmlFor="password" hint="Minimal 8 karakter.">
                <Input id="password" name="password" type="text" autoComplete="off" minLength={8} required />
              </Field>
              <GuruFields />
            </FormDialog>
          ) : null
        }
      />

      {!bisaBuatAkun ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Pembuatan akun dari aplikasi belum aktif.</p>
          <p className="mt-1">
            Buat akun lewat <b>Supabase → Authentication → Users → Add user</b> (centang Auto Confirm), lalu aktifkan
            dan atur role-nya di daftar ini. Atau isi <code>SUPABASE_SECRET_KEY</code> di <code>.env.local</code>{" "}
            (kunci <i>secret</i> dari Project Settings → API Keys) agar tombol Buat akun muncul. Kunci itu rahasia dan
            hanya dipakai di server.
          </p>
        </div>
      ) : null}

      <Daftar me={me.id} profil={profil} bisaBuatAkun={bisaBuatAkun} />
    </>
  );
}

function Daftar({ me, profil, bisaBuatAkun }: { me: string; profil: Profil[]; bisaBuatAkun: boolean }) {

  if (profil.length === 0) return <EmptyState title="Belum ada akun" />;

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>NIP</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profil.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">
                {p.nama}
                {p.id === me ? <span className="ml-2 text-xs text-muted-foreground">(Anda)</span> : null}
              </TableCell>
              <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
              <TableCell>{p.nip ?? "—"}</TableCell>
              <TableCell>{ROLE_LABEL[p.role]}</TableCell>
              <TableCell>
                {p.aktif ? <Badge>Aktif</Badge> : <Badge variant="outline">Nonaktif</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <FormDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${p.nama}`}>
                        <Pencil />
                      </Button>
                    }
                    title="Ubah akun"
                    description={p.email ?? undefined}
                    action={simpanProfil.bind(null, p.id)}
                  >
                    <GuruFields profil={p} />
                  </FormDialog>
                  {bisaBuatAkun ? (
                    <FormDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Reset kata sandi ${p.nama}`}>
                          <KeyRound />
                        </Button>
                      }
                      title="Reset kata sandi"
                      description={`Atur kata sandi baru untuk ${p.nama}.`}
                      submitLabel="Ubah kata sandi"
                      action={resetSandi.bind(null, p.id)}
                    >
                      <Field label="Kata sandi baru" htmlFor="password" hint="Minimal 8 karakter.">
                        <Input id="password" name="password" type="text" autoComplete="off" minLength={8} required />
                      </Field>
                    </FormDialog>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
