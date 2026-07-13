const KNOWN_SEDES = ['nova', 'apolo', 'flash']
const KNOWN_LEADS = ['colombia', 'venezuela']
const KNOWN_LEADERS = ['moises', 'jesus', 'endry']

export const capitalizeWord = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Detecta si un bot pertenece al grupo "other" (sesiones con sufijo _other)
 */
export const isOtherBot = (sessionName) => {
  if (!sessionName) return false
  return String(sessionName).toLowerCase().endsWith('_other')
}

/**
 * Determina si un bot es visible para un usuario según su sufijo asignado.
 * Si el usuario no tiene sufijo, ve todos los bots excepto los _other.
 */
export const isBotVisibleForUser = (sessionName, userSuffix) => {
  if (!sessionName) return false
  const normalizedSession = String(sessionName).toLowerCase()
  if (!userSuffix) return !isOtherBot(normalizedSession)
  return normalizedSession.endsWith(String(userSuffix).toLowerCase())
}

export const parseBotSessionName = (sessionName) => {
  if (!sessionName) {
    return {
      displayName: 'Sin nombre',
      fullName: 'Sin nombre',
      sedeKey: null,
      sedeLabel: null,
      leadKey: null,
      leadLabel: null,
      leaderKey: null,
      leaderLabel: null,
    }
  }

  const tokens = String(sessionName)
    .split('_')
    .map((t) => t.trim())
    .filter(Boolean)

  const nameTokens = []
  let sedeKey = null
  let leadKey = null
  let leaderKey = null

  tokens.forEach((token) => {
    const lower = token.toLowerCase()
    
    // Ignorar tokens numéricos puros (como 2, 3, etc.)
    if (/^\d+$/.test(token)) {
      return
    }
    
    if (!sedeKey && KNOWN_SEDES.includes(lower)) {
      sedeKey = lower
      return
    }
    if (!leadKey && KNOWN_LEADS.includes(lower)) {
      leadKey = lower
      return
    }
    if (!leaderKey && KNOWN_LEADERS.includes(lower)) {
      leaderKey = lower
      return
    }
    nameTokens.push(token)
  })

  const fullName =
    nameTokens.length > 0
      ? nameTokens
          .map((t) =>
            t
              .split('-')
              .map((part) => capitalizeWord(part))
              .join(' '),
          )
          .join(' ')
      : String(sessionName)

  const displayName = nameTokens.length > 0 ? capitalizeWord(nameTokens[0]) : fullName

  return {
    displayName,
    fullName,
    sedeKey,
    sedeLabel: sedeKey ? capitalizeWord(sedeKey) : null,
    leadKey,
    leadLabel: leadKey ? capitalizeWord(leadKey) : null,
    leaderKey,
    leaderLabel: leaderKey ? capitalizeWord(leaderKey) : null,
  }
}

export { KNOWN_SEDES, KNOWN_LEADS, KNOWN_LEADERS }
