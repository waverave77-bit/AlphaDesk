'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { getLesson, ALL_LESSONS, getLessonsForCourse } from '@/lib/curriculum'
import { buildLessonExercises, scoredCount, isScored, type Exercise } from '@/lib/exercises'
import MrGuyMascot, { Mood } from '@/components/learn/MrGuyMascot'
import MatchExercise from '@/components/learn/MatchExercise'
import PushButton, { PushVariant } from '@/components/learn/PushButton'
import Confetti from '@/components/learn/Confetti'
import CountUp from '@/components/learn/CountUp'
import { useSound } from '@/components/learn/useSound'
import { X, Check, Lightbulb, Flame, Star, Volume2, VolumeX } from 'lucide-react'

const ACCENT: Record<string, { v: PushVariant; text: string; soft: string; bar: string; grad: string }> = {
  blue:    { v: 'blue',    text: 'text-blue-400',    soft: 'bg-blue-500/10',    bar: 'bg-blue-500',    grad: 'from-blue-500 to-blue-600' },
  purple:  { v: 'purple',  text: 'text-purple-400',  soft: 'bg-purple-500/10',  bar: 'bg-purple-500',  grad: 'from-purple-500 to-purple-600' },
  emerald: { v: 'emerald', text: 'text-emerald-400', soft: 'bg-emerald-500/10', bar: 'bg-emerald-500', grad: 'from-emerald-500 to-emerald-600' },
  red:     { v: 'red',     text: 'text-red-400',     soft: 'bg-red-500/10',     bar: 'bg-red-500',     grad: 'from-red-500 to-red-600' },
  amber:   { v: 'amber',   text: 'text-amber-400',   soft: 'bg-amber-500/10',   bar: 'bg-amber-500',   grad: 'from-amber-500 to-amber-600' },
  pink:    { v: 'pink',    text: 'text-pink-400',    soft: 'bg-pink-500/10',    bar: 'bg-pink-500',    grad: 'from-pink-500 to-pink-600' },
}

function emojiForTerm(name: string): string {
  const n = name.toLowerCase()
  if (/dividend|cash|income|pay/.test(n)) return '💰'
  if (/etf|fund|basket|index/.test(n)) return '🧺'
  if (/bull/.test(n)) return '🐂'
  if (/bear/.test(n)) return '🐻'
  if (/ipo|public|debut/.test(n)) return '🎉'
  if (/risk|volat|loss/.test(n)) return '⚠️'
  if (/chart|trend|moving|candle/.test(n)) return '📈'
  if (/stock|share|equity/.test(n)) return '📜'
  if (/option|call|put|deriv/.test(n)) return '🎲'
  if (/bond|yield|treasury/.test(n)) return '🏦'
  if (/cap|value|worth|price/.test(n)) return '🏷️'
  if (/portfolio|diversif/.test(n)) return '💼'
  if (/broker|exchange|market/.test(n)) return '🤝'
  if (/ticker|symbol/.test(n)) return '🔤'
  return '📊'
}

const HYPE = ['Nice!', 'Correct!', 'You got it!', 'Let’s gooo!', 'Big brain 🧠', 'Boom 💥']
const BIG_HYPE = ['ON FIRE! 🔥', 'UNSTOPPABLE! ⚡', 'Certified genius 🧠', 'Wall Street’s shaking 📈']
const WRONG = ['Nah, not that one.', 'Close! But nope.', 'Swing and a miss ⚾', 'We’ll get the next one.']
const TEACH_INTROS = ['Alright, lock this in 🔒', 'Ooh, this one’s big 👀', 'You’ll use this constantly:', 'Pay attention, rookie 😎', 'This is where it clicks:']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

/* Per-exercise: the option labels, the correct label, and the bubble prompt. */
function correctLabel(ex: Exercise): string {
  switch (ex.kind) {
    case 'choice': return ex.answer
    case 'blank': return ex.answer
    case 'truefalse': return ex.isTrue ? 'Fact' : 'Myth'
    case 'scenario': return ex.options.find((o) => o.correct)?.label ?? ''
    default: return ''
  }
}
function bubbleFor(ex: Exercise): string {
  switch (ex.kind) {
    case 'choice': return ex.prompt
    case 'blank': return 'Which term fits?'
    case 'truefalse': return 'Myth or fact? 🤔'
    case 'scenario': return ex.prompt
    case 'match': return 'Match ’em up! 🔗'
    default: return ''
  }
}

export default function LessonPlayer() {
  const router = useRouter()
  const params = useParams()
  const lessonId = String(params.lessonId)
  const lesson = getLesson(lessonId)
  const sound = useSound()

  const exercises = useMemo(() => (lesson ? buildLessonExercises(lesson) : []), [lesson])
  const totalScored = useMemo(() => scoredCount(exercises), [exercises])

  const [phase, setPhase] = useState<'play' | 'results'>('play')
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<boolean | null>(null) // null = unanswered
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [post, setPost] = useState<{ xpGain: number; streak: number; authed: boolean; perfect?: boolean; perfectBonus?: number; leveledUp?: boolean; levelTitle?: string; levelEmoji?: string; newAchievements?: { id: string; title: string; emoji: string; xp: number }[] } | null>(null)
  const [chestOpen, setChestOpen] = useState(false)
  const posted = useRef(false)

  const ex = exercises[idx]
  // Shuffle option order once per exercise (client-only).
  const shuffledOpts = useMemo(() => {
    if (!ex) return []
    if (ex.kind === 'choice' || ex.kind === 'blank') return shuffle(ex.options)
    if (ex.kind === 'truefalse') return ['Fact', 'Myth']
    if (ex.kind === 'scenario') return ex.options.map((o) => o.label)
    return []
  }, [ex])

  useEffect(() => {
    setPhase('play'); setIdx(0); setSelected(null); setResult(null); setScore(0); setCombo(0); setPost(null); setChestOpen(false); posted.current = false
  }, [lessonId])

  useEffect(() => {
    if (phase !== 'results' || posted.current || !lesson) return
    posted.current = true
    sound.complete()
    fetch('/api/learn/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lessonId: lesson.id, score }) })
      .then((r) => r.json())
      .then((d) => setPost({ xpGain: d.xpGain ?? 0, streak: d.streak ?? 0, authed: d.authed !== false, perfect: d.perfect, perfectBonus: d.perfectBonus ?? 0, leveledUp: d.leveledUp, levelTitle: d.levelTitle, levelEmoji: d.levelEmoji, newAchievements: d.newAchievements ?? [] }))
      .catch(() => setPost({ xpGain: 0, streak: 0, authed: false }))
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
  const nextLesson = ALL_LESSONS[lesson.globalOrder + 1]
  const courseLessons = getLessonsForCourse(lesson.courseId)
  const isLastInCourse = courseLessons[courseLessons.length - 1]?.id === lesson.id

  const stepDone = idx + (result !== null ? 1 : 0)
  const barPct = Math.round((stepDone / exercises.length) * 100)
  const mood: Mood = phase === 'results' ? 'celebrate' : result === true ? 'happy' : result === false ? 'sad' : ex?.kind === 'teach' ? 'think' : 'idle'

  // Commit an answer (select-based or match).
  const commit = (correct: boolean) => {
    if (result !== null) return
    setResult(correct)
    if (ex && isScored(ex)) {
      if (ex.kind !== 'match') { correct ? sound.correct() : sound.wrong() }
      if (correct) { setScore((s) => s + 1); setCombo((c) => c + 1) }
      else setCombo(0)
    }
  }
  const advance = () => {
    if (idx + 1 < exercises.length) { setIdx(idx + 1); setSelected(null); setResult(null) }
    else setPhase('results')
  }

  // Feedback footer detail text.
  const feedbackDetail = (() => {
    if (!ex || result === null) return null
    if (ex.kind === 'truefalse') return ex.explain
    if (ex.kind === 'scenario') return ex.options.find((o) => o.label === selected)?.reply ?? null
    if ((ex.kind === 'choice' || ex.kind === 'blank') && result === false) return `Answer: ${correctLabel(ex)}`
    return null
  })()
  const hypeMsg = combo >= 3 ? BIG_HYPE[combo % BIG_HYPE.length] : HYPE[score % HYPE.length]

  return (
    <div className="max-w-xl mx-auto pb-44 min-h-[80vh]">
      <style>{`
        @keyframes lpBounceIn{0%{opacity:0;transform:scale(.6) translateY(10px)}60%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
        @keyframes lpSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes lpPop{0%{transform:scale(0)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
        .lp-bounce{animation:lpBounceIn .4s cubic-bezier(.3,.7,.4,1.5) both}
      `}</style>

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button onClick={() => router.push('/learn')} aria-label="Exit lesson" className="text-gray-500 hover:text-gray-300 shrink-0"><X className="h-7 w-7" /></button>
        <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden relative">
          <div className={`h-full ${a.bar} rounded-full transition-all duration-500`} style={{ width: `${Math.max(barPct, 4)}%` }}>
            <div className="absolute inset-x-1 top-1 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
        {combo >= 2 && phase === 'play' && (
          <div className="flex items-center gap-0.5 text-orange-400 font-extrabold shrink-0" style={{ animation: 'lpPop .3s ease' }}><Flame className="h-5 w-5" /> {combo}</div>
        )}
        <button onClick={sound.toggleMute} aria-label="Toggle sound" className="text-gray-600 hover:text-gray-400 shrink-0">{sound.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
      </div>

      {/* ── PLAY ── */}
      {phase === 'play' && ex && (
        <div key={idx} className="lp-bounce">
          {/* TEACH beat */}
          {ex.kind === 'teach' && (
            <>
              <div className="flex items-center gap-1 mb-3">
                <div className="shrink-0 -mb-2"><MrGuyMascot px={3} mood="think" /></div>
                <div className={`${a.soft} border border-white/5 rounded-3xl rounded-bl-md px-4 py-3 text-sm text-gray-100 font-semibold relative`}>
                  {TEACH_INTROS[(idx + lesson.globalOrder) % TEACH_INTROS.length]}
                  <div className={`absolute -left-1.5 bottom-3 w-3 h-3 ${a.soft} rotate-45`} />
                </div>
              </div>
              <div className="rounded-3xl overflow-hidden border-2 border-gray-800 shadow-xl">
                {/* Colored flashcard header */}
                <div className={`bg-gradient-to-br ${a.grad} px-6 py-5 flex items-center gap-4`}>
                  <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shrink-0 shadow-inner">{emojiForTerm(ex.term.term)}</div>
                  <div className="min-w-0">
                    <p className="text-white/70 text-[11px] font-black uppercase tracking-widest">New term</p>
                    <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{ex.term.term}</h2>
                  </div>
                </div>
                {/* Body */}
                <div className="bg-gray-900 p-6 space-y-4">
                  <p className={`text-xl font-bold ${a.text}`}>{ex.term.simple}</p>
                  <p className="text-gray-300 leading-relaxed text-[15px]">{ex.term.explanation}</p>
                  {ex.term.example && (
                    <div className="bg-gray-800/70 rounded-2xl px-4 py-3 border border-gray-700/50">
                      <p className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1">For example</p>
                      <p className="text-sm text-gray-200">{ex.term.example}</p>
                    </div>
                  )}
                  {ex.term.tip && (
                    <div className="flex items-start gap-2 text-sm text-yellow-300/90 bg-yellow-500/5 rounded-2xl px-3 py-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" /><span>{ex.term.tip}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <PushButton variant={a.v} className="px-8 py-3 text-base" onClick={advance}>Got it 👊</PushButton>
              </div>
            </>
          )}

          {/* MATCH */}
          {ex.kind === 'match' && (
            <>
              <div className="flex items-center gap-1 mb-5">
                <div className="shrink-0 -mb-2"><MrGuyMascot px={3} mood={mood} /></div>
                <div className="bg-gray-800 border border-white/5 rounded-3xl rounded-bl-md px-4 py-3 text-base font-bold text-white relative">
                  {bubbleFor(ex)}<div className="absolute -left-1.5 bottom-3 w-3 h-3 bg-gray-800 rotate-45" />
                </div>
              </div>
              <MatchExercise pairs={ex.pairs} onComplete={(correct) => commit(correct)} />
            </>
          )}

          {/* OPTION-BASED: choice / blank / truefalse / scenario */}
          {(ex.kind === 'choice' || ex.kind === 'blank' || ex.kind === 'truefalse' || ex.kind === 'scenario') && (
            <>
              <div className="flex items-center gap-1 mb-5">
                <div className="shrink-0 -mb-2"><MrGuyMascot px={3} mood={mood} /></div>
                <div className="bg-gray-800 border border-white/5 rounded-3xl rounded-bl-md px-4 py-3 text-base font-bold text-white relative">
                  {bubbleFor(ex)}<div className="absolute -left-1.5 bottom-3 w-3 h-3 bg-gray-800 rotate-45" />
                </div>
              </div>

              {/* Context card for blank / truefalse / scenario */}
              {ex.kind === 'blank' && (
                <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl px-5 py-5 mb-4 text-center">
                  <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold mb-1">Definition</p>
                  <p className="text-xl font-bold text-white">“{ex.definition}”</p>
                </div>
              )}
              {ex.kind === 'truefalse' && (
                <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl px-5 py-6 mb-4">
                  <p className="text-xl font-bold text-white text-center leading-snug">“{ex.statement}”</p>
                </div>
              )}
              {ex.kind === 'scenario' && (
                <div className={`${a.soft} border-2 border-white/5 rounded-3xl px-5 py-5 mb-4`}>
                  <div className="text-3xl mb-2">{ex.emoji}</div>
                  <p className="text-base font-semibold text-gray-100 leading-relaxed">{ex.situation}</p>
                </div>
              )}

              <div className="space-y-3">
                {shuffledOpts.map((opt) => {
                  const cl = correctLabel(ex)
                  const picked = selected === opt
                  let style = 'border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-500 hover:bg-gray-800/60 active:translate-y-0.5 active:border-b-2'
                  if (result !== null && opt === cl) style = 'border-green-500 bg-green-500/15 text-green-200'
                  else if (result !== null && picked) style = 'border-red-500 bg-red-500/15 text-red-200'
                  else if (picked) style = 'border-blue-500 bg-blue-500/15 text-white'
                  return (
                    <button key={opt} disabled={result !== null}
                      onClick={() => { if (result === null) { setSelected(opt); sound.tick() } }}
                      className={`w-full text-left px-5 py-4 rounded-2xl border-2 border-b-4 font-semibold transition-all ${style}`}>
                      <span className="flex items-center justify-between gap-2">{opt}
                        {result !== null && opt === cl && <Check className="h-5 w-5 text-green-400 shrink-0" />}
                        {result !== null && picked && opt !== cl && <X className="h-5 w-5 text-red-400 shrink-0" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Fixed action / feedback footer (not for teach) ── */}
      {phase === 'play' && ex && ex.kind !== 'teach' && (
        <div className="fixed inset-x-0 bottom-0 z-40">
          {result === null ? (
            ex.kind === 'match' ? null : (
              <div className="bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-4">
                <div className="max-w-xl mx-auto">
                  <PushButton variant={selected ? a.v : 'gray'} fullWidth disabled={!selected} className="py-3.5 text-base" onClick={() => commit(selected === correctLabel(ex))}>Check</PushButton>
                </div>
              </div>
            )
          ) : (
            <div className={`${result ? 'bg-green-500/15 border-green-500/40' : 'bg-red-500/15 border-red-500/40'} border-t-2 px-4 py-4`} style={{ animation: 'lpSlideUp .25s cubic-bezier(.3,.7,.4,1.3) both' }}>
              <div className="max-w-xl mx-auto flex items-center gap-4">
                <div className={`shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${result ? 'bg-green-500' : 'bg-red-500'}`}>
                  {result ? <Check className="h-7 w-7 text-white" strokeWidth={3} /> : <X className="h-7 w-7 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-lg ${result ? 'text-green-300' : 'text-red-300'}`}>{result ? hypeMsg : WRONG[idx % WRONG.length]}</p>
                  {feedbackDetail && <p className={`text-sm ${result ? 'text-green-200/80' : 'text-red-200/80'} line-clamp-2`}>{feedbackDetail}</p>}
                </div>
                <PushButton variant={result ? 'green' : 'red'} className="px-6 py-3 text-base shrink-0" onClick={advance}>{idx + 1 < exercises.length ? 'Continue' : 'Finish'}</PushButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS ── */}
      {phase === 'results' && !chestOpen && (
        <div className="text-center pt-10">
          <style>{`@keyframes chestWiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}`}</style>
          <h2 className="text-3xl font-black text-white tracking-tight mb-1">{score === totalScored ? 'Perfect run! 🎉' : 'Lesson complete! 👏'}</h2>
          <p className="text-gray-400 mb-8 text-lg">You scored <span className="font-bold text-white">{score}/{totalScored}</span></p>
          <button onClick={() => { setChestOpen(true); sound.complete() }} className="group inline-flex flex-col items-center" aria-label="Open your reward">
            <div className="text-[120px] leading-none" style={{ animation: 'chestWiggle 1.2s ease-in-out infinite' }}>🎁</div>
            <span className="mt-4 px-6 py-3 rounded-2xl bg-blue-600 group-hover:bg-blue-500 text-white font-black text-lg transition-colors" style={{ boxShadow: '0 5px 0 #1d4ed8' }}>Tap to open!</span>
          </button>
        </div>
      )}

      {phase === 'results' && chestOpen && (
        <div className="text-center pt-4">
          <Confetti />
          <div className="inline-block mb-2 lp-bounce"><MrGuyMascot px={6} mood="celebrate" /></div>

          {/* Level-up banner */}
          {post?.leveledUp && (
            <div className="lp-bounce mb-4 mx-auto max-w-xs bg-gradient-to-r from-purple-600/30 to-blue-600/20 border-2 border-purple-400/40 rounded-3xl px-5 py-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-purple-300">⭐ Level up!</p>
              <p className="text-xl font-black text-white">{post.levelEmoji} You’re now a {post.levelTitle}</p>
            </div>
          )}

          <h2 className="text-4xl font-black text-white tracking-tight">{score === totalScored ? 'Flawless! 🎉' : 'Nice work! 👏'}</h2>
          <p className="text-gray-400 mt-2 text-lg">You got <span className="font-bold text-white">{score}/{totalScored}</span> right.</p>

          <div className="flex items-center justify-center gap-3 mt-7">
            <div className="bg-gradient-to-b from-yellow-500/20 to-yellow-600/5 border-2 border-yellow-500/30 rounded-3xl px-6 py-4 min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 text-yellow-400 font-black text-3xl"><Star className="h-7 w-7 fill-yellow-400" /><CountUp value={post?.xpGain ?? 0} prefix="+" delay={400} onTick={sound.tick} /></div>
              <p className="text-[11px] text-yellow-200/60 mt-1 font-bold uppercase tracking-wide">XP earned</p>
            </div>
            <div className="bg-gradient-to-b from-orange-500/20 to-orange-600/5 border-2 border-orange-500/30 rounded-3xl px-6 py-4 min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 text-orange-400 font-black text-3xl"><Flame className="h-7 w-7 fill-orange-400" /> {post?.streak ?? 0}</div>
              <p className="text-[11px] text-orange-200/60 mt-1 font-bold uppercase tracking-wide">day streak</p>
            </div>
          </div>

          {post?.perfect && (post?.perfectBonus ?? 0) > 0 && (
            <p className="mt-4 text-sm font-black text-yellow-300">💯 Perfect bonus: +{post.perfectBonus} XP</p>
          )}

          {/* Achievement unlocks */}
          {(post?.newAchievements?.length ?? 0) > 0 && (
            <div className="mt-5 space-y-2 max-w-sm mx-auto">
              {post!.newAchievements!.map((ach) => (
                <div key={ach.id} className="lp-bounce flex items-center gap-3 bg-gradient-to-r from-yellow-500/20 to-amber-600/10 border-2 border-yellow-500/40 rounded-2xl px-4 py-3 text-left">
                  <div className="text-3xl shrink-0">{ach.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Achievement unlocked!</p>
                    <p className="text-base font-black text-white">{ach.title}</p>
                  </div>
                  <span className="font-black text-yellow-300 shrink-0">+{ach.xp}</span>
                </div>
              ))}
            </div>
          )}

          {post && !post.authed && <Link href="/register" className="block mt-6 text-sm font-bold text-blue-400 hover:text-blue-300">Sign up free to save your XP & streak →</Link>}

          {isLastInCourse && (
            <div className="mt-7 bg-gradient-to-r from-blue-600/25 to-blue-500/10 border-2 border-blue-500/30 rounded-3xl p-5 text-left">
              <p className="text-base text-blue-100 font-semibold">🏆 You finished <span className="font-black">{lesson.courseTitle}</span>!</p>
              <p className="text-sm text-blue-200/70 mt-1">Now put it to work with $100K of fake money — zero risk.</p>
              <Link href="/trading-simulator" className="inline-block mt-3 font-black text-blue-400 hover:text-blue-300">Try the $100K Challenge →</Link>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-9 max-w-sm mx-auto">
            {nextLesson && <PushButton variant="blue" fullWidth className="py-4 text-lg" onClick={() => router.push(`/learn/${nextLesson.id}`)}>Next lesson →</PushButton>}
            <PushButton variant="gray" fullWidth className="py-3.5 text-base" onClick={() => router.push('/learn')}>Back to the path</PushButton>
          </div>
        </div>
      )}
    </div>
  )
}
