const KNOWN_SEDES = ['nova', 'apolo', 'flash']
const KNOWN_LEADS = ['colombia', 'venezuela']
const KNOWN_LEADERS = ['moises', 'jesus', 'endry']

const capitalizeWord = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
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
