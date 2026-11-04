export type Role = "admin" | "koordinator" | "guru" | "kepala";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin / Operator",
  koordinator: "Koordinator Program",
  guru: "Guru Program",
  kepala: "Kepala Madrasah",
};

export type DewanGuruCardData = {
  id: string;
  nama: string;
  nip: string | null;
  email: string | null;
  role: Role;
  roleLabel: string;
  foto_url: string | null;
  programs: { id: string; kode: string; nama: string }[];
};
