import { redirect } from "next/navigation";

// Proxy mengarahkan yang belum login ke /login; yang sudah login langsung ke dashboard.
export default function Home() {
  redirect("/dashboard");
}
