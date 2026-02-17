"use client";

import { useRouter } from "next/navigation";
import {
  Settings,
  Users,
  Shield,
  Bell,
  Database,
  Palette,
  Globe,
  Lock,
  ChevronRight,
} from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function ConfiguracionPage() {
  const router = useRouter();

  const configSections = [
    {
      id: "usuarios",
      title: "Gestión de Usuarios",
      description: "Administra usuarios, roles y permisos del sistema",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      available: true,
      path: "/configuracion/usuarios",
    },
    {
      id: "roles",
      title: "Roles y Permisos",
      description: "Configure roles y asigne permisos específicos",
      icon: Shield,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      available: false,
      path: "/configuracion/roles",
    },
    {
      id: "notificaciones",
      title: "Notificaciones",
      description: "Configura alertas y notificaciones del sistema",
      icon: Bell,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      available: false,
      path: "/configuracion/notificaciones",
    },
    {
      id: "integraciones",
      title: "Integraciones",
      description: "Conecta con servicios externos y APIs",
      icon: Database,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      available: false,
      path: "/configuracion/integraciones",
    },
    {
      id: "apariencia",
      title: "Apariencia",
      description: "Personaliza el tema y la interfaz del sistema",
      icon: Palette,
      iconColor: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      available: false,
      path: "/configuracion/apariencia",
    },
    {
      id: "regional",
      title: "Configuración Regional",
      description: "Idioma, zona horaria y formato de fecha",
      icon: Globe,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
      available: false,
      path: "/configuracion/regional",
    },
    {
      id: "seguridad",
      title: "Seguridad",
      description: "Políticas de seguridad y autenticación",
      icon: Lock,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      available: false,
      path: "/configuracion/seguridad",
    },
    {
      id: "sistema",
      title: "Sistema",
      description: "Configuración avanzada del sistema",
      icon: Settings,
      iconColor: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      available: false,
      path: "/configuracion/sistema",
    },
  ];

  const handleNavigate = (section) => {
    if (section.available) {
      router.push(section.path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Breadcrumb
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Configuración", href: "/configuracion" },
            ]}
          />

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Configuración
                </h1>
                <p className="text-gray-600 mt-1">
                  Administra y personaliza tu sistema CRM
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => handleNavigate(section)}
                  disabled={!section.available}
                  className={`relative bg-white rounded-xl shadow-sm border ${
                    section.available
                      ? "hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  } transition-all duration-200 p-6 text-left group`}
                >
                  {!section.available && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Próximamente
                    </div>
                  )}

                  <div
                    className={`w-12 h-12 ${section.bgColor} ${section.borderColor} border rounded-lg flex items-center justify-center mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${section.iconColor}`} />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center justify-between">
                    {section.title}
                    {section.available && (
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    )}
                  </h3>

                  <p className="text-sm text-gray-600">{section.description}</p>
                </button>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Centro de Configuración
                </h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  Desde aquí puedes acceder a todas las configuraciones del
                  sistema. Las secciones marcadas como "Próximamente" estarán
                  disponibles en futuras actualizaciones. Actualmente puedes
                  gestionar usuarios y sus roles desde la sección de{" "}
                  <span className="font-semibold">Gestión de Usuarios</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
