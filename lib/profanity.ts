const BAD_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'pussy', 'cock',
  'nigger', 'nigga', 'faggot', 'fag', 'whore', 'slut', 'bastard',
  'damn', 'crap', 'piss', 'retard', 'twat', 'wank', 'bollocks',
  'fucker', 'motherfucker', 'asshole', 'arsehole', 'jackass',
]

export function containsProfanity(str: string): boolean {
  const lower = str.toLowerCase().replace(/[^a-z0-9]/g, '')
  return BAD_WORDS.some((w) => lower.includes(w))
}
