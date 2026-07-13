// Long-tail SEO guides. The nightly content agent appends one guide per run.
// Keep bodies plain text (paragraphs split on \n\n) — no markdown/HTML inside.

export interface GuideSection {
  heading: string
  body: string
}

export interface Guide {
  slug: string
  title: string          // page H1 (question-style titles rank best)
  metaTitle: string      // <title> — no brand suffix (root layout appends it)
  description: string    // meta description, ~150 chars
  date: string           // YYYY-MM-DD (publish date)
  category: 'Investing' | 'Credit' | 'Paychecks & Taxes' | 'Saving' | 'College Money'
  intro: string          // 2-3 sentence hook shown under the H1
  sections: GuideSection[]
  relatedTerms: string[] // exact Term names from lib/glossary-terms.ts
  faq?: { q: string; a: string }[] // rendered + emitted as FAQPage JSON-LD
}

export function guideToSlug(slug: string): string {
  return slug
}

export const GUIDES: Guide[] = [
  {
    slug: 'can-you-invest-at-16',
    title: 'Can You Invest at 16? What’s Actually Allowed (and Smart)',
    metaTitle: 'Can You Invest at 16? Custodial Accounts & Roth IRAs Explained',
    description:
      'Yes — teens can invest at 16 through custodial accounts and even a Roth IRA with job income. Here’s what’s legal, what’s smart, and how to start.',
    date: '2026-07-07',
    category: 'Investing',
    intro:
      'Short answer: yes, but not by yourself. You can’t open your own brokerage account until you’re 18 (21 in a few states) — but there are two completely legal ways to start investing real money at 16, and one of them is arguably the most powerful account in all of personal finance.',
    sections: [
      {
        heading: 'Option 1: a custodial brokerage account (UGMA/UTMA)',
        body: 'A custodial account is a regular investment account that a parent or guardian opens in your name. The money is legally yours — the adult just manages it until you reach the "age of majority" in your state (usually 18 or 21), at which point full control transfers to you automatically.\n\nInside it you can own real stocks, ETFs, and index funds. Most major brokerages (Fidelity, Schwab, Vanguard) offer custodial accounts with no minimums and no fees, and some offer youth accounts that give teens app access with parental oversight.\n\nOne honest caveat: money in a custodial account counts as the student’s asset on financial aid forms, which can reduce need-based aid slightly more than money held in a parent’s name. If college aid matters a lot for your family, it’s worth knowing before moving large amounts in.',
      },
      {
        heading: 'Option 2: a custodial Roth IRA — the teen cheat code',
        body: 'If you have any earned income — a summer job, lifeguarding, tutoring, a W-2 or documented self-employment — you qualify for a Roth IRA at ANY age. A parent opens a custodial Roth for you, and you (or anyone) can contribute up to the amount you actually earned that year, capped at the annual IRS limit.\n\nWhy this is the single most powerful account a teenager can have: Roth money grows completely tax-free forever. A few thousand dollars invested at 16 has 45+ years to compound before retirement — using the market’s long-term average of roughly 10% per year, money doubles about every 7 years. That’s six or seven doublings. A dollar invested at 16 does the work of roughly $50–100 invested at 50.\n\nThe requirement people miss: the contribution can’t exceed your actual earned income. Allowance doesn’t count. Babysitting cash can count if it’s documented (keep simple records).',
      },
      {
        heading: 'What you can’t do at 16',
        body: 'You can’t open your own account by lying about your age — brokerages verify with your Social Security number, and getting flagged can create real problems later. You can’t trade options or crypto in most custodial setups, which is fine, because you shouldn’t be anyway. And no legitimate path involves a Discord server, a "funded account challenge," or someone else trading "for you." At 16, anyone promising you trading profits is selling something.',
      },
      {
        heading: 'The move most people skip: practice before you deposit',
        body: 'The biggest advantage you have at 16 isn’t money — it’s time to make mistakes for free. Before real dollars go anywhere, spend a month managing a virtual portfolio with live market prices. Panic-sell a fake crash. Watch a hyped stock round-trip. Learn what your risk tolerance actually feels like when a position drops 20%.\n\nEvery mistake you make with fake money at 16 is a mistake you won’t make with real money at 25, when the stakes are rent-sized.',
      },
      {
        heading: 'Your checklist',
        body: '1. Practice with a virtual portfolio for at least a month.\n2. If you have job income: ask a parent to open a custodial Roth IRA — even $25/month matters at your age.\n3. No job income yet: a custodial brokerage (UGMA/UTMA) with a broad index fund is the standard starting point.\n4. Automate a small monthly amount rather than investing in bursts — the habit is the asset.\n5. The day you turn 18: open your own brokerage account and a Roth IRA in your name, and the custodial assets eventually transfer to you.',
      },
    ],
    relatedTerms: ['Stock', 'ETF', 'Index', 'Compound Interest', 'Portfolio'],
    faq: [
      {
        q: 'Can I invest at 16 without my parents?',
        a: 'No. Every legal route for a minor in the US requires an adult custodian on the account. Anyone offering a way around that is a red flag.',
      },
      {
        q: 'Can a 16-year-old have a Roth IRA?',
        a: 'Yes — at any age, as long as you have earned income (a job, documented self-employment). A parent opens a custodial Roth IRA, and contributions are capped at what you actually earned that year.',
      },
      {
        q: 'What should a teenager invest in first?',
        a: 'The boring consensus answer is a broad, low-cost index fund rather than individual stock picks. It’s the whole market in one purchase, so no single company’s failure can wipe you out.',
      },
    ],
  },
  {
    slug: 'first-paycheck-smaller-than-expected',
    title: 'Why Your First Paycheck Is Smaller Than You Calculated',
    metaTitle: 'First Paycheck Smaller Than Expected? Where the Money Went',
    description:
      'You did hours × wage and the check came up short. Here’s exactly where the money went — FICA, withholding — and the refund most teens never claim.',
    date: '2026-07-07',
    category: 'Paychecks & Taxes',
    intro:
      'You worked 40 hours at $15/hour, did the math — $600 — and the check says something like $511. Nobody stole from you, but nobody explained it either. Here’s exactly who took what, which parts come back, and the one move most teens never make that’s worth hundreds of dollars.',
    sections: [
      {
        heading: 'The two lines that never come back: Social Security and Medicare',
        body: 'Every US paycheck loses 6.2% to Social Security and 1.45% to Medicare — together called FICA. On a $600 check that’s $37.20 + $8.70 = $45.90.\n\nThis isn’t a tax you can adjust or refund. It funds current retirees’ benefits and healthcare, and your own eligibility decades from now. Everyone pays it from their very first dollar of wages. Consider it the fixed cover charge for having a job.',
      },
      {
        heading: 'The line that probably DOES come back: federal withholding',
        body: 'The "Federal Income Tax" line on your stub is not a bill — it’s an estimate. Your employer guesses what you might owe for the year (based on the W-4 form you filled out on day one) and sends a slice of each check to the IRS in advance.\n\nHere’s what matters for most teens: the federal standard deduction is around $15,000. If your total income for the whole year is under that — true for almost every part-time or summer job — your actual federal income tax bill is $0. Every dollar that was withheld was an overpayment.\n\nOverpayments don’t come back automatically. You have to file a tax return.',
      },
      {
        heading: 'The move: file a tax return in January (yes, even as a teenager)',
        body: 'In late January your employer sends you a W-2 form showing what you earned and what was withheld. Filing a federal return with it takes about 20 minutes with free software (IRS Free File, or any of the free tiers of the big tax apps), and for a typical summer-job teen the refund is a few hundred dollars.\n\nMost teens never file, because nobody tells them to — that withheld money just stays with the government. Filing when you’re under the standard deduction isn’t a loophole or a gray area; it’s exactly how the system is designed to work. The refund is your own money coming home.',
      },
      {
        heading: 'Check your W-4 so less disappears in the first place',
        body: 'The W-4 you filled out on your first day controls how much gets withheld. If you expect to earn less than the standard deduction for the whole year, the form has a specific option: you can write "Exempt" (following the current form’s instructions), which tells your employer to skip federal income tax withholding entirely.\n\nOnly do this if you’re genuinely going to stay under the threshold — and note it doesn’t touch FICA, which comes out no matter what. If you’re not sure you’ll stay under, leave withholding on and collect the refund in the spring instead. That’s the no-risk version.',
      },
      {
        heading: 'The unlock nobody mentions: a paycheck opens the Roth IRA door',
        body: 'The best part of your first paycheck isn’t the money — it’s the classification. You now have "earned income," which is the legal key to a Roth IRA (a custodial one if you’re under 18).\n\nMoney you put in a Roth as a teenager grows tax-free for 40+ years. Even redirecting one week of summer wages — a few hundred dollars — into a Roth at 16 or 17 is, dollar for dollar, the highest-leverage investing you will ever do in your life, because nothing else will ever have that much time to compound.',
      },
    ],
    relatedTerms: ['Compound Interest', 'Portfolio', 'Index'],
    faq: [
      {
        q: 'Why is my paycheck less than my hourly rate times my hours?',
        a: 'Three deductions: Social Security (6.2%), Medicare (1.45%), and federal (plus possibly state) income tax withholding. The FICA portion is permanent; the income tax withholding is an estimate you can get refunded by filing a return if you earned under the standard deduction.',
      },
      {
        q: 'Do teenagers get all their taxes back?',
        a: 'Teens who earn less than the federal standard deduction (~$15,000/year) owe $0 federal income tax, so all federal income tax withheld comes back as a refund — but only if they file a return. Social Security and Medicare are never refunded.',
      },
      {
        q: 'Do I have to file taxes for a summer job?',
        a: 'If you earned under the standard deduction, you generally aren’t required to file — but you should anyway, because filing is the only way to get your withheld money refunded.',
      },
    ],
  },
]
