# Mr. Guy Invests — short-video content style guide

This is the source of truth for what our TikTok/IG Reels/YouTube Shorts
content should actually look like. It exists because the first attempt
at this (see "What NOT to do" below) missed the format entirely —
built an educational multi-fact video when the proven format is much
simpler. Read this before writing any video-scripts-queue.json entry.

There are exactly two formats. Every script must clone one of them.

## Format A — Simple aesthetic hook video

**The whole idea: ONE short punchy phrase, on screen the entire time,
over FAST CUTS of multiple luxury/aspirational clips. Nothing else.**

Real examples that prove this works:
- **riskanddreward, "money wins."** — cinematic clip (car/city at night),
  one line of text. 227.9K likes, 31.6K saves, 11.7K shares.
- **needm_rari, "CEO."** — one word, over a private jet + luxury car.
  122.3K likes, 19.9K saves, 4,221 shares. Part of a series (same
  account also runs "#diplomat", "#economist" — same format, different
  single word).
- **youth.investing.network, "Just be the best at Wealth Management"**
  — one quote over a shot of the J.P. Morgan building. 31.6K likes,
  3,629 saves. Same account runs this as a series too: "We are the
  best Investment Bank" (JPM building), "Just be the best Investment
  Bank" (Barclays building).
- **youth.investing.network, "Me and bro in 5 years: Investment
  Banking / Private Equity"** — one relatable aspirational caption
  over a single photo (two guys in suits, private jet hangar). 44K
  likes, 4,445 saves, 4,437 shares.
- **bigclaytz, "POV: i told her i partially own 500 multibillion
  dollar companies ($100 in the S&P 500)"** — one clever flex line
  (built on a real, accurate fact) over continuous cinematic footage
  of a man walking down grand palace stairs. 124.1K likes, 9,229
  saves, 20K shares. Proof that real financial substance CAN work in
  this format, as long as it's delivered as one punchy line, not a
  teaching sequence.

**Rules:**
- The on-screen text is 2–8 words, total — but shorter is better.
  1-3 words ("Investing.", "Old money.", "CEO.") is the ideal; treat
  8 as a ceiling, not a target. It is NOT a sequence of hook lines
  building up a point. It does not explain anything. It does not
  teach. It is a vibe, a flex, or a one-line fact delivered as a flex
  (see the S&P 500 example above).
- Never write anything that sounds like advice, a tip, or a lesson.
  "patience compounds." and "know your net worth number." are WRONG —
  they sound like a financial-literacy caption. "money talks.",
  "CEO.", "the top 1% think differently." are RIGHT — simple, punchy,
  aspirational, almost cliché.
- **Video length: minimum 15 seconds.** The single hook line spans
  the whole thing (e.g. `start: 0, end: 15`), never shorter. Use 7-8
  footage_keywords at roughly 2s/clip to fill it — more clips, not
  slower cuts.
- Background is those 7-8 quick clips cut fast (~2s each), never one
  long static shot. Luxury cars, private jets (tarmac or interior),
  cash (stacks, counting, close-ups), expensive watches, city
  skylines at night, grand old-money architecture (banks, manors,
  marble staircases) — **and Wall Street/financial-district imagery
  specifically (NYSE facade, Wall Street street sign, trading floor,
  the bull statue)**, mixed into every clip rotation, not just the
  generic luxury set. Aesthetic and cinematic, not stock-photo
  generic.
- Text rendering: plain bold white text with a thin black outline,
  centered. No background box behind it — the outline alone is what
  keeps it legible.
- Mood/tone: confident, aspirational, "already made it" — never
  self-deprecating, never "we're all broke together," never
  teen-coded slang.

**On reusing the exact wording (this is allowed, within limits):**
A single word or generic short phrase ("CEO.", "money talks.", "money
wins.") is not copyrightable and is not something platform duplicate-
detection catches — that detection works on video/audio fingerprints,
not overlay text, and needm_rari literally runs a whole series
reusing this exact template with different single words. Reusing
these trend-template words verbatim is fine, not risky, and normal
practice. The line is: a longer, specific, "someone clearly wrote
this" line — like bigclaytz's "POV: i told her i partially own 500
multibillion dollar companies ($100 in the S&P 500)" — is an actual
constructed joke/observation, not a generic template word, so that
one should stay original wording, not copied verbatim. Rule of thumb:
if it's under ~4 words and generic/aspirational, copy it freely. If
it's a full constructed sentence or specific joke, write an original
one in the same spirit instead.

## Format B — Useful-info carousel

**This is an ACTUAL swipeable photo carousel — people swipe through
slides, it is never a video.** A numbered list or a single real,
specific, detailed artifact — concrete facts you can screenshot and
use, not vague advice. (Format A and B look similar on paper — both
have "hook_lines" and "footage_keywords" — but they render through
completely different scripts into completely different post types.
Mixing this up once already produced Format B content as a continuous
video with sequential text overlays instead of a carousel — don't
repeat that.)

Real examples:
- **financeeducationforyou, "Finance Jobs That Can Make You a
  Millionaire"** — one job title + real pay range per slide, over
  finance-movie stills (Wolf of Wall Street) instead of stock photos.
  87.7K likes, 25.3K saves, 3,424 shares.
- **plan_pe6, "Top 5 Finance Certifications for High Schoolers"** —
  numbered list, one certification per slide with real cost/time/
  difficulty (e.g. "#5 Bloomberg Market Concepts — $149, 8 hours,
  EASY"). Clean text over a simple photo background.
- **tyfinancial resume carousel** — a single REAL, detailed artifact
  (an actual student's actual resume) shown in full as proof/example,
  captioned pointing to more help. 323.6K likes, 122.5K saves (an
  exceptional save rate) — this is the standout number across
  everything scouted so far. The lesson: showing one real, specific,
  detailed thing beats generic advice every time.

**Rules:**
- **Slide 1 is always a title/hook slide** — e.g. "Top 5 finance jobs
  that pay the most" — that tells the swiper what the countdown or
  list actually is, BEFORE the numbered items start. A carousel that
  opens straight on "#5 Credit card balance — avg 24% APR" with no
  title has no hook — the swiper has no idea what they're looking at.
  Every "Top 5 X" or numbered-listicle carousel needs this; a single-
  real-artifact carousel (tyfinancial-style) is the one exception,
  since its first line ("Example: $27,000 in student loans") already
  IS the context-setting title.
- Each slide is one item: one job, one certification, one fact — with
  a real, specific number attached (pay range, cost, time, percentage).
  No slide should contain generic advice with no number attached.
- If showing a "real artifact" (a real budget, a real resume, a real
  portfolio), it must actually BE real or a genuinely sourced example
  — never a fabricated "this is my actual X" claim. See the hard rule
  in strategist_agent.sh; that rule stays in force regardless of what
  this guide says about the format being effective.
- Visual per slide: **the same luxury/aspirational aesthetic as
  Format A** (private jets, luxury cars, cash, watches, city
  skylines, marble/grand architecture) — NOT a literal topic-matching
  photo (e.g. don't use "financial analyst at desk with monitors" for
  a finance-jobs slide, or "lawn mower on grass" for a side-hustle
  slide). The brand's whole visual identity is the luxury aesthetic;
  Format B just adds a real number per slide on top of it, it doesn't
  switch to generic literal stock photography. Movie stills are fair
  game per the earlier copyright discussion for posts personally
  reviewed, not the fully-automated default.
- One footage_keyword per slide (1:1 with hook_lines) — each slide
  is one Pexels-searched luxury photo with that slide's text on it.

## What NOT to do (learned the hard way)

The first version of this pipeline generated multi-line "educational"
scripts — 3-4 sequential hook lines building up a teaching point
("your paycheck is not what you think it is." → "$15/hr. 40 hours."
→ "taxes take their cut first." → "know the real number...").
That is NOT what performs. It reads as a lesson. Scrap that shape
entirely. Every script is either Format A (one line, fast luxury
montage) or Format B (a numbered list or one real artifact), never a
multi-beat explainer.

## Technical execution notes

**Format A entries go in `scripts/video-scripts-queue.json`, rendered
by `create_hook_video.py` (produces an actual video).**
- One hook_lines entry spanning the full (15s minimum) duration,
  7-8 footage_keywords for fast ~2s-per-clip cuts.
- Text has no background box — plain white with a black outline
  (already the default in render_text_png).
- Source clips arrive at different native frame rates; the pipeline
  normalizes to 30fps before concatenating (fixed after the first
  sample run produced broken cut timing).
- Every render also gets a real audio track auto-picked from
  `stock-footage/audio/` for the Instagram/YouTube copy (TikTok's
  copy stays silent — its API can't attach a native sound, so those
  get posted manually with a real in-app sound added by hand).

**Format B entries go in `scripts/carousel-scripts-queue.json` (a
SEPARATE file — never video-scripts-queue.json), rendered by
`create_carousel.py` (produces PNG slides + an instagram-queue.json
entry, no video at all).**
- hook_lines and footage_keywords must be the same length — one
  keyword's photo per slide, in order.
- Each slide gets that beat's text over its own luxury photo, plus a
  small `@mrguyinvests` handle and page-number (e.g. "2/6") in the
  corners.
