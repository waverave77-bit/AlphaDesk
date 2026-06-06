/**
 * The Learn Path curriculum.
 *
 * Everything here is DERIVED from the single source of truth (TERMS in
 * glossary-terms.ts). Courses map 1:1 onto the glossary categories; lessons
 * are chunks of ~5 terms in order. Edit a glossary term and the path updates
 * automatically — no duplicated content.
 */
import { TERMS, type Term, type Category } from './glossary-terms'

export interface Course {
  id: string
  category: Category
  title: string
  tagline: string
  emoji: string
  /** tailwind color stem, e.g. 'blue' → bg-blue-500 */
  color: string
  order: number
}

/** The 6 courses, in the order a beginner should walk them. */
export const COURSES: Course[] = [
  { id: 'basics',     category: 'Basics',          title: 'The Basics',           tagline: 'What even is a stock?',         emoji: '🌱', color: 'blue',    order: 0 },
  { id: 'charts',     category: 'Charts',          title: 'Reading Charts',        tagline: 'Make sense of the squiggly lines', emoji: '📈', color: 'purple',  order: 1 },
  { id: 'health',     category: 'Company Health',  title: 'Is It a Good Company?', tagline: 'Spot a winner from a dud',      emoji: '🏢', color: 'emerald', order: 2 },
  { id: 'risk',       category: 'Risk',            title: 'Managing Risk',         tagline: 'How not to lose your shirt',    emoji: '🛡️', color: 'red',     order: 3 },
  { id: 'strategies', category: 'Strategies',      title: 'Investing Strategies',  tagline: 'Actually putting money to work', emoji: '🎯', color: 'amber',   order: 4 },
  { id: 'options',    category: 'Options & Bonds', title: 'Advanced Stuff',        tagline: 'Options, bonds & beyond',       emoji: '🚀', color: 'pink',    order: 5 },
]

/** Terms taught per lesson. */
const LESSON_SIZE = 5

export interface Lesson {
  id: string          // e.g. 'basics-1'
  courseId: string
  courseTitle: string
  emoji: string
  color: string
  index: number       // 1-based within its course
  globalOrder: number // 0-based position across the whole path
  title: string
  terms: Term[]
  /** The final "boss" lesson of a course — reviews ALL its terms. */
  isReview?: boolean
}

export interface QuizQuestion {
  prompt: string
  answer: string
  /** 3 plausible wrong answers (same category where possible). */
  distractors: string[]
  termName: string
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** Build the full ordered lesson list once at module load. */
function buildLessons(): Lesson[] {
  const lessons: Lesson[] = []
  let globalOrder = 0
  for (const course of COURSES) {
    const courseTerms = TERMS.filter((t) => t.category === course.category)
    const chunks = chunk(courseTerms, LESSON_SIZE)
    chunks.forEach((terms, i) => {
      lessons.push({
        id: `${course.id}-${i + 1}`,
        courseId: course.id,
        courseTitle: course.title,
        emoji: course.emoji,
        color: course.color,
        index: i + 1,
        globalOrder: globalOrder++,
        title: `Lesson ${i + 1}`,
        terms,
      })
    })
    // Boss review lesson — combines everything from the whole course.
    lessons.push({
      id: `${course.id}-review`,
      courseId: course.id,
      courseTitle: course.title,
      emoji: course.emoji,
      color: course.color,
      index: chunks.length + 1,
      globalOrder: globalOrder++,
      title: 'Review',
      terms: courseTerms,
      isReview: true,
    })
  }
  return lessons
}

export const ALL_LESSONS: Lesson[] = buildLessons()
export const TOTAL_LESSONS = ALL_LESSONS.length

export function getCourse(courseId: string): Course | undefined {
  return COURSES.find((c) => c.id === courseId)
}

export function getLesson(lessonId: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === lessonId)
}

export function getLessonsForCourse(courseId: string): Lesson[] {
  return ALL_LESSONS.filter((l) => l.courseId === courseId)
}

/**
 * Generate a quiz for a lesson — one "what does X mean?" question per term.
 * Distractors are pulled from other terms in the same category (more plausible),
 * falling back to any category. Deterministic (no Math.random) so server and
 * client render identically; the player shuffles option order at runtime.
 */
export function buildQuiz(lesson: Lesson): QuizQuestion[] {
  const sameCategoryPool = TERMS.filter((t) => t.category === lesson.terms[0]?.category)
  const fullPool = TERMS

  return lesson.terms.map((term) => {
    const pool = (sameCategoryPool.length >= 4 ? sameCategoryPool : fullPool)
      .filter((t) => t.term !== term.term)

    // Deterministic pick: start from this term's index, step through the pool.
    const startIdx = Math.max(0, pool.findIndex((t) => t.category === term.category))
    const distractors: string[] = []
    for (let step = 1; distractors.length < 3 && step <= pool.length; step++) {
      const cand = pool[(startIdx + step * 3) % pool.length]
      if (cand && cand.simple !== term.simple && !distractors.includes(cand.simple)) {
        distractors.push(cand.simple)
      }
    }
    // Safety fill if the deterministic walk came up short.
    for (const t of pool) {
      if (distractors.length >= 3) break
      if (t.simple !== term.simple && !distractors.includes(t.simple)) distractors.push(t.simple)
    }

    return {
      prompt: `What does "${term.term}" mean?`,
      answer: term.simple,
      distractors: distractors.slice(0, 3),
      termName: term.term,
    }
  })
}

/** XP awarded per correct answer, plus a flat completion bonus. */
export const XP_PER_CORRECT = 10
export const XP_LESSON_BONUS = 20

/** Total XP a user could earn completing the whole path (for progress bars). */
export const MAX_XP = ALL_LESSONS.reduce(
  (sum, l) => sum + l.terms.length * XP_PER_CORRECT + XP_LESSON_BONUS,
  0,
)
