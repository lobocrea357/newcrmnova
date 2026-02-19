export type TipoVuelo = 'MIGRACION' | 'TURISMO' | 'NEGOCIOS' | 'OTRO';
export type TipoAdjunto = 'COMPROBANTE_PAGO' | 'PASAPORTE';
export type EstadoAnulacion = 'PENDIENTE' | 'ANULADO' | 'NO_ANULADO';

export interface Vuelo {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  
  pax_nombre: string;
  num_adultos: number;
  num_ninos: number;
  num_infantes: number;
  contacto_nombre: string;
  contacto_telefono: string;
  
  fecha_vuelo: string;
  ruta: string;
  horario?: string;
  aerolinea_codigo?: string;
  aerolinea_nombre?: string;
  localizador: string;
  proveedor: string;
  
  monto_venta: number;
  monto_sabre?: number;
  monto_expedia?: number;
  monto_emision?: number;
  monto_fee?: number;
  metodo_pago?: string;
  
  tipo_vuelo: TipoVuelo;
  requiere_anulable: boolean;
  anulable_id?: string;
  observaciones?: string;
}

export interface VueloAdjunto {
  id: string;
  vuelo_id: string;
  tipo_adjunto: TipoAdjunto;
  nombre_archivo: string;
  url_storage: string;
  mime_type?: string;
  tamano_bytes?: number;
  uploaded_at: string;
  uploaded_by: string;
}

export interface Anulable {
  id: string;
  created_at: string;
  updated_at: string;
  vuelo_id?: string;
  pax_nombre: string;
  contacto_nombre?: string;
  contacto_telefono?: string;
  fecha_vuelo?: string;
  ruta?: string;
  localizador?: string;
  estado_anulacion: EstadoAnulacion;
  fecha_limite?: string;
  fecha_anulacion?: string;
  monto_recuperado?: number;
  motivo_anulacion?: string;
  observaciones?: string;
  asignado_a?: string;
}

export interface CreateVueloInput {
  pax_nombre: string;
  num_adultos: number;
  num_ninos: number;
  num_infantes: number;
  contacto_nombre: string;
  contacto_telefono: string;
  fecha_vuelo: string;
  ruta: string;
  horario?: string;
  aerolinea_codigo?: string;
  aerolinea_nombre?: string;
  localizador: string;
  proveedor: string;
  monto_venta: number;
  monto_sabre?: number;
  monto_expedia?: number;
  monto_emision?: number;
  metodo_pago?: string;
  tipo_vuelo: TipoVuelo;
  requiere_anulable: boolean;
  observaciones?: string;
}

export interface UpdateVueloInput extends Partial<CreateVueloInput> {
  id: string;
}

export interface VueloWithAdjuntos extends Vuelo {
  adjuntos?: VueloAdjunto[];
  anulable?: Anulable;
}

export interface VueloFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_vuelo?: TipoVuelo;
  aerolinea_codigo?: string;
  created_by?: string;
  requiere_anulable?: boolean;
  search?: string;
}

export interface CreateAnulableFromVueloInput {
  vuelo_id: string;
  pax_nombre: string;
  contacto_nombre: string;
  contacto_telefono: string;
  fecha_vuelo: string;
  ruta: string;
  localizador: string;
  fecha_limite: string;
  observaciones?: string;
}
