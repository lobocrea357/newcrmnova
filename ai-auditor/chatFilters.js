/**
 * Utilidades para filtrado de chats internos en AI-Auditor (CommonJS)
 */

const INTERNAL_KEYWORDS = [
  // Departamentos y operaciones
  'pago',
  'pagos',
  'confirmacion',
  'administracion',
  'administración',
  'finanza',
  'finanzas',
  'cobranza',
  'cobranzas',
  'emision',
  'emisión',
  'emisiones',
  'emisor',
  'emisores',
  'asignacion',
  'asignación',
  'asignaciones',
  'reasignacion',
  'reasignación',
  'soporte',
  'tecnico',
  'técnico',
  'sistemas',
  'servicio tecnico',
  
  // Jerarquías y roles
  'gerencia',
  'directiva',
  'director',
  'directora',
  'junta',
  'staff',
  'equipo',
  'grupo',
  'oficina',
  'lider',
  'líder',
  'supervisor',
  'supervisora',
  'coordinador',
  'coordinadora',
  'asesor',
  'asesora',
  'agente',
  'vendedor',
  'vendedora',
  
  // Identificadores de empresa / marcas internas
  'viajes nova',
  'viajesnova',
  'apolo viajes',
  'infot ventas',
  'tekio',
  'nova pago',
  'pago nova',
  'reunion',
  'reunión',
  'meeting',
  'internal',
  'interno',
  'prueba',
  'test',
  'demo',
  'status',
  'broadcast'
];

const INTERNAL_STAFF_NAMES = [
  'johan',
  'fernanda',
  'eduardo blanco',
  'dulce baptista',
  'rubi silva',
  'ruby silva',
  'erika varlese',
  'dimas attias',
  'dimas attías',
  'cristian soto',
  'cristihan soto',
  'tomas tecnico',
  'tomás técnico',
  'yoselis veliz',
  'gabriel vina',
  'gabriel viña',
  'gabriel mendoza',
  'cristofer gonzalez',
  'daniela hidalgo',
  'daniela buffenoir',
  'daniela zaidman',
  'estefania palma',
  'estefany',
  'euriana rujano',
  'eurianna rujano',
  'ariana zavala',
  'arianna zavala',
  'arianny gonzalez',
  'ariadny gonzalez',
  'fatima duran',
  'jorkelys querales',
  'michelle chacoa',
  'michele chacoa',
  'luis molletones',
  'luis silva',
  'andrea gutierrez',
  'alexmary galea',
  'saul',
  'alfredo leon',
  'keileanny hernandez',
  'junior',
  'valentina quintero',
  'nedyerson colina',
  'caira neferti',
  'leandro',
  'paul hernandez',
  'abraham'
];

const TEST_BOTS = [
  'abraham',
  'abrahama',
  'paul',
  'hernandez',
  'test',
  'prueba'
];

function normalizeText(text = '') {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizePhone(phone = '') {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function isInternalChat(chatInput, contactNumberOrSet = null, botPhoneSet = null) {
  if (!chatInput) return false;

  let contactName = '';
  let phone = '';
  let isGroup = false;
  let phoneSet = botPhoneSet;

  if (typeof chatInput === 'object') {
    contactName = chatInput.contact_name || chatInput.name || '';
    phone = chatInput.contact_number || chatInput.phone || chatInput.chat_id || '';
    isGroup = chatInput.is_group === true;
    if (contactNumberOrSet instanceof Set) {
      phoneSet = contactNumberOrSet;
    }
  } else {
    contactName = String(chatInput);
    if (typeof contactNumberOrSet === 'string') {
      phone = contactNumberOrSet;
    } else if (contactNumberOrSet instanceof Set) {
      phoneSet = contactNumberOrSet;
    }
  }

  // 1. Grupos explícitos o IDs de grupo de WhatsApp
  if (isGroup) return true;
  if (phone.includes('@g.us') || phone.includes('-')) return true;
  const cleanPhone = normalizePhone(phone);
  if (cleanPhone.length > 16) return true;

  // 2. Contactos especiales del sistema
  const normName = normalizeText(contactName);
  const normPhone = normalizeText(phone);
  if (normName === 'status' || normPhone === 'status' || normName.includes('broadcast') || normPhone.includes('broadcast')) {
    return true;
  }

  // 3. Coincidencia directa con teléfono de Bot o Asesor registrado
  if (phoneSet && phoneSet.size > 0 && cleanPhone) {
    if (phoneSet.has(cleanPhone)) return true;
    for (const botPhone of phoneSet) {
      if (cleanPhone.length >= 8 && botPhone.length >= 8) {
        if (cleanPhone.endsWith(botPhone.slice(-8)) || botPhone.endsWith(cleanPhone.slice(-8))) {
          return true;
        }
      }
    }
  }

  // 4. Búsqueda por palabras clave de departamentos, roles y empresas
  for (const keyword of INTERNAL_KEYWORDS) {
    const normKey = normalizeText(keyword);
    if (normName.includes(normKey)) {
      return true;
    }
  }

  // 5. Búsqueda por nombres conocidos de staff / compañeros
  for (const staff of INTERNAL_STAFF_NAMES) {
    const normStaff = normalizeText(staff);
    if (normName.includes(normStaff)) {
      return true;
    }
  }

  // 6. Patrones regex específicos
  if (/(?:\||\/|-)\s*(?:viajes\s*nova|nova|flash|apolo|infot|tekio)/i.test(contactName)) {
    return true;
  }

  return false;
}

function isTestBot(botName) {
  if (!botName || typeof botName !== 'string') return false;
  const nameLower = normalizeText(botName);
  return TEST_BOTS.some(testBot => nameLower.includes(normalizeText(testBot)));
}

module.exports = {
  isInternalChat,
  isTestBot,
  normalizeText,
  normalizePhone,
  INTERNAL_KEYWORDS,
  INTERNAL_STAFF_NAMES
};
