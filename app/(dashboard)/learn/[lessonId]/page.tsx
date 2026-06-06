'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { getLesson, buildQuiz, ALL_LESSONS, getLessonsForCourse } from '@/lib/curriculum'
import MrGuyMascot, { Mood } from '@/components/learn/MrGuyMascot'
import PushButton, { PushVariant } from '@/components/learn/PushButton'
import Confetti from '@/components/learn/Confetti'
import CountUp from '@/components/learn/CountUp'
import { useSound } from '@/components/learn/useSound'
import { X, Check, Lightbulb, Flame, Star, Volume2, VolumeX } from 'lucide-react'

const ACCENT: Record<string, { v: PushVariant; text: string; soft: string; bar: string }> = {
  blue:    { v: 'blue',    text: 'text-blue-400',    soft: 'bg-blue-500/10',    bar: 'bg-blue-500' },
  purple:  { v: 'purple',  text: 'text-purple-400',  soft: 'bg-purple-500/10',  bar: 'bg-purple-500' },
  emerald: { v: 'emerald', text: 'text-emerald-400', soft: 'bg-emerald-500/10', bar: 'bg-emerald-500' },
  red:     { v: 'red',     text: 'text-red-400',     soft: 'bg-red-500/10',     bar: 'bg-red-500' },
  amber:   { v: 'amber',   text: 'text-amber-400',   soft: 'bg-amber-500/10',   bar: 'bg-amber-500' },
  pink:    { v: 'pink',    text: 'text-pink-400',    soft: 'bg-pink-500/10',    bar: 'bg-pink-500' },
}

const TEACH_INTROS = ['Alright, lock this in 🔒', 'Ooh, this one’s big 👀', 'You’ll use this constantly:', 'Pay attention, rookie 😎', 'This is where it clicks:', 'Easy money — watch:']
const HYPE = ['Nice!', 'Correct!', 'You got it!', 'Let’s gooo!', 'Big brain 🧠', 'Boom 💥']
const BIG_HYPE = ['ON FIRE! 🔥', 'UNSTOPPABLE! ⚡', 'Certified genius 🧠', 'Wall Street’s shaking 📈']
const WRONG_LINES = ['Nah, not that one.', 'Close! But nope.', 'Swing and a miss ⚾', 'We’ll get the next one.']

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
  const sound = useSound()

  const [phase, setPhase] = useState<'teach' | 'quiz' | 'results'>('teach')
  const [termIdx, setTermIdx] = useState(0)
  const [quizIdx, setQuizIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [result, setResult] = useState<{ xpGain: number; streak: number; authed: boolean } | null>(null)
  const posted = useRef(false)

  const quiz = useMemo(() => (lesson ? buildQuiz(lesson) : []), [lesson])
  const options = useMemo(() => quiz.map((q) => shuffle([q.answer, ...q.distractors])), [quiz])

  // Fresh slate whenever the lesson changes (incl. "Next lesson").
  useEffect(() => {
    setPhase('teach'); setTermIdx(0); setQuizIdx(0); setSelected(null); setChecked(false)
    setScore(0); setCombo(0); setResult(null); posted.current = false
  }, [lessonId])

  useEffect(() => {
    if (phase !== 'results' || posted.current || !lesson) return
    posted.current = true
    sound.complete()
    fetch('/api/learn/complete', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson.id, score }),
    })
      .then((r) => r.json())
      .then((d) => setResult({ xpGain: d.xpGain ?? 0, streak: d.streak ?? 0, authed: d.authed !== false }))
      .catch(() => setResult({ xpGain: 0, streak: 0, authed: false }))
  }, [phase, lesson, score, sound])

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
  const isCorrect = checked && selected === q?.answer
  const nextLesson = ALL_LESSONS[lesson.globalOrder + 1]
  const courseLessons = getLessonsForCourse(lesson.courseId)
  const isLastInCourse = courseLessons[courseLessons.length - 1]?.id === lesson.id

  const totalSteps = lesson.terms.length + quiz.length
  const stepDone = phase === 'teach' ? termIdx : lesson.terms.length + quizIdx + (checked ? 1 : 0)
  const barPct = Math.round((stepDone / totalSteps) * 100)

  const submit = () => {
    if (!q || selected === null) return
    const right = selected === q.answer
    setChecked(true)
    if (right) { setScore((s) => s + 1); setCombo((c) => c + 1); sound.correct() }
    else { setCombo(0); sound.wrong() }
  }
  const advance = () => {
    if (quizIdx + 1 < quiz.length) { setQuizIdx(quizIdx + 1); setSelected(null); setChecked(false) }
    else setPhase('results')
  }

  const hypeMsg = combo >= 3 ? BIG_HYPE[combo % BIG_HYPE.length] : HYPE[score % HYPE.length]
  const mood: Mood = phase === 'results' ? 'celebrate'
    : phase === 'quiz' ? (checked ? (isCorrect ? 'happy' : 'sad') : 'idle')
    : 'think'

  return (
    <div className="max-w-xl mx-auto pb-40 min-h-[80vh]">
      <style>{`
        @keyframes lpBounceIn{0%{opacity:0;transform:scale(.6) translateY(10px)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
        @keyframes lpShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        @keyframes lpSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes lpPop{0%{transform:scale(0) rotate(-15deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
        @keyframes lpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .lp-bounce{animation:lpBounceIn .45s cubic-bezier(.3,.7,.4,1.5) both}
        .lp-shake{animation:lpShake .4s ease}
        .lp-float{animation:lpFloat 2.4s ease-in-out infinite}
      `}</style>

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-7 pt-2">
        <button onClick={() => router.push('/learn')} aria-label="Exit lesson" className="text-gray-500 hover:text-gray-300 shrink-0">
          <X className="h-7 w-7" />
        </button>
        <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
          <div className={`h-full ${a.bar} rounded-full transition-all duration-500 relative`} style={{ width: `${Math.max(barPct, 5)}%` }}>
            <div className="absolute inset-x-1 top-1 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
        {combo >= 2 && phase === 'quiz' && (
          <div className="flex items-center gap-0.5 text-orange-400 font-extrabold shrink-0" style={{ animation: 'lpPop .3s ease' }}>
            <Flame className="h-5 w-5" /> {combo}
          </div>
        )}
        <button onClick={sound.toggleMute} aria-label="Toggle sound" className="text-gray-600 hover:text-gray-400 shrink-0">
          {sound.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* ── TEACH ── */}
      {phase === 'teach' && term && (
        <div key={termIdx} className="lp-bounce">
          <div className="flex items-center gap-1 mb-3">
            <div className="shrink-0 -mb-2"><MrGuyMascot px={3} mood="think" /></div>
            <div className={`${a.soft} border border-white/5 rounded-3xl rounded-bl-md px-4 py-3 text-sm text-gray-100 font-semibold relative`}>
              {TEACH_INTROS[(termIdx + lesson.globalOrder) % TEACH_INTROS.length]}
              <div className={`absolute -left-1.5 bottom-3 w-3 h-3 ${a.soft} rotate-45`} />
            </div>
          </div>

          <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{term.term}</h2>
              <p className={`text-xl font-bold ${a.text} mt-1`}>{term.simple}</p>
            </div>
            <p className="text-gray-300 leading-relaxed text-[15px]">{term.explanation}</p>
            {term.example && (
              <div className="bg-gray-800/70 rounded-2xl px-4 py-3 border border-gray-700/50">
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1">For example</p>
                <p className="text-sm text-gray-200">{term.example}</p>
              </div>
            )}
            {term.tip && (
              <div className="flex items-start gap-2 text-sm text-yellow-300/90 bg-yellow-500/5 rounded-2xl px-3 py-2">
                <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{term.tip}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6 gap-4">
            <div className="flex gap-1.5">
              {lesson.terms.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${i === termIdx ? `w-6 ${a.bar}` : i < termIdx ? 'w-2 bg-gray-600' : 'w-2 bg-gray-800'}`} />
              ))}
            </div>
            <PushButton
              variant={a.v}
              className="px-7 py-3 text-base"
              onClick={() => (termIdx + 1 < lesson.terms.length ? setTermIdx(termIdx + 1) : setPhase('quiz'))}
            >
              {termIdx + 1 < lesson.terms.length ? 'Got it' : 'Start quiz →'}
            </PushButton>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {phase === 'quiz' && q && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Question {quizIdx + 1} of {quiz.length}</p>
          <div className="flex items-center gap-1 mb-6">
            <div className="shrink-0 -mb-2"><MrGuyMascot px={3} mood={mood} /></div>
            <div className="bg-gray-800 border border-white/5 rounded-3xl rounded-bl-md px-4 py-3 text-base font-bold text-white relative">
              {q.prompt}
              <div className="absolute -left-1.5 bottom-3 w-3 h-3 bg-gray-800 rotate-45" />
            </div>
          </div>

          <div className="space-y-3">
            {options[quizIdx]?.map((opt) => {
              const isPicked = selected === opt
              const isAnswer = opt === q.answer
              let style = 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800/60 border-b-4'
              if (checked && isAnswer) style = 'border-green-500 bg-green-500/15 text-green-200 border-b-4'
              else if (checked && isPicked) style = 'border-red-500 bg-red-500/15 text-red-200 border-b-4'
              else if (isPicked) style = 'border-blue-500 bg-blue-500/15 text-white border-b-4 border-b-blue-600'
              return (
                <button
                  key={opt}
                  disabled={checked}
                  onClick={() => { if (!checked) { setSelected(opt); sound.tick() } }}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-semibold transition-all active:translate-y-0.5 active:border-b-2 ${style}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    {opt}
                    {checked && isAnswer && <Check className="h-5 w-5 text-green-400 shrink-0" />}
                    {checked && isPicked && !isAnswer && <X className="h-5 w-5 text-red-400 shrink-0" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── QUIZ action / feedback footer (fixed) ── */}
      {phase === 'quiz' && q && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          {!checked ? (
            <div className="bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-4">
              <div className="max-w-xl mx-auto">
                <PushButton variant={selected ? a.v : 'gray'} fullWidth disabled={!selected} className="py-3.5 text-base" onClick={submit}>
                  Check
                </PushButton>
              </div>
            </div>
          ) : (
            <div
              className={`${isCorrect ? 'bg-green-500/15 border-green-500/40' : 'bg-red-500/15 border-red-500/40'} border-t-2 px-4 py-4`}
              style={{ animation: 'lpSlideUp .25s cubic-bezier(.3,.7,.4,1.3) both' }}
            >
              <div className="max-w-xl mx-auto flex items-center gap-4">
                <div className={`shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                  {isCorrect ? <Check className="h-7 w-7 text-white" strokeWidth={3} /> : <X className="h-7 w-7 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-lg ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                    {isCorrect ? hypeMsg : WRONG_LINES[quizIdx % WRONG_LINES.length]}
                  </p>
                  {!isCorrect && <p className="text-sm text-red-200/80 truncate">Answer: <span className="font-semibold">{q.answer}</span></p>}
                  {isCorrect && combo >= 3 && <p className="text-sm text-green-200/80">{combo} in a row 🔥</p>}
                </div>
                <PushButton variant={isCorrect ? 'green' : 'red'} className="px-6 py-3 text-base shrink-0" onClick={advance}>
                  {quizIdx + 1 < quiz.length ? 'Continue' : 'Finish'}
                </PushButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'results' && (
        <div className="text-center pt-4">
          <Confetti />
          <div className="inline-block mb-2 lp-bounce">
            <MrGuyMascot px={6} mood="celebrate" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            {score === quiz.length ? 'Perfect! 🎉' : score >= quiz.length / 2 ? 'Lesson done! 👏' : 'Keep going! 💪'}
          </h2>
          <p className="text-gray-400 mt-2 text-lg">You got <span className="font-bold text-white">{score}/{quiz.length}</span> right.</p>

          <div className="flex items-center justify-center gap-3 mt-7">
            <div className="bg-gradient-to-b from-yellow-500/20 to-yellow-600/5 border-2 border-yellow-500/30 rounded-3xl px-6 py-4 min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 text-yellow-400 font-black text-3xl">
                <Star className="h-7 w-7 fill-yellow-400" />
                <CountUp value={result?.xpGain ?? 0} prefix="+" delay={400} onTick={sound.tick} />
              </div>
              <p className="text-[11px] text-yellow-200/60 mt-1 font-bold uppercase tracking-wide">XP earned</p>
            </div>
            <div className="bg-gradient-to-b from-orange-500/20 to-orange-600/5 border-2 border-orange-500/30 rounded-3xl px-6 py-4 min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 text-orange-400 font-black text-3xl">
                <Flame className="h-7 w-7 fill-orange-400" /> {result?.streak ?? 0}
              </div>
              <p className="text-[11px] text-orange-200/60 mt-1 font-bold uppercase tracking-wide">day streak</p>
            </div>
          </div>

          {result && !result.authed && (
            <Link href="/register" className="block mt-6 text-sm font-bold text-blue-400 hover:text-blue-300">
              Sign up free to save your XP & streak →
            </Link>
          )}

          {isLastInCourse && (
            <div className="mt-7 bg-gradient-to-r from-blue-600/25 to-blue-500/10 border-2 border-blue-500/30 rounded-3xl p-5 text-left">
              <p className="text-base text-blue-100 font-semibold">
                🏆 You finished <span className="font-black">{lesson.courseTitle}</span>!
              </p>
              <p className="text-sm text-blue-200/70 mt-1">Now put it to work with $100K of fake money — zero risk.</p>
              <Link href="/trading-simulator" className="inline-block mt-3 font-black text-blue-400 hover:text-blue-300">
                Try the $100K Challenge →
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-9 max-w-sm mx-auto">
            {nextLesson && (
              <PushButton variant="blue" fullWidth className="py-4 text-lg" onClick={() => router.push(`/learn/${nextLesson.id}`)}>
                Next lesson →
              </PushButton>
            )}
            <PushButton variant="gray" fullWidth className="py-3.5 text-base" onClick={() => router.push('/learn')}>
              Back to the path
            </PushButton>
          </div>
        </div>
      )}
    </div>
  )
}
