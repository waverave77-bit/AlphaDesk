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
  {
    slug: 'roth-ira-vs-401k-which-first',
    title: 'Roth IRA or 401(k): Which Should You Fund First at Your First Real Job?',
    metaTitle: 'Roth IRA vs. 401(k): Which to Fund First',
    description:
      'New job, first 401(k) enrollment email, and a Roth IRA you keep hearing about — here’s the actual order to fund both so you don’t leave free money on the table.',
    date: '2026-07-14',
    category: 'Investing',
    intro:
      'Your new employer just sent you a 401(k) enrollment link, and somewhere in the back of your head you remember someone mentioning a Roth IRA too. You don’t need to pick one — you need to fund them in the right order. Get the order wrong and you can genuinely leave thousands of dollars on the table over your career.',
    sections: [
      {
        heading: 'The core difference: taxed now, or taxed later',
        body: 'A traditional 401(k) is funded with pre-tax money straight from your paycheck — it lowers your taxable income today, and you pay income tax when you withdraw it in retirement. A Roth IRA works in reverse: you fund it with money you’ve already paid tax on, and in exchange it grows completely tax-free — you owe nothing on withdrawals in retirement, not even on decades of gains.\n\nMany employers now also offer a Roth 401(k) option, which uses the same paycheck-deduction mechanics as a traditional 401(k) but with Roth’s after-tax, tax-free-growth treatment. So the real decision isn’t just "Roth or 401(k)" — it’s which account to prioritize, and which tax treatment to pick inside your 401(k) if you have the choice.',
      },
      {
        heading: 'Rule one: always capture the full employer match first',
        body: 'If your employer offers a 401(k) match — say, 50% of what you contribute up to 6% of your salary — that match is the single best return you will ever be offered on money, full stop. Putting in 6% of your paycheck to get an extra 3% from your employer is an instant, guaranteed 50% return before your investments have done anything at all. No stock, no fund, no strategy beats that.\n\nSkipping the match to prioritize a Roth IRA instead is the most common mistake young earners make. If your employer matches, contribute at least enough to get every dollar of it before you touch anything else.',
      },
      {
        heading: 'After the match, the Roth IRA usually wins',
        body: 'Once you’ve captured the match, the Roth IRA typically becomes the better next stop, for a few concrete reasons. A 401(k) only lets you invest in whatever short list of funds your employer’s plan offers — sometimes good, sometimes mediocre with high fees. A Roth IRA can be opened at any major brokerage and can hold virtually any stock, ETF, or index fund you want.\n\nRoth IRAs are also more flexible in an emergency: you can withdraw the amount you’ve directly contributed (not the earnings) at any time, for any reason, without taxes or penalties, because you already paid tax on that money. And unlike a traditional 401(k), a Roth IRA never forces required withdrawals during your lifetime — the money can keep compounding tax-free for as long as you leave it alone.\n\nThe catch: the Roth IRA’s annual contribution limit is much smaller than the 401(k)’s — a few thousand dollars a year, adjusted for inflation most years, versus a limit on the 401(k) side that runs roughly three times higher. For most people starting out, that smaller limit isn’t a real constraint yet.',
      },
      {
        heading: 'Where the 401(k) pulls back ahead',
        body: 'Once you’re maxing out the Roth IRA and still have money left to invest, the 401(k)’s much higher contribution ceiling makes it the next place to put savings. It’s also fully automatic — money leaves your paycheck before you ever see it, which removes the willpower problem entirely.\n\nThere’s a tax-bracket argument too: a traditional 401(k) contribution reduces your taxable income this year. Early in your career, in a lower tax bracket, that deduction is worth less than it will be later when you’re earning more — which is part of why Roth (pay tax now, at your current low rate) tends to make more sense early on, while leaning traditional can make more sense once your income climbs.',
      },
      {
        heading: 'The Roth IRA income limit — the fine print that rarely applies to beginners',
        body: 'Roth IRA eligibility phases out once your income crosses a fairly high threshold (adjusted yearly, but it starts well into six figures for a single filer). If you’re earning typical entry-level or early-career wages, you’re nowhere near that cutoff, so this isn’t something to worry about yet — just something to know exists for later, when a raise might actually put you near it.',
      },
      {
        heading: 'Your checklist: the funding order',
        body: '1. Contribute enough to your 401(k) to get the full employer match — this comes before everything else.\n2. Open a Roth IRA (any major brokerage, no employer needed) and contribute up to the annual limit if your income qualifies.\n3. Still have money to invest? Go back and increase your 401(k) contributions past the match, toward its higher limit.\n4. Each time you get a raise, bump your contribution percentage up too, so your savings rate grows with your income instead of staying flat.\n5. Automate all of it — paycheck deduction for the 401(k), a recurring transfer for the Roth IRA — so the right amount moves before you can spend it.',
      },
    ],
    relatedTerms: ['ETF', 'Index Investing', 'Mutual Fund', 'Diversification', 'Dollar-Cost Averaging'],
    faq: [
      {
        q: 'Should I pick Roth or traditional for my 401(k)?',
        a: 'If your employer offers both, Roth 401(k) tends to make more sense early in your career when you’re likely in a lower tax bracket than you will be later — you pay tax now, at today’s lower rate, and everything grows tax-free after that.',
      },
      {
        q: 'Can I contribute to both a Roth IRA and a 401(k) in the same year?',
        a: 'Yes — they’re separate accounts with separate limits, and using both is exactly the strategy described above: match first, then Roth IRA, then back to the 401(k).',
      },
      {
        q: 'What happens to my employer match if I leave the job early?',
        a: 'Matched funds are often subject to a vesting schedule, meaning you may need to stay a certain number of years before the match is fully yours. Check your plan’s vesting schedule before assuming every matched dollar is guaranteed if you might leave soon.',
      },
      {
        q: 'Is a Roth IRA really better than a 401(k) for someone in their 20s?',
        a: 'Not strictly "better" — they serve different jobs. The Roth IRA usually gives you more investment choice and flexibility, while the 401(k) offers a higher contribution limit and, critically, the employer match. The right approach uses both, in order.',
      },
    ],
  },
  {
    slug: 'emergency-fund-before-investing',
    title: 'How Much Emergency Fund Do You Need Before You Start Investing?',
    metaTitle: 'Emergency Fund Before Investing: How Much You Actually Need',
    description:
      'Save first or invest first? Here’s the real order — how big your emergency fund needs to be, where to keep it, and when it’s actually safe to start investing.',
    date: '2026-07-14',
    category: 'Saving',
    intro:
      'Everyone tells you to “invest early” and everyone tells you to “build an emergency fund” — and almost nobody explains which one comes first. Get the order wrong and a busted laptop, a lost shift, or a fender bender can force you to sell investments at the worst possible moment, or send you reaching for a credit card at 20%+ interest instead. Here’s the actual sequence, with real numbers attached.',
    sections: [
      {
        heading: 'Why the order matters more than the amount',
        body: 'The stock market and an emergency fund solve two different problems, and mixing them up is where people get hurt. Investments are for money you won’t need for years — they’re allowed to drop 20%, 30%, even more in a bad stretch, because you have time to wait it out. An emergency fund is for money you might need next week, so it has to be there, fully intact, on the day you need it.\n\nIn March 2020 the S&P 500 fell more than 30% in about a month. In 2008 it lost roughly half its value over about a year and a half. Both crashes hit right alongside waves of layoffs — meaning the exact moment a lot of people needed cash most was the exact moment their portfolios were down the most. Anyone who had to sell stocks to cover rent that month locked in the loss permanently. An emergency fund exists so you’re never that person.',
      },
      {
        heading: 'The starter fund: $500–$1,000 before anything else',
        body: 'You don’t need six months of expenses saved before you’re allowed to invest a single dollar — that would take most young people years and isn’t realistic advice. What you need first is a small starter cushion, commonly recommended in the $500–$1,000 range, sitting in a savings account and untouched.\n\nThat amount won’t cover a job loss, but it covers the stuff that actually happens most: a car repair, a phone screen, a dentist bill, a security deposit. Without it, those normal-life expenses go on a credit card, and credit card interest (often north of 20% APR) will out-cost almost anything the stock market can earn you. Build the starter fund first — it’s the cheapest insurance you’ll ever buy.',
      },
      {
        heading: 'The real target: 3–6 months of essential expenses',
        body: 'Once the starter fund is in place, the next milestone — usually reached gradually, alongside investing rather than before it — is 3 to 6 months of essential expenses. Essential means rent, groceries, phone, insurance, minimum debt payments — not your whole income, and not takeout and concert tickets.\n\nWhere you land in that 3–6 month range depends on how stable your income is and how big your safety net is. A student living at home with a part-time job and parents who’d catch a real emergency can reasonably aim for the lower end, even 1–2 months. Someone fully on their own with irregular freelance or gig income should aim for the higher end, because their income itself is the risk, not just unexpected expenses.',
      },
      {
        heading: 'Where the fund lives: not your brokerage account',
        body: 'An emergency fund belongs in a high-yield savings account (HYSA) at an online bank, not in stocks, not in crypto, and not sitting uninvested in a brokerage account either. The whole point is liquidity — being able to withdraw it in a day or two with zero chance the balance is lower than you left it.\n\nA regular checking account at a big brick-and-mortar bank often pays close to nothing in interest, while online high-yield savings accounts have historically paid several times more — money that would otherwise be lost to inflation quietly eating your purchasing power. Look for a bank that’s FDIC-insured, which protects deposits up to $250,000 per depositor, per bank — so for an emergency fund, insurance risk isn’t something you need to worry about.',
      },
      {
        heading: 'Can you build savings and invest at the same time?',
        body: 'Mostly yes, with one exception that jumps the line: if a job offers a 401(k) match, grab the free match money first — it’s a guaranteed return no savings account can compete with — then redirect focus to finishing the starter fund and the full 3–6 month target before ramping up other investing.\n\nOne overlooked detail: Roth IRA contributions (not the earnings on them) can technically be withdrawn at any time, tax- and penalty-free, since you already paid tax on that money going in. That makes a Roth IRA a legitimate backup layer — but it shouldn’t be your primary emergency fund, because pulling money out during a market downturn means selling investments at a loss and losing years of future tax-free compounding. Treat it as a last resort, not the plan.',
      },
      {
        heading: 'Your checklist',
        body: '1. Build a $500–$1,000 starter fund in a savings account before investing anything beyond a 401(k) match.\n2. Add up your true essential monthly expenses — rent, food, phone, insurance, minimum debt payments.\n3. Set a target of 3–6 months of that number, scaled toward the lower end if you have a strong safety net, higher if your income is unstable.\n4. Park the fund in an FDIC-insured, high-yield savings account — never in the stock market.\n5. Once the target is hit, redirect that monthly savings amount into investing instead, and let the emergency fund just sit there, boring and untouched, doing its job.',
      },
    ],
    relatedTerms: ['Liquidity', 'Inflation', 'Diversification', 'Bond', 'Index Investing'],
    faq: [
      {
        q: 'Should I pay off debt, save an emergency fund, or invest first?',
        a: 'A common order: build a small $500–$1,000 starter fund, grab any employer 401(k) match if you have one, pay down high-interest debt (credit cards, generally anything above ~7–8% interest), then finish the full 3–6 month emergency fund, then invest more seriously.',
      },
      {
        q: 'Is it bad to invest before you have an emergency fund?',
        a: 'It’s risky rather than strictly “bad” — the danger is being forced to sell investments during a downturn to cover a surprise expense, which locks in a loss instead of letting the market recover.',
      },
      {
        q: 'Where should I keep my emergency fund?',
        a: 'In an FDIC-insured high-yield savings account at an online bank. It needs to be liquid and stable, not invested — a regular checking account usually pays too little interest, and the stock market can drop right when you need the cash.',
      },
      {
        q: 'Can a Roth IRA be my emergency fund?',
        a: 'You can technically withdraw your own contributions from a Roth IRA anytime without tax or penalty, but using it as your main emergency fund means risking having to sell investments at a loss during a downturn — better as a backup than a primary plan.',
      },
    ],
  },
]
