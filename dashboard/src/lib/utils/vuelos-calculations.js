export function calcularFee(
  monto_venta,
  monto_sabre,
  monto_expedia,
  monto_emision
) {
  const costos = (monto_sabre || 0) + (monto_expedia || 0) + (monto_emision || 0);
  return Number((monto_venta - costos).toFixed(2));
}

export function calcularFechaLimiteAnulacion(fecha_vuelo, dias_antes = 7) {
  const fecha = new Date(fecha_vuelo);
  fecha.setDate(fecha.getDate() - dias_antes);
  return fecha.toISOString().split('T')[0];
}

export function formatearMontoWhatsApp(monto) {
  return `$${monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generarFormatoWhatsApp(vuelo) {
  const totalPax = vuelo.num_adultos + vuelo.num_ninos + vuelo.num_infantes;
  const paxDetalle = [];
  
  if (vuelo.num_adultos > 0) paxDetalle.push(`${vuelo.num_adultos}ADT`);
  if (vuelo.num_ninos > 0) paxDetalle.push(`${vuelo.num_ninos}CHD`);
  if (vuelo.num_infantes > 0) paxDetalle.push(`${vuelo.num_infantes}INF`);
  
  const [year, month, day] = vuelo.fecha_vuelo.split('-');
  const fecha = new Date(year, month - 1, day);
  const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();
  
  let mensaje = `*PAGO COMPLETO*\n`;
  
  if (vuelo.metodo_pago) {
    mensaje += `Cuenta: ${vuelo.metodo_pago}\n`;
  }
  
  mensaje += `Pax: ${totalPax} ${vuelo.pax_nombre}\n`;
  mensaje += `➖➖➖➖➖➖➖➖➖➖\n`;
  mensaje += `👤PAX: ${paxDetalle.join(' Y ')} ${vuelo.pax_nombre}\n`;
  mensaje += `📱CONTACTO: ${vuelo.contacto_nombre}\n`;
  mensaje += `🗓️fecha: ${fechaFormateada}\n`;
  mensaje += `📍ruta: ${vuelo.ruta}\n`;
  
  if (vuelo.horario) {
    mensaje += `⏱️horario: ${vuelo.horario}\n`;
  }
  
  if (vuelo.aerolinea_codigo) {
    mensaje += `✈️ Aerolínea cod IATA: *${vuelo.aerolinea_codigo}*\n`;
  }
  
  mensaje += ` *LOC* : *${vuelo.localizador}*\n`;
  mensaje += ` *PROVEEDOR* : ${vuelo.proveedor}\n`;
  mensaje += `➖➖➖➖➖➖➖➖\n`;
  mensaje += `Venta: *${formatearMontoWhatsApp(vuelo.monto_venta)}*\n`;
  
  if (vuelo.monto_sabre) {
    mensaje += `Sabre: *${formatearMontoWhatsApp(vuelo.monto_sabre)}*\n`;
  }
  
  if (vuelo.monto_expedia) {
    mensaje += `Expedia: *${formatearMontoWhatsApp(vuelo.monto_expedia)}*\n`;
  }
  
  if (vuelo.monto_emision) {
    mensaje += `Emisión: *${formatearMontoWhatsApp(vuelo.monto_emision)}*\n`;
  }
  
  if (vuelo.monto_fee) {
    mensaje += `Fee: *${formatearMontoWhatsApp(vuelo.monto_fee)}*\n`;
  }
  
  return mensaje;
}

export function validarLocalizador(localizador) {
  return /^[A-Z0-9]{5,8}$/i.test(localizador);
}

export function validarCodigoIATA(codigo) {
  return /^[A-Z]{2}$/i.test(codigo);
}

export function calcularTotalPasajeros(num_adultos, num_ninos, num_infantes) {
  return num_adultos + num_ninos + num_infantes;
}
