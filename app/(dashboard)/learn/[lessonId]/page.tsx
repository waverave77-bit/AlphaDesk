'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { getLesson, buildQuiz, ALL_LESSONS, getLessonsForCourse } from '@/lib/curriculum'
import MrGuyHead from '@/components/MrGuyHead'
import { X, Check, ArrowRight, Flame, Star, Lightbulb } from 'lucide-react'

const ACCENT: Record<string, { solid: string; text: string; soft: string }> = {
  blue:    { solid: 'bg-blue-500',    text: 'text-blue-400',    soft: 'bg-blue-500/10' },
  purple:  { solid: 'bg-purple-500',  text: 'text-purple-400',  soft: 'bg-purple-500/10' },
  emerald: { solid: 'bg-emerald-500', text: 'text-emerald-400', soft: 'bg-emerald-500/10' },
  red:     { solid: 'bg-red-500',     text: 'text-red-400',     soft: 'bg-red-500/10' },
  amber:   { solid: 'bg-amber-500',   text: 'text-amber-400',   soft: 'bg-amber-500/10' },
  pink:    { solid: 'bg-pink-500',    text: 'text-pink-400',    soft: 'bg-pink-500/10' },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function LessonPlayer() {
  const router = useRouter()
  const params = useParams()
  const lessonId = String(params.lessonId)
  const lesson = getLesson(lessonId)

  const [phase, setPhase] = useState<'teach' | 'quiz' | 'results'>('teach')
  const [termIdx, setTermIdx] = useState(0)
  const [quizIdx, setQuizIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ xpGain: number; streak: number; authed: boolean } | null>(null)
  const posted = useRef(false)

  const quiz = useMemo(() => (lesson ? buildQuiz(lesson) : []), [lesson])
  // Shuffle option order once per lesson (client-only — no hydration mismatch).
  const options = useMemo(
    () => quiz.map((q) => shuffle([q.answer, ...q.distractors])),
    [quiz],
  )

  // Whenever the lesson changes (incl. "Next lesson" nav), start fresh.
  useEffect(() => {
    setPhase('teach'); setTermIdx(0); setQuizIdx(0); setSelected(null); setScore(0); setResult(null)
    posted.current = false
  }, [lessonId])

  // Submit completion when we reach the results screen.
  useEffect(() => {
    if (phase !== 'results' || posted.current || !lesson) return
    posted.current = true
    fetch('/api/learn/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id, score }),
    })
      .then((r) => r.json())
      .then((d) => setResult({ xpGain: d.xpGain ?? 0, streak: d.streak ?? 0, authed: d.authed !== false }))
      .catch(() => setResult({ xpGain: 0, streak: 0, authed: false }))
  }, [phase, lesson, score])

  if (!lesson) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-gray-400">That lesson doesn’t exist.</p>
        <Link href="/learn" className="text-blue-400 hover:text-blue-300 font-semibold mt-3 inline-block">← Back to Learn</Link>
      </div>
    )
  }

  const a = ACCENT[lesson.color] ?? ACCENT.blue
  const term = lesson.terms[termIdx]
  const q = quiz[quizIdx]
  const nextLesson = ALL_LESSONS[lesson.globalOrder + 1]
  const courseLessons = getLessonsForCourse(lesson.courseId)
  const isLastInCourse = courseLessons[courseLessons.length - 1]?.id === lesson.id

  // Progress bar across teach (terms) then quiz (questions).
  const totalSteps = lesson.terms.length + quiz.length
  const stepDone = phase === 'teach' ? termIdx : lesson.terms.length + quizIdx
  const barPct = Math.round((stepDone / totalSteps) * 100)

  return (
    <div className="max-w-xl mx-auto pb-16">
      {/* Top bar: close + progress */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button onClick={() => router.push('/learn')} aria-label="Exit lesson" className="text-gray-500 hover:text-gray-300 shrink-0">
          <X className="h-6 w-6" />
        </button>
        <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full ${a.solid} transition-all duration-300`} style={{ width: `${Math.max(barPct, 4)}%` }} />
        </div>
        <span className={`text-xs font-bold ${a.text} shrink-0`}>{lesson.courseTitle}</span>
      </div>

      {/* ── TEACH ── */}
      {phase === 'teach' && term && (
        <div>
          <div className="flex items-start gap-3 mb-5">
            <div className="shrink-0 bg-gray-800 rounded-xl p-1.5"><MrGuyHead px={3} /></div>
            <div className={`${a.soft} rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-200`}>
              Let’s learn <span className="font-bold text-white">{term.term}</span> 👇
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white">{term.term}</h2>
              <p className={`text-lg font-semibold ${a.text} mt-1`}>{term.simple}</p>
            </div>
            <p className="text-gray-300 leading-relaxed">{term.explanation}</p>
            {term.example && (
              <div className="bg-gray-800/60 rounded-2xl px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1">Example</p>
                <p className="text-sm text-gray-300">{term.example}</p>
              </div>
            )}
            {term.tip && (
              <div className="flex items-start gap-2 text-sm text-yellow-300/90">
                <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{term.tip}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-5">
            <div className="flex gap-1.5">
              {lesson.terms.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === termIdx ? `w-5 ${a.solid}` : i < termIdx ? 'w-1.5 bg-gray-600' : 'w-1.5 bg-gray-800'}`} />
              ))}
            </div>
            <button
              onClick={() => (termIdx + 1 < lesson.terms.length ? setTermIdx(termIdx + 1) : setPhase('quiz'))}
              className={`px-6 py-3 rounded-2xl font-bold text-white ${a.solid} hover:brightness-110 flex items-center gap-1.5 transition-all`}
            >
              {termIdx + 1 < lesson.terms.length ? 'Continue' : 'Quiz time!'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {phase === 'quiz' && q && (
        <div>
          <div className="flex items-start gap-3 mb-5">
            <div className="shrink-0 bg-gray-800 rounded-xl p-1.5"><MrGuyHead px={3} /></div>
            <div className={`${a.soft} rounded-2xl rounded-tl-sm px-4 py-3 text-base font-semibold text-white`}>{q.prompt}</div>
          </div>

          <div className="space-y-3">
            {options[quizIdx]?.map((opt) => {
              const isAnswer = opt === q.answer
              const isPicked = selected === opt
              const show = selected !== null
              return (
                <button
                  key={opt}
                  disabled={show}
                  onClick={() => {
                    setSelected(opt)
                    if (opt === q.answer) setScore((s) => s + 1)
                  }}
                  className={[
                    'w-full text-left px-4 py-4 rounded-2xl border-2 font-medium transition-all',
                    !show ? 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500'
                      : isAnswer ? 'border-green-500 bg-green-500/10 text-green-300'
                      : isPicked ? 'border-red-500 bg-red-500/10 text-red-300'
                      : 'border-gray-800 bg-gray-900 text-gray-500',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-between gap-2">
                    {opt}
                    {show && isAnswer && <Check className="h-5 w-5 text-green-400 shrink-0" />}
                    {show && isPicked && !isAnswer && <X className="h-5 w-5 text-red-400 shrink-0" />}
                  </span>
                </button>
              )
            })}
          </div>

          {selected !== null && (
            <button
              onClick={() => {
                if (quizIdx + 1 < quiz.length) { setQuizIdx(quizIdx + 1); setSelected(null) }
                else setPhase('results')
              }}
              className={`w-full mt-6 px-6 py-3.5 rounded-2xl font-bold text-white ${a.solid} hover:brightness-110 flex items-center justify-center gap-1.5`}
            >
              {quizIdx + 1 < quiz.length ? 'Next question' : 'See results'} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'results' && (
        <div className="text-center pt-6">
          <div className="inline-block bg-gray-800 rounded-3xl p-3 mb-4"><MrGuyHead px={6} /></div>
          <h2 className="text-3xl font-extrabold text-white">
            {score === quiz.length ? 'Perfect! 🎉' : score >= quiz.length / 2 ? 'Nice work! 👏' : 'Lesson complete!'}
          </h2>
          <p className="text-gray-400 mt-1">You got <span className="font-bold text-white">{score}/{quiz.length}</span> right.</p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4">
              <div className="flex items-center justify-center gap-1.5 text-yellow-400 font-extrabold text-2xl">
                <Star className="h-6 w-6" /> +{result?.xpGain ?? 0}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">XP earned</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4">
              <div className="flex items-center justify-center gap-1.5 text-orange-400 font-extrabold text-2xl">
                <Flame className="h-6 w-6" /> {result?.streak ?? 0}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">day streak</p>
            </div>
          </div>

          {result && !result.authed && (
            <Link href="/register" className="block mt-5 text-sm font-semibold text-blue-400 hover:text-blue-300">
              Sign up free to save your XP & streak →
            </Link>
          )}

          {/* Course-complete nudge into the sim */}
          {isLastInCourse && (
            <div className="mt-6 bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
              <p className="text-sm text-blue-200">
                🏆 You finished <span className="font-bold">{lesson.courseTitle}</span>! Now go practice with $100K of fake money.
              </p>
              <Link href="/trading-simulator" className="inline-block mt-2 text-sm font-bold text-blue-400 hover:text-blue-300">
                Try the $100K Challenge →
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-8">
            {nextLesson && (
              <button
                onClick={() => router.push(`/learn/${nextLesson.id}`)}
                className="px-6 py-3.5 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-1.5"
              >
                Next lesson <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <Link href="/learn" className="px-6 py-3.5 rounded-2xl font-bold text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors">
              Back to the path
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
