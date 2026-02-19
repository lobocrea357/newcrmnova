import { z } from 'zod';

export const tipoVueloEnum = z.enum(['MIGRACION', 'TURISMO', 'NEGOCIOS', 'OTRO']);
export const tipoAdjuntoEnum = z.enum(['COMPROBANTE_PAGO', 'PASAPORTE']);
export const estadoAnulacionEnum = z.enum(['PENDIENTE', 'ANULADO', 'NO_ANULADO']);

export const createVueloSchema = z.object({
  pax_nombre: z.string().min(1, 'Nombre del PAX es requerido').max(255),
  num_adultos: z.number().int().min(0, 'Número de adultos debe ser 0 o mayor').default(0),
  num_ninos: z.number().int().min(0, 'Número de niños debe ser 0 o mayor').default(0),
  num_infantes: z.number().int().min(0, 'Número de infantes debe ser 0 o mayor').default(0),
  contacto_nombre: z.string().min(1, 'Nombre de contacto es requerido').max(255),
  contacto_telefono: z.string().min(1, 'Teléfono de contacto es requerido').max(50),
  
  fecha_vuelo: z.string().min(1, 'Fecha del vuelo es requerida'),
  ruta: z.string().min(1, 'Ruta es requerida').max(100),
  horario: z.string().optional(),
  aerolinea_codigo: z.string().max(10).optional(),
  aerolinea_nombre: z.string().max(255).optional(),
  localizador: z.string().min(1, 'Localizador es requerido').max(50),
  proveedor: z.string().min(1, 'Proveedor es requerido').max(255),
  
  monto_venta: z.number().positive('Monto de venta debe ser mayor a 0'),
  monto_sabre: z.number().nonnegative('Monto Sabre debe ser 0 o mayor').optional(),
  monto_expedia: z.number().nonnegative('Monto Expedia debe ser 0 o mayor').optional(),
  monto_emision: z.number().nonnegative('Monto emisión debe ser 0 o mayor').optional(),
  metodo_pago: z.string().max(100).optional(),
  
  tipo_vuelo: tipoVueloEnum,
  requiere_anulable: z.boolean().default(false),
  observaciones: z.string().optional(),
}).refine((data) => {
  const totalPax = data.num_adultos + data.num_ninos + data.num_infantes;
  return totalPax > 0;
}, {
  message: 'Debe haber al menos un pasajero (adulto, niño o infante)',
  path: ['num_adultos'],
});

export const updateVueloSchema = createVueloSchema.partial().extend({
  id: z.string().uuid('ID de vuelo inválido'),
});

export const vueloFiltersSchema = z.object({
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  tipo_vuelo: tipoVueloEnum.optional(),
  aerolinea_codigo: z.string().optional(),
  created_by: z.string().uuid().optional(),
  requiere_anulable: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const createAdjuntoSchema = z.object({
  vuelo_id: z.string().uuid('ID de vuelo inválido'),
  tipo_adjunto: tipoAdjuntoEnum,
  nombre_archivo: z.string().min(1, 'Nombre de archivo es requerido'),
  mime_type: z.string().optional(),
  tamano_bytes: z.number().int().positive().optional(),
});

export const createAnulableSchema = z.object({
  vuelo_id: z.string().uuid('ID de vuelo inválido'),
  pax_nombre: z.string().min(1, 'Nombre del PAX es requerido'),
  contacto_nombre: z.string().min(1, 'Nombre de contacto es requerido'),
  contacto_telefono: z.string().min(1, 'Teléfono es requerido'),
  fecha_vuelo: z.string().min(1, 'Fecha del vuelo es requerida'),
  ruta: z.string().min(1, 'Ruta es requerida'),
  localizador: z.string().min(1, 'Localizador es requerido'),
  fecha_limite: z.string().min(1, 'Fecha límite es requerida'),
  observaciones: z.string().optional(),
});
