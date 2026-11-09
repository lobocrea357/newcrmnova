"use client";

import Link from "next/link";
import { ChevronRight, Users, UserPlus } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Page, PageHeader, Panel, Skeleton } from "@/components/ui/kit";

export default function ConfiguracionPage() {
  const { loading, isSuperAdmin, isAdmin, isManager } = useUserProfile();
  const admin = isSuperAdmin || isAdmin;

  const sections = [
    {
      href: "/configuracion/mi-equipo",
      title: "Mi equipo",
      description: "Asesores asignados a tu equipo y cuáles quedan libres para sumar.",
      icon: UserPlus,
      show: admin || isManager,
    },
    {
      href: "/configuracion/usuarios",
      title: "Usuarios y permisos",
      description: "Altas y bajas, roles, permisos individuales, sedes y equipos.",
      icon: Users,
      show: admin,
    },
  ].filter((s) => s.show);

  return (
    <Page>
      <PageHeader title="Configuración" description="Ajustes del equipo y de acceso al CRM." />
      <Panel padded={false}>
        {loading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <ul className="divide-y divide-linea">
            {sections.map(({ href, title, description, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-nova-50 text-nova-600">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-tinta">{title}</span>
                    <span className="block text-sm text-gray-500">{description}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Page>
  );
}
