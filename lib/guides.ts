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
  {
    slug: 'pay-off-student-loans-or-invest-first',
    title: 'Should You Pay Off Student Loans or Invest First?',
    metaTitle: 'Student Loans or Investing First? How to Decide',
    description:
      'Extra cash and a student loan balance — should it go toward payoff or a Roth IRA? Here’s the actual math, and why the interest rate is the real deciding factor.',
    date: '2026-07-15',
    category: 'College Money',
    intro:
      'You’ve got a little extra cash after rent and the minimum loan payment, and two people are yelling in your ear — one says “kill the debt,” the other says “time in the market is everything, invest now.” Both are half right. The real answer depends on one number you can look up in five minutes: your interest rate.',
    sections: [
      {
        heading: 'It’s not either/or — it’s a math problem',
        body: 'Paying off a loan early gives you a guaranteed return equal to that loan’s interest rate, because every dollar of principal you erase is a dollar of interest you’ll never pay. Investing gives you a return that’s historically higher on average — the stock market has returned roughly 10% a year before inflation over long stretches — but that return isn’t guaranteed in any single year, and it can be negative for years at a time.\n\nSo the decision isn’t “debt vs. investing” as a personality trait. It’s comparing a guaranteed number against an uncertain-but-usually-better one, and the size of the gap between them is what should actually move your money.',
      },
      {
        heading: 'Before either one: grab the free money',
        body: 'If your job offers a 401(k) match, contribute enough to get the full match before sending extra money toward loans or a Roth IRA. A match is often an instant 50%–100% return on whatever you put in — no loan payoff and no stock return can compete with that. This step comes first, full stop, no matter what your loan rate is.',
      },
      {
        heading: 'Federal loans come with safety nets that private loans don’t',
        body: 'Before deciding where extra cash goes, know what kind of loan you actually have — it changes the calculation. Federal student loans (Direct Loans) come with income-driven repayment plans that cap your monthly payment as a percentage of income, deferment and forbearance options if you lose your job, and — for people working full-time in government or qualifying nonprofit jobs — Public Service Loan Forgiveness, which wipes out the remaining balance tax-free after 10 years of qualifying payments.\n\nPrivate loans typically have none of this. They’re also why refinancing federal loans into a private loan for a lower rate is a bigger decision than it sounds — you’re trading away those federal protections permanently in exchange for a rate, so it only makes sense if you’re confident you won’t need the safety net.',
      },
      {
        heading: 'The interest rate is the real dividing line',
        body: 'As a general guideline, loans sitting at a high interest rate — the kind of rate you sometimes see on private student loans or unsubsidized loans taken out in higher-rate years — behave like a debt that’s expensive enough that paying it off early is close to a guaranteed win, hard for the market to reliably beat once you account for the uncertainty.\n\nLoans in a more moderate range are more of a genuine toss-up. Over long time horizons the stock market’s historical average return has tended to beat those rates, which is why many young borrowers with lower-rate federal loans choose to invest extra cash instead of rushing to pay off every dollar early. There’s no single cutoff that’s right for everyone — it depends on your rate, your risk tolerance, and how much the guaranteed-payoff feeling of being debt-free is worth to you personally, which is a real, valid factor even if it’s not strictly mathematical.',
      },
      {
        heading: 'Extra payments still count, even if you split the difference',
        body: 'You don’t have to pick one lane entirely. A common approach: keep making minimum payments on every loan (missing those hurts your credit and can trigger fees no matter the rate), then split whatever’s left over between extra principal payments and a Roth IRA or index fund, weighted toward whichever side your interest rate favors.\n\nOne detail worth knowing: extra payments on a loan should be directed at principal, not just "next month’s payment" — check with your loan servicer that extra payments are actually reducing principal, otherwise some servicers apply them toward future interest first, which barely moves the needle.',
      },
      {
        heading: 'Your checklist',
        body: '1. Get any employer 401(k) match in full before anything else.\n2. Know what type of loan you have — federal loans carry protections (income-driven repayment, forgiveness options) that are worth factoring in before rushing to pay them off or refinance them away.\n3. Look up your actual interest rate — higher rates lean toward payoff, lower rates lean toward investing.\n4. Keep minimum payments current on every loan no matter what else you’re doing with extra cash.\n5. If you’re unsure, split extra money between extra principal payments and a Roth IRA rather than going all-in on either side.',
      },
    ],
    relatedTerms: ['Index Investing', 'Dollar-Cost Averaging', 'Diversification', 'Inflation', 'Bond'],
    faq: [
      {
        q: 'Is it smarter to pay off student loans or invest in a Roth IRA?',
        a: 'Compare your loan’s interest rate to what you’d realistically expect from investing. Higher-rate loans usually favor payoff since it’s a guaranteed return; lower-rate loans often favor investing since the market’s long-term average return tends to be higher, though never guaranteed.',
      },
      {
        q: 'Should I refinance my federal student loans for a lower rate?',
        a: 'Be careful — refinancing federal loans into a private loan permanently gives up income-driven repayment, deferment/forbearance options, and forgiveness programs like PSLF. It can make sense if you’re confident you won’t need those protections, but it’s not a decision to make on rate alone.',
      },
      {
        q: 'What counts as a “high” student loan interest rate?',
        a: 'There’s no universal cutoff, but many people use roughly 7–8% and above as the range where paying off debt early starts to look like a clearly better guaranteed return than investing, with anything meaningfully lower being more of a genuine toss-up.',
      },
    ],
  },
  {
    slug: 'how-to-build-credit-with-no-credit-history',
    title: 'How Do You Build Credit With No Credit History?',
    metaTitle: 'How to Build Credit With No Credit History: A Real Plan',
    description:
      'The credit catch-22 — you need credit to get credit — has actual workarounds. Here’s how to build a score from zero using real, beginner-friendly accounts.',
    date: '2026-07-18',
    category: 'Credit',
    intro:
      'Nobody hands you a credit score at birth — you build one from nothing, and almost every legit way to start requires "credit" you don’t have yet. That’s the catch-22 everyone complains about. It’s also completely solvable in a semester or two if you use the right tools instead of guessing. Here’s the actual mechanics, not vibes.',
    sections: [
      {
        heading: 'What a credit score actually measures',
        body: 'A credit score is a three-digit number (300–850 on the two most common scoring models, FICO and VantageScore) that predicts how likely you are to repay borrowed money on time. Lenders use it to decide whether to approve you for a card, a car loan, or an apartment lease — and what interest rate to charge you if they do.\n\nThe number is built from five weighted ingredients: payment history (roughly 35% of a FICO score), amounts owed relative to your limits — called utilization (roughly 30%), length of credit history (roughly 15%), credit mix (roughly 10%), and new credit inquiries (roughly 10%). Notice that the single biggest factor, by a wide margin, is simply not missing payments. Everything else is optimization around the edges.',
      },
      {
        heading: 'The fastest start: become an authorized user',
        body: 'If a parent or trusted relative has a credit card with a long, clean payment history, they can add you as an authorized user — you get a card with your name on it, but they remain legally responsible for the bill. Most major issuers (Chase, Amex, Discover, Capital One, and others) report the full account history to the credit bureaus under your name too, which means their years of on-time payments can start showing up on your credit report the next reporting cycle.\n\nThis only helps if the primary account is actually in good shape — high balances or missed payments on that card can drag your score down just as easily. Ask to see the card’s utilization and payment record before agreeing to be added, and you don’t even need to carry or use the physical card for it to count.',
      },
      {
        heading: 'Build your own file: secured cards, student cards, and credit-builder loans',
        body: 'A secured credit card is the standard starting point if nobody can add you as an authorized user. You put down a refundable cash deposit — often $200–$500 — and that becomes your credit limit. You use it like a normal card and pay the bill in full each month; the issuer reports your activity to the bureaus exactly like an unsecured card. After 6–12 months of on-time payments, many issuers upgrade you to a regular unsecured card and refund the deposit.\n\nStudent credit cards are a second option once you’re enrolled in college — they’re unsecured (no deposit) but come with lower limits and are specifically underwritten for people with thin or no credit files.\n\nA credit-builder loan, offered by many credit unions and a few fintech apps, works almost backwards from a normal loan: the "loan" amount sits locked in a savings account while you make fixed monthly payments toward it. Each on-time payment gets reported to the bureaus, and once you’ve paid it off, the money (plus any interest earned) is released to you. It builds payment history without ever requiring you to be extended real credit up front.',
      },
      {
        heading: 'The rules that trip people up before 21',
        body: 'Under the federal CARD Act, you generally need to be 18 to open a credit card in your own name — and if you’re under 21, card issuers are required to see proof of independent income or a cosigner before approving you. "Independent income" can include a job, but allowance or money from a parent usually doesn’t count on the application.\n\nOnce you do have a card, keep utilization low — using more than about 30% of your limit on any card, even if you pay it off in full every month, can drag your score down because issuers report the balance at your statement closing date, not after you pay. Many people who pay in full still get dinged for this without realizing why. Paying down the balance a few days before the statement closes (not just before the due date) keeps the reported utilization low.',
      },
      {
        heading: 'The myth that won’t die: does checking your own score hurt it?',
        body: 'No — and this is worth repeating because it stops people from ever looking. Checking your own credit score or report is called a soft inquiry, and it has zero effect on your score, no matter how often you do it. Apps from your bank, Credit Karma, and similar free tools all use soft pulls.\n\nWhat does cause a small, temporary dip is a hard inquiry — when a lender checks your credit because you formally applied for a new account (a card, a loan, an apartment in some states). A single hard inquiry typically costs a few points and its effect fades within a few months, though it stays visible on your report for about two years. Applying for five credit cards in a week is a real problem; checking your own score every day is not.',
      },
      {
        heading: 'Your checklist',
        body: '1. Ask a parent or relative with a clean, low-balance card if you can be added as an authorized user — the easiest, fastest option if it’s available.\n2. No authorized-user option? Open a secured card or student card and treat it like debit — never spend more than you can pay off in full.\n3. Set every card to autopay the full statement balance so you never miss a due date by accident.\n4. Keep reported utilization under 30% (ideally under 10%) by paying down balances before the statement closing date, not just the due date.\n5. Check your score for free as often as you want — it’s a soft inquiry and never lowers it.\n6. Avoid applying for multiple new accounts in a short window — each application is a hard inquiry that dings you slightly.',
      },
    ],
    relatedTerms: ['Credit Rating', 'Federal Reserve', 'Liquidity', 'Inflation'],
    faq: [
      {
        q: 'How long does it take to build a credit score from nothing?',
        a: 'Scoring models generally need at least 6 months of reported activity on at least one account before they can generate a score. A usable score for most purposes typically takes 6–12 months of consistent on-time payments.',
      },
      {
        q: 'Does checking your credit score lower it?',
        a: 'No. Checking your own score or report is a soft inquiry and never affects your score, no matter how often you do it. Only hard inquiries — triggered when you apply for new credit — cause a small, temporary dip.',
      },
      {
        q: 'Is a secured credit card worth it if I have no credit history?',
        a: 'Yes, for most people it’s the most reliable starting point. You get a real credit card that reports to all three bureaus, and after months of on-time payments many issuers refund your deposit and upgrade you to an unsecured card.',
      },
      {
        q: 'Can I build credit without a credit card?',
        a: 'Yes — credit-builder loans (offered by many credit unions and some fintech apps) and, in some cases, rent or subscription reporting services let you build payment history without ever carrying a card.',
      },
    ],
  },
  {
    slug: 'what-is-a-529-plan-worth-it',
    title: 'What Is a 529 Plan, and Is It Actually Worth It for College Savings?',
    metaTitle: '529 Plan Explained: How It Works and Whether It’s Worth It',
    description:
      'A 529 plan grows college savings tax-free — but only if you use it right. Here’s how the tax break works, what counts as a qualified expense, and what happens if plans change.',
    date: '2026-07-20',
    category: 'College Money',
    intro:
      'Somebody — a parent, a grandparent, maybe you — opened a "529" for college and you’ve been nodding along ever since without really knowing what it does. Here’s the actual mechanics: what the tax break is worth, what you’re allowed to spend it on, and what happens to the money if life doesn’t go according to plan.',
    sections: [
      {
        heading: 'What a 529 plan actually is',
        body: 'A 529 plan is a state-sponsored investment account built specifically for education costs. You put money in, it gets invested — usually in a mix of mutual funds or index funds, often in an "age-based" portfolio that automatically shifts from stocks toward bonds as college gets closer — and it grows over time, same as any other investment account.\n\nThe difference is the tax treatment on the way out. Withdrawals used for qualified education expenses come out completely federal-tax-free, including all the growth. Every state offers at least one 529 plan, and — this trips people up — you’re not required to use your own state’s plan. You can open a 529 in Utah while living in Texas and use the money at a college in New York. The plan’s home state barely matters; where the student ends up going to school doesn’t need to match it either.',
      },
      {
        heading: 'The tax break, in two layers',
        body: 'Layer one, federal: contributions are not federally tax-deductible — this money goes in after-tax, like a Roth account. But once it’s in, it grows completely tax-free, and qualified withdrawals owe no federal tax on any of the gains. Compounding that’s never taxed, for 10, 15, 18 years, adds up.\n\nLayer two, state: many states offer their own income tax deduction or credit for contributions, on top of the federal treatment — but usually only if you contribute to that state’s own plan. A handful of states offer the deduction no matter which state’s plan you use, and a few states have no state income tax at all, making the question moot. Before picking a plan, it’s worth checking what your own state actually offers, since that deduction is essentially free money layered on top of the federal benefit.\n\n529s also get a special gifting rule: normally, gifts above the annual per-person gift-tax exclusion (an amount that adjusts most years, generally in the high five-figure range for a couple) can trigger paperwork with the IRS. 529 plans let a contributor "superfund" the account — front-loading five years’ worth of that annual exclusion in one lump sum without it counting against their lifetime gift tax exemption. It’s a specific tool for grandparents or relatives who want to drop a large one-time gift in early.',
      },
      {
        heading: 'What counts as a qualified expense (and what doesn’t)',
        body: 'Qualified higher-education expenses cover more than just tuition: room and board (if enrolled at least half-time), required fees, books, supplies, and even a computer if it’s needed for coursework. It applies to community college, trade and vocational schools, and graduate programs — not just traditional four-year universities.\n\nA less-known piece: up to $10,000 per year, per student, can also be used tax-free for K-12 tuition at a public, private, or religious school — the "529" isn’t exclusively a college account, even though that’s how almost everyone talks about it.\n\nWhat doesn’t count: transportation, health insurance, and application or testing fees (SAT/ACT prep, application fees) generally aren’t qualified expenses. Withdraw money for a non-qualified expense and the earnings portion of that withdrawal (not your original contributions) owes ordinary income tax, plus a 10% federal penalty on top.',
      },
      {
        heading: 'What if your kid doesn’t go to college, or gets a scholarship?',
        body: 'This is the objection everyone raises before opening one, and it’s more solvable than people think. First, a 529 has no expiration date and the beneficiary can be changed at any time to another family member — a sibling, a cousin, even the account owner themselves — with no tax consequence. Plans change; the account doesn’t have to sit frozen.\n\nSecond, if the beneficiary gets a scholarship, the 10% penalty is waived on a withdrawal up to the scholarship amount — you’d still owe ordinary income tax on the earnings portion, but not the extra penalty. The account isn’t punishing you for winning free money.\n\nThird, since a 2024 rule change, unused 529 funds can be rolled directly into a Roth IRA for the same beneficiary — up to $35,000 over that person’s lifetime — without the usual early-withdrawal tax or penalty. The catches: the 529 account must have existed for at least 15 years, contributions made in the last five years generally aren’t eligible for the rollover, and each year’s rollover still counts against that year’s normal Roth IRA contribution limit. It’s not a blank check, but it means "unused college money" no longer has to mean "wasted money."',
      },
      {
        heading: 'How a 529 affects financial aid',
        body: 'A 529 owned by a parent counts as a parental asset on the FAFSA, and parental assets are assessed at a fairly gentle rate — generally a small single-digit percentage of the account’s value counted toward the student’s expected contribution each year, far lower than the rate applied to assets held directly in the student’s own name.\n\nGrandparent-owned 529 accounts used to be treated more harshly under old FAFSA rules, but recent FAFSA simplification changed that: distributions from a grandparent-owned 529 no longer have to be reported as student income. That was a real fix — it used to quietly tank aid eligibility the year a grandparent’s account got tapped, and most families never saw it coming.',
      },
      {
        heading: 'Your checklist',
        body: '1. Check whether your state offers an income tax deduction or credit for 529 contributions, and whether it requires using your own state’s plan.\n2. Pick a plan with low fees and a sensible age-based portfolio — you’re not trying to beat the market here, just grow money tax-free on a predictable timeline.\n3. Automate contributions, even small ones — time in the account matters more than the size of any single deposit.\n4. Keep receipts and records of qualified expenses (tuition statements, room and board costs) in case a withdrawal is ever questioned.\n5. If the original beneficiary doesn’t use all the money, remember your options before assuming it’s wasted: change the beneficiary, use the scholarship exception, or roll up to $35,000 into a Roth IRA once the account is old enough.',
      },
    ],
    relatedTerms: ['Roth IRA', 'Compound Interest', 'Index Investing', 'Mutual Fund', 'Diversification'],
    faq: [
      {
        q: 'What happens to a 529 plan if my kid doesn’t go to college?',
        a: 'You have options — change the beneficiary to another family member with no tax hit, use the scholarship exception to skip the penalty (though earnings are still taxed), or roll up to $35,000 over the beneficiary’s lifetime into a Roth IRA if the account is at least 15 years old.',
      },
      {
        q: 'Is a 529 plan better than a regular savings account for college?',
        a: 'For money you’re confident will go toward education, yes — the tax-free growth on qualified withdrawals is hard to beat. The tradeoff is flexibility: pulling money out for non-education expenses triggers income tax plus a 10% penalty on the earnings.',
      },
      {
        q: 'Do grandparents’ 529 contributions hurt financial aid?',
        a: 'Not as much as they used to. Under simplified FAFSA rules, distributions from a grandparent-owned 529 no longer count as student income, removing what used to be a common aid-eligibility surprise.',
      },
      {
        q: 'Do I have to use my own state’s 529 plan?',
        a: 'No — you can open and use any state’s 529 plan for a school in any state. The main reason to stick with your own state’s plan is if it offers a state income tax deduction that’s only available for in-state plans.',
      },
    ],
  },
  {
    slug: 'how-credit-card-interest-actually-works',
    title: 'How Does Credit Card Interest Actually Work — and Why Is the Minimum Payment a Trap?',
    metaTitle: 'How Credit Card Interest Works (and the Minimum Payment Trap)',
    description:
      'Credit card interest compounds daily, not monthly — and the minimum payment is designed to keep you paying for years. Here’s the actual math.',
    date: '2026-07-21',
    category: 'Credit',
    intro:
      'You paid the minimum, the balance barely moved, and you can’t figure out why. It’s not bad luck — it’s how the math is built. Here’s exactly how credit card interest is calculated, why the grace period is the only real “free” window you get, and why the minimum payment is one of the worst deals in personal finance if you don’t understand it.',
    sections: [
      {
        heading: 'APR isn’t the number that hits your balance — the daily rate is',
        body: 'Your card’s Annual Percentage Rate (APR) is the yearly sticker number, but issuers don’t charge it once a year. They divide it by 365 to get a daily periodic rate, then apply that rate to your balance every single day and add it to what you owe — a process called daily compounding.\n\nSay your APR is 24%. Divide by 365 and the daily rate is about 0.066%. On a $1,000 balance, day one adds roughly $0.66 in interest. That doesn’t sound like much, but tomorrow’s interest is calculated on $1,000.66, not $1,000 — interest earning interest, working against you instead of for you. Over a full statement cycle, this is why the number on your bill is always a little higher than a simple "APR ÷ 12" monthly estimate would suggest.',
      },
      {
        heading: 'The grace period: the only way to pay $0 in interest',
        body: 'Almost every credit card gives you a grace period — typically around 21 to 25 days between the end of your statement and the payment due date — during which no interest is charged on new purchases, but only if you paid last month’s statement balance in full.\n\nThis is the single most important switch in how credit cards work: pay the full statement balance every month, and you use the card’s convenience for free. Carry any balance past the due date, and the grace period disappears — interest starts accruing daily on new purchases immediately, with no free window, until you pay the full balance again for a full cycle.',
      },
      {
        heading: 'Why the minimum payment is designed to keep you paying',
        body: 'Most issuers set the minimum payment as whichever is larger: a small percentage of your balance (commonly in the 1%–3% range) or a flat floor (often around $25–$35). That percentage-based structure is the trap — as your balance shrinks, so does your required payment, which stretches payoff out for years.\n\nHere’s the shape of it: a $3,000 balance at a 24% APR, paying only the minimum each month, can easily take well over a decade to clear and cost more in interest than the original purchases were worth. Federal law actually forces issuers to show you this — the CARD Act of 2009 requires every statement to include a "Minimum Payment Warning" box disclosing how many years it would take to pay off the balance at the minimum, the total interest you’d pay doing that, and what a fixed payment would need to be to clear it in 3 years instead. Read that box. It’s the most honest number on the entire statement.',
      },
      {
        heading: 'Cash advances break even these rules',
        body: 'Using a credit card to withdraw cash is a different, worse product wearing the same card. Cash advances usually carry their own higher APR than purchases, charge an upfront fee (often 3%–5% of the amount, or a flat minimum), and — critically — get no grace period at all. Interest starts compounding the moment the cash advance posts, even if you pay your bill in full that month.\n\nThe same is often true of using a credit card to pay for things like a cash equivalent — buying gift cards, wiring money, or funding certain payment apps can sometimes be coded as a cash advance without you realizing it until the fee shows up.',
      },
      {
        heading: 'How to actually get ahead of it',
        body: 'If you’re carrying a balance, paying more than the minimum every month is the single highest-leverage move you can make — every extra dollar above the minimum goes straight at principal, which shrinks the balance that tomorrow’s interest is calculated on. Two common strategies for tackling more than one card: the avalanche method (pay extra toward whichever card has the highest APR first, mathematically the fastest and cheapest) and the snowball method (pay extra toward the smallest balance first, for the psychological win of closing an account sooner). Both work — avalanche saves more money, snowball keeps more people motivated enough to finish.\n\nIf a balance already feels unmanageable, a 0% APR balance transfer card (usually with a transfer fee of 3%–5% of the amount moved) can pause interest for a promotional window, often 12–18 months, giving you a real shot at paying down principal instead of treading water.',
      },
      {
        heading: 'Your checklist',
        body: '1. Pay your full statement balance, not just the minimum, every single cycle to keep the interest-free grace period alive.\n2. If you can’t pay in full, pay as far above the minimum as you can — every extra dollar attacks principal directly.\n3. Find the "Minimum Payment Warning" box on your statement and actually read the years-to-payoff number.\n4. Never treat a credit card as a source of cash — cash advances skip the grace period and add extra fees on top of a higher APR.\n5. Carrying multiple balances? Pick avalanche (highest APR first) if you want the cheapest path, or snowball (smallest balance first) if you need momentum to stay motivated.',
      },
    ],
    relatedTerms: ['Credit Rating', 'Federal Reserve', 'Compound Interest', 'Liquidity'],
    faq: [
      {
        q: 'Does credit card interest compound daily or monthly?',
        a: 'Daily. Issuers divide your APR by 365 to get a daily periodic rate, apply it to your balance every day, and add that interest to the balance the next day’s calculation is based on — which is why paying late even by a few days adds up faster than a simple monthly estimate suggests.',
      },
      {
        q: 'Why did my balance barely go down after I paid the minimum?',
        a: 'Because most of that payment covered the interest that had already accrued, leaving only a small amount to reduce the actual principal — and since the minimum is often a small percentage of the balance, it shrinks along with the balance, stretching payoff out for years.',
      },
      {
        q: 'Is it bad to only pay the minimum on a credit card?',
        a: 'If you can pay more, yes — paying only the minimum on a revolving balance is one of the most expensive ways to borrow money that exists, often costing more in interest over time than the original purchases. Check your statement’s Minimum Payment Warning box for the exact years and dollars it would take.',
      },
      {
        q: 'What is a credit card grace period?',
        a: 'The window — typically about 21 to 25 days — between your statement closing and your payment due date, during which no interest accrues on new purchases, but only if you paid the previous statement balance in full. Carry a balance and the grace period disappears until you pay in full again.',
      },
    ],
  },
]
