export type ExperienceLevel = 'beginner' | 'some' | 'experienced'

/**
 * Returns a system-prompt suffix that calibrates Mr. Guy's language
 * to the user's investing experience level.
 */
export function getExperienceContext(level?: string | null): string {
  switch (level) {
    case 'experienced':
      return '\n\nAUDIENCE: This user is an experienced investor. Use proper financial terminology freely (P/E, EPS, beta, 52-week range, margin compression, etc.). Be concise and analytical — no hand-holding or jargon definitions needed.'
    case 'some':
      return '\n\nAUDIENCE: This user knows the basics of investing. Light jargon is fine but briefly explain anything more complex in parentheses. Keep it conversational, not academic.'
    default: // beginner
      return '\n\nAUDIENCE: This user is a complete beginner. Avoid all jargon. If you must use a finance term, immediately explain it in plain English in parentheses like this: "P/E ratio (basically how expensive the stock is compared to its profits)". Short sentences. Friendly and encouraging tone.'
  }
}

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Complete Beginner',
  some: 'Some Experience',
  experienced: 'Experienced',
}

export const EXPERIENCE_DESCS: Record<ExperienceLevel, string> = {
  beginner: "I've never invested before",
  some: 'I know the basics',
  experienced: "I've been investing for years",
}
