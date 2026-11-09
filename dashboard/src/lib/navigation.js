/**
 * Navegación del CRM — fuente única para el menú lateral y los títulos de página.
 *
 * Cada ítem declara quién lo ve con `roles` (nombres de rol) y/o `permissions`
 * (basta con uno). Sin ninguno de los dos = visible para cualquier rol con acceso
 * general (no supervisor ni líder, que tienen un menú acotado).
 *
 * Reglas heredadas del menú anterior (ROUTES_BY_ROLE):
 *  - supervisor: solo bots _other (conversaciones + inteligencia de esos bots)
 *  - lider: solo conversaciones (de sus bots por sufijo)
 *  - asesor / emisor / administracion: inicio + su área de vuelos según permisos
 */
import {
  Home,
  MessagesSquare,
  Radio,
  Sparkles,
  CreditCard,
  Ticket,
  PlaneTakeoff,
  Wallet,
  Users,
  UsersRound,
  ShieldCheck,
  Settings,
} from 'lucide-react';

const ADMINS = ['super_admin', 'admin'];

export const NAV_GROUPS = [
  {
    id: 'inicio',
    label: null,
    items: [
      { href: '/', label: 'Inicio', icon: Home, exact: true, hideFor: ['supervisor', 'lider'] },
    ],
  },
  {
    id: 'atencion',
    label: 'Atención',
    items: [
      { href: '/conversaciones', label: 'Conversaciones', icon: MessagesSquare, roles: [...ADMINS, 'gerente', 'lider'] },
      { href: '/other/conversaciones', label: 'Bots externos', icon: Radio, roles: ['super_admin', 'supervisor'] },
    ],
  },
  {
    id: 'inteligencia',
    label: 'Inteligencia',
    items: [
      { href: '/inteligencia', label: 'Centro IA', icon: Sparkles, roles: [...ADMINS, 'gerente', 'supervisor'] },
    ],
  },
  {
    id: 'vuelos',
    label: 'Vuelos y pagos',
    items: [
      { href: '/admin/confirmar-pagos', label: 'Confirmar pagos', icon: CreditCard, roles: ADMINS, permissions: ['vuelos.confirm_payment'] },
      { href: '/admin/control-emisiones', label: 'Control de emisiones', icon: Ticket, roles: ADMINS, permissions: ['vuelos.emit', 'vuelos.mark_issued'] },
      { href: '/admin/dashboard-emisiones', label: 'Resumen de emisiones', icon: PlaneTakeoff, roles: ADMINS, permissions: ['vuelos.emit', 'vuelos.mark_issued'] },
      { href: '/admin/deudas', label: 'Deudas', icon: Wallet, roles: ADMINS },
    ],
  },
  {
    id: 'equipo',
    label: 'Equipo',
    items: [
      { href: '/configuracion/mi-equipo', label: 'Mi equipo', icon: UsersRound, roles: ['gerente'] },
      { href: '/admin/team-members', label: 'Números del equipo', icon: Users, roles: [...ADMINS, 'gerente'] },
      { href: '/configuracion/usuarios', label: 'Usuarios y permisos', icon: ShieldCheck, roles: ADMINS, permissions: ['users.view', 'usuarios.view'] },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      { href: '/configuracion', label: 'Configuración', icon: Settings, exact: true, roles: [...ADMINS, 'gerente'] },
    ],
  },
];

/** Títulos de páginas que no están en el menú. */
const EXTRA_TITLES = [
  { href: '/perfil', label: 'Mi perfil' },
  { href: '/conversaciones/chat', label: 'Conversación' },
  { href: '/other/conversaciones/chat', label: 'Conversación' },
  { href: '/no-autorizado', label: 'Sin acceso' },
];

/** ¿Puede el usuario ver este ítem? */
export function canSeeItem(item, { role, hasPermission }) {
  if (!role) return false;
  if (role === 'super_admin') return !item.hideFor?.includes(role);
  if (item.hideFor?.includes(role)) return false;
  const byRole = item.roles?.includes(role);
  const byPerm = item.permissions?.some((p) => hasPermission?.(p));
  if (!item.roles && !item.permissions) return true;
  return !!(byRole || byPerm);
}

/** Grupos visibles para el usuario (sin grupos vacíos). */
export function visibleGroups(ctx) {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => canSeeItem(i, ctx)) })).filter((g) => g.items.length);
}

export function isActivePath(pathname, item) {
  if (!pathname) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

/** Título de la página actual (el ítem más específico que coincida). */
export function pageTitle(pathname) {
  const all = [...NAV_GROUPS.flatMap((g) => g.items), ...EXTRA_TITLES];
  const match = all
    .filter((i) => pathname === i.href || (i.href !== '/' && pathname?.startsWith(i.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.label || (pathname === '/' ? 'Inicio' : 'CRM Viajes Nova');
}

/** Primera ruta a la que tiene acceso el usuario (para redirecciones). */
export function homeFor(ctx) {
  const first = visibleGroups(ctx)[0]?.items[0];
  return first?.href || '/no-autorizado';
}
