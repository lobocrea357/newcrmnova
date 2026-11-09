"use client";

import { ShieldAlert } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { homeFor } from "@/lib/navigation";
import { Page, Panel, EmptyState, Button } from "@/components/ui/kit";

export default function NoAutorizadoPage() {
  const { role, loading, hasPermission } = useUserProfile();
  const home = loading ? "/" : homeFor({ role: role?.toLowerCase(), hasPermission });

  return (
    <Page>
      <Panel className="mx-auto mt-10 max-w-lg">
        <EmptyState
          icon={ShieldAlert}
          title="No tienes acceso a esta sección"
          description={
            loading
              ? "Comprobando tus permisos…"
              : `Tu rol (${role || "sin rol"}) no incluye esta pantalla. Si la necesitas, pide el permiso a un administrador.`
          }
          action={
            home !== "/no-autorizado" && (
              <Button variant="primary" href={home}>
                Ir a mi inicio
              </Button>
            )
          }
        />
      </Panel>
    </Page>
  );
}
