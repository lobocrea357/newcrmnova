"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LogOut, UserRound, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import NotificacionesCampana from "@/components/ui/NotificacionesCampana";
import BarraProgresoCompacta from "@/components/ranking/BarraProgresoCompacta";
import { pageTitle } from "@/lib/navigation";
import { avatarUrl, initials } from "@/lib/avatar";

/** Barra superior: título de la sección, notificaciones, progreso y cuenta. */
const Navbar = ({ onMenuClick }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const name = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const photo = avatarUrl(profile?.avatar_url);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => menuRef.current && !menuRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-papel/85 backdrop-blur border-b border-linea">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden -ml-1 p-2 rounded-md text-gray-600 hover:bg-gray-100"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>

        <p className="text-[15px] font-semibold text-tinta truncate flex-1 min-w-0">{pageTitle(pathname)}</p>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {user && (
            <div className="hidden md:block">
              <BarraProgresoCompacta userId={user.id} />
            </div>
          )}
          <NotificacionesCampana />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full sm:rounded-md p-0.5 sm:pr-2 hover:bg-gray-100"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              {photo ? (
                <img src={photo} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="h-8 w-8 rounded-full bg-nova-600 text-white grid place-items-center text-xs font-semibold">
                  {initials(name)}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 rounded-lg border border-linea bg-white shadow-lg py-1.5 z-40"
              >
                <div className="px-3.5 py-2.5 border-b border-linea">
                  <p className="text-sm font-medium text-tinta truncate">{name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/perfil"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserRound className="h-4 w-4 text-gray-500" /> Mi perfil
                </Link>
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
