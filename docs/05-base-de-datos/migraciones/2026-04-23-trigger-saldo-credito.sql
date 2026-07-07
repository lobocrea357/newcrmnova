-- Función para calcular saldo pendiente automáticamente
CREATE OR REPLACE FUNCTION calcular_saldo_pendiente_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo calcular si es venta a crédito
  IF NEW.forma_emision = 'CREDITO' THEN
    NEW.saldo_pendiente_cliente := COALESCE(NEW.monto_total_venta, 0) 
                                   - COALESCE(NEW.pago_inicial_cliente, 0);
    
    -- Validar que el saldo no sea negativo
    IF NEW.saldo_pendiente_cliente < 0 THEN
      RAISE EXCEPTION 'El pago inicial (%) no puede ser mayor al monto total de venta (%)',
        NEW.pago_inicial_cliente, NEW.monto_total_venta;
    END IF;
  ELSE
    -- Si es CONTADO, saldo es 0
    NEW.saldo_pendiente_cliente := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta antes de INSERT o UPDATE
DROP TRIGGER IF EXISTS trigger_calcular_saldo_pendiente ON vuelos;
CREATE TRIGGER trigger_calcular_saldo_pendiente
  BEFORE INSERT OR UPDATE ON vuelos
  FOR EACH ROW
  EXECUTE FUNCTION calcular_saldo_pendiente_cliente();

COMMENT ON FUNCTION calcular_saldo_pendiente_cliente() IS 
  'Calcula automáticamente el saldo pendiente del cliente basado en monto total y pago inicial';
