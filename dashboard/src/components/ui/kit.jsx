'use client';

/**
 * Kit de interfaz del CRM. Piezas pequeñas y sin estado para que todas las
 * pantallas compartan estructura: cabecera de página, paneles, métricas,
 * etiquetas de estado, pestañas, estados vacíos y medidor de puntaje.
 */
import Link from 'next/link';

export function cx(...c) {
  return c.filter(Boolean).join(' ');
}

/** Contenedor de página con ancho y márgenes comunes. */
export function Page({ children, wide = false, className }) {
  return (
    <div className={cx('mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8', wide ? 'max-w-[1600px]' : 'max-w-7xl', className)}>
      {children}
    </div>
  );
}

/** Título de la pantalla, descripción breve y acciones a la derecha. */
export function PageHeader({ title, description, actions, children }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-tinta">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Bloque con borde. `title` opcional con acciones a la derecha. */
export function Panel({ title, description, actions, children, className, bodyClassName, padded = true }) {
  return (
    <section className={cx('rounded-xl border border-linea bg-white', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-linea px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-tinta">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cx(padded && 'p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

const TONES = {
  neutral: 'bg-gray-100 text-gray-700',
  nova: 'bg-nova-50 text-nova-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-teal-50 text-teal-700',
};

export function Badge({ tone = 'neutral', children, className, dot = false }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap', TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Métrica: valor grande, etiqueta y una línea de contexto. */
export function Stat({ label, value, hint, tone, icon: Icon }) {
  const valueTone = { success: 'text-green-700', danger: 'text-red-700', warning: 'text-amber-700', nova: 'text-nova-700' }[tone] || 'text-tinta';
  return (
    <div className="rounded-xl border border-linea bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-gray-400" strokeWidth={1.8} />}
      </div>
      <p className={cx('mt-1.5 text-[28px] font-semibold leading-none tabular', valueTone)}>{value}</p>
      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

const BTN = {
  primary: 'bg-nova-600 text-white hover:bg-nova-700 shadow-xs',
  secondary: 'bg-white text-gray-800 border border-linea hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

/** Botón o enlace con el mismo aspecto. */
export function Button({ variant = 'secondary', size = 'md', href, className, children, ...props }) {
  const cls = cx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
    size === 'sm' ? 'h-8 px-3 text-sm' : 'h-9 px-4 text-sm',
    BTN[variant],
    className
  );
  if (href) return <Link href={href} className={cls} {...props}>{children}</Link>;
  return <button className={cls} {...props}>{children}</button>;
}

/** Pestañas como enlaces (cada una con su URL). */
export function Tabs({ tabs, active, className }) {
  return (
    <nav className={cx('flex gap-1 overflow-x-auto border-b border-linea', className)} aria-label="Secciones">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={on ? 'page' : undefined}
            className={cx(
              '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors',
              on ? 'border-nova-600 font-medium text-tinta' : 'border-transparent text-gray-500 hover:text-tinta'
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cx('rounded px-1.5 text-xs tabular', on ? 'bg-nova-50 text-nova-700' : 'bg-gray-100 text-gray-600')}>{t.count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Pantalla o bloque vacío: qué pasa y qué hacer. */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {Icon && (
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-nova-50 text-nova-600">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
      )}
      <p className="text-[15px] font-medium text-tinta">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-md bg-gray-100', className)} />;
}

/** Color del puntaje de calidad (0-100). */
export function scoreTone(p) {
  if (p == null) return 'neutral';
  if (p >= 70) return 'success';
  if (p >= 45) return 'warning';
  return 'danger';
}

/** Barra de puntaje 0-100 con el número al lado. */
export function ScoreBar({ value, className }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const bar = { success: 'bg-green-600', warning: 'bg-amber-500', danger: 'bg-red-600', neutral: 'bg-gray-300' }[scoreTone(value)];
  return (
    <div className={cx('flex items-center gap-2.5', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100" role="meter" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={cx('h-full rounded-full', bar)} style={{ width: `${v}%` }} />
      </div>
      <span className="w-9 text-right text-sm font-medium tabular text-tinta">{v}</span>
    </div>
  );
}
