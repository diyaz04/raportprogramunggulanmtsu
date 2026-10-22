"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, ChevronsUpDown, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { navForRole } from "@/lib/nav";
import type { Role } from "@/lib/auth";

export type SidebarUser = {
  nama: string;
  email: string;
  role: Role;
  roleLabel: string;
  /** Guru ditugaskan ke program Tahfidz pada periode aktif? Menentukan apakah menu "Hafalan Tahfidz" tampil. */
  bisaTahfidz: boolean;
};

function initials(nama: string) {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function LogoBulat({ src, className = "" }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL publik Supabase Storage
    <img src={src} alt="Logo" className={`size-9 shrink-0 rounded-full bg-white/90 object-contain p-1 drop-shadow ${className}`} />
  );
}

export function AppSidebar({
  user,
  logoKiriUrl,
  logoKananUrl,
  namaMadrasah,
}: {
  user: SidebarUser;
  logoKiriUrl?: string | null;
  logoKananUrl?: string | null;
  namaMadrasah?: string;
}) {
  const pathname = usePathname();
  const groups = navForRole(user.role, { bisaTahfidz: user.bisaTahfidz });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex flex-col gap-2 rounded-lg p-2 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:items-center"
        >
          <div className="flex items-center gap-2">
            {logoKiriUrl ? (
              <LogoBulat src={logoKiriUrl} />
            ) : (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BookOpenCheck className="size-4" />
              </div>
            )}
            {logoKananUrl ? <LogoBulat src={logoKananUrl} className="group-data-[collapsible=icon]:hidden" /> : null}
          </div>
          <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">Rapor Unggulan</span>
            <span className="truncate text-xs text-sidebar-foreground/70">{namaMadrasah ?? "MTs KH. A. Wahab Muhsin"}</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group, i) => (
          <SidebarGroup key={group.label ?? i}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarMenu>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    {item.ready ? (
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        render={<Link href={item.href} />}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    ) : (
                      <>
                        <SidebarMenuButton
                          tooltip={`${item.title} (segera)`}
                          disabled
                          className="opacity-50"
                        >
                          <Icon />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                        <SidebarMenuBadge className="text-[10px] font-medium text-sidebar-foreground/70">
                          Segera
                        </SidebarMenuBadge>
                      </>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                    {initials(user.nama)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">{user.nama}</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">{user.roleLabel}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="min-w-56">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">{user.nama}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <form action={signOut}>
                  <DropdownMenuItem nativeButton render={<button type="submit" className="w-full" />}>
                    <LogOut />
                    Keluar
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
