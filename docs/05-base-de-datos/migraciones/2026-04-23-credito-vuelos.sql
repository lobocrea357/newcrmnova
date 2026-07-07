-- Migración: Gestión de Crédito en Vuelos
-- Fecha: 2026-04-23
-- Descripción: Agregar campos para gestión de ventas a crédito con pagos iniciales

BEGIN;

-- Agregar columnas para gestión de crédito
ALTER TABLE vuelos
  ADD COLUMN IF NOT EXISTS monto_total_venta numeric CHECK (monto_total_venta >= 0),
  ADD COLUMN IF NOT EXISTS pago_inicial_cliente numeric DEFAULT 0 CHECK (pago_inicial_cliente >= 0),
  ADD COLUMN IF NOT EXISTS saldo_pendiente_cliente numeric CHECK (saldo_pendiente_cliente >= 0),
  ADD COLUMN IF NOT EXISTS costo_base_proveedor numeric CHECK (costo_base_proveedor >= 0);

-- Comentarios para documentación
COMMENT ON COLUMN vuelos.monto_total_venta IS 'Precio total que debe pagar el cliente (incluye markup de la agencia)';
COMMENT ON COLUMN vuelos.pago_inicial_cliente IS 'Monto inicial que pagó el cliente al momento de la reserva';
COMMENT ON COLUMN vuelos.saldo_pendiente_cliente IS 'Saldo que aún debe el cliente (calculado automáticamente)';
COMMENT ON COLUMN vuelos.costo_base_proveedor IS 'Costo base del boleto que la agencia debe al proveedor (Sabre, Kiu, etc.)';

-- Índices para optimizar consultas de deudas
CREATE INDEX IF NOT EXISTS idx_vuelos_saldo_pendiente ON vuelos(saldo_pendiente_cliente)
  WHERE saldo_pendiente_cliente > 0;

CREATE INDEX IF NOT EXISTS idx_vuelos_forma_emision ON vuelos(forma_emision)
  WHERE forma_emision IS NOT NULL;

COMMIT;
