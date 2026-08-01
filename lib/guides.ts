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
  {
    slug: 'taxes-on-gig-work-1099-income',
    title: 'Do You Have to Pay Taxes on DoorDash, Uber, or Freelance Income?',
    metaTitle: '1099 Gig Work Taxes: DoorDash, Uber & Freelance Explained',
    description:
      'Gig apps don’t withhold taxes like a real job does — you owe self-employment tax and have to pay it yourself, often quarterly. Here’s exactly how much and when.',
    date: '2026-07-22',
    category: 'Paychecks & Taxes',
    intro:
      'Your DoorDash or Uber app shows you making decent money, and nothing ever seems to come out of it — which feels like a win until tax season, when you realize the IRS still wants its cut and nobody withheld it for you. Gig and freelance income is taxed differently from a W-2 job in almost every way: no automatic withholding, an extra tax most employees never think about, and a payment schedule that can come four times a year instead of once. Here’s the actual mechanics, with real numbers.',
    sections: [
      {
        heading: 'Why nothing gets withheld — you’re not an employee',
        body: 'When you drive for Uber, deliver for DoorDash, or freelance for clients, the company doesn’t treat you as an employee — you’re an independent contractor. That distinction is the whole ballgame: employers withhold taxes from a W-2 paycheck automatically, but nobody withholds anything from a 1099 payment. The full amount just lands in your account, taxes and all still your responsibility.\n\nIf a single platform or client pays you $600 or more in a year, they’re required to send you a 1099-NEC form in January summarizing what they paid you — but that form is just a record. You owe tax on every dollar of gig or freelance income you earn, even from platforms that never send you a form because you stayed under their reporting threshold.',
      },
      {
        heading: 'The self-employment tax: FICA’s evil twin',
        body: 'On a W-2 job, you and your employer each pay half of Social Security and Medicare taxes — 7.65% comes out of your paycheck, and your employer quietly pays the other 7.65% on top. As a 1099 worker, there’s no employer half. You’re both the employee and the employer, so you owe the whole thing yourself: a 15.3% self-employment tax (12.4% Social Security + 2.9% Medicare) on your net self-employment earnings, on top of regular income tax.\n\nThere’s one break built in: you get to deduct half of that self-employment tax — the “employer-equivalent” portion — from your taxable income when you file. It doesn’t erase the tax, but it softens the hit a little.',
      },
      {
        heading: 'The $400 rule: when you legally owe money',
        body: 'Regular federal income tax only kicks in once your total income clears the standard deduction, same as a W-2 job. Self-employment tax works completely differently — and has a much lower bar. If your net self-employment earnings (what you made minus legitimate business expenses) hit $400 or more in a year, you’re required to file a return and pay self-employment tax, even if your income is otherwise too low to owe any income tax at all.\n\nThat $400 threshold catches a lot of people off guard. A summer of casual freelancing or a few months of weekend deliveries can clear it easily, which means “I barely made anything” doesn’t exempt you from filing the way it might with a small W-2 paycheck.',
      },
      {
        heading: 'Quarterly estimated taxes: pay-as-you-go, not once a year',
        body: 'Because nothing gets withheld along the way, the IRS expects gig and freelance workers who’ll owe a meaningful amount to pay estimated taxes four times a year rather than in one lump sum the following April — roughly in mid-April, mid-June, mid-September, and mid-January, though exact dates shift slightly when they land on a weekend or holiday. Skip this and wait until you file, and you can owe an underpayment penalty on top of the tax itself, even if you pay the full balance by the deadline.\n\nThe practical fix most gig workers use: every time you get paid, immediately set aside a percentage — commonly cited in the 25–30% range to cover both self-employment tax and income tax — into a separate savings account you don’t touch. Treat that slice as never having been yours in the first place, and the quarterly payment stops being a scramble.',
      },
      {
        heading: 'The upside: deductions W-2 employees don’t get',
        body: 'Being 1099 isn’t all downside. Because you’re running a small business in the IRS’s eyes, you can deduct legitimate business expenses from your income before either tax applies — for a driver or delivery worker, that often includes mileage (the IRS sets a standard per-mile rate each year that you can use instead of tracking actual gas and maintenance costs), a hot bag or phone mount, and the business-use portion of your phone bill. For a freelancer, it might mean software subscriptions, a portion of home internet, or equipment bought specifically for the work.\n\nKeep records as you go — a simple mileage log or spreadsheet is enough — because deductions you can’t document if questioned don’t hold up. One more upside: 1099 income counts as earned income just like a W-2 paycheck, which means it qualifies you to contribute to a Roth IRA, and if you treat the gig work as a real small business, you may also have access to self-employed retirement accounts like a SEP-IRA with much higher contribution limits than a regular Roth.',
      },
      {
        heading: 'Your checklist',
        body: '1. Every time you get paid, transfer 25–30% into a separate savings account earmarked for taxes — never spend from it.\n2. Track mileage and business expenses as you go, not from memory in April.\n3. If you expect to owe a meaningful amount, pay quarterly estimated taxes rather than waiting until the annual deadline.\n4. Save every 1099-NEC you receive, but remember you owe tax on all gig income even from platforms that don’t send you one.\n5. Since it counts as earned income, route some of it into a Roth IRA — gig money still gets the same decades of tax-free compounding as a W-2 paycheck.\n6. If your gig income grows into a real side business, talk to a tax professional about a SEP-IRA and whether an LLC or additional deductions make sense.',
      },
    ],
    relatedTerms: ['Roth IRA', 'Compound Interest', '401(k)', 'Liquidity'],
    faq: [
      {
        q: 'Do I have to pay taxes on DoorDash or Uber income?',
        a: 'Yes. Gig platforms classify you as an independent contractor, not an employee, so no taxes are withheld — you’re responsible for reporting and paying both income tax and self-employment tax yourself.',
      },
      {
        q: 'What is self-employment tax?',
        a: 'A 15.3% tax covering Social Security and Medicare that self-employed and gig workers pay themselves, since there’s no employer to cover the other half the way there is on a W-2 job. It applies once your net self-employment earnings reach $400 in a year.',
      },
      {
        q: 'Do I owe taxes if a gig platform never sent me a 1099?',
        a: 'Yes. Platforms are only required to send a 1099-NEC once they’ve paid you $600 or more in a year, but you owe tax on all your gig or freelance income regardless of whether you receive a form.',
      },
      {
        q: 'How much should I set aside from gig income for taxes?',
        a: 'A commonly used rule of thumb is 25–30% of each payment, covering both self-employment tax and income tax, moved into a separate savings account so it’s never mixed in with spending money.',
      },
    ],
  },
  {
    slug: 'does-buy-now-pay-later-affect-credit-score',
    title: 'Does Buy Now, Pay Later (Klarna, Afterpay) Affect Your Credit Score?',
    metaTitle: 'Does BNPL (Klarna, Afterpay) Affect Your Credit Score?',
    description:
      'Splitting purchases into four payments feels harmless — but the credit impact of Klarna, Afterpay, and Affirm is more one-sided than most people realize.',
    date: '2026-07-23',
    category: 'Credit',
    intro:
      'You checked out with Klarna or Afterpay, split an $80 pair of sneakers into four $20 payments, and paid every single one on time — so why didn’t your credit score budge? Buy Now, Pay Later feels like a credit product, gets marketed next to your credit card options at checkout, and even involves something called a “credit check.” But the way it actually touches your credit score is lopsided in a way almost nobody explains upfront.',
    sections: [
      {
        heading: 'How “Pay in 4” actually works',
        body: 'The most common BNPL structure — used by Klarna, Afterpay, Sezzle, and PayPal’s Pay in 4 — splits a purchase into four equal payments, one due at checkout and the other three every two weeks after that, with no interest charged if you pay on schedule. Signing up typically only involves a soft credit check, the kind that doesn’t affect your score, which is part of why approval is fast and available to people with thin or no credit history.\n\nLonger BNPL plans — Affirm’s multi-month financing, or Klarna’s and Afterpay’s pay-in-30/monthly options — work differently. These can charge real interest (sometimes a meaningful APR) and may involve a harder credit check, more like a traditional loan application. Read the terms before you check the box; “buy now, pay later” isn’t always the interest-free version you’re picturing.',
      },
      {
        heading: 'The uncomfortable truth: paying on time usually doesn’t help your score',
        body: 'A traditional credit card reports your payment history to Equifax, Experian, and TransUnion every month — on-time payments are literally what builds your credit score over time. Most short-term “Pay in 4” BNPL loans have historically not been reported to the major bureaus at all, meaning months of perfect, responsible payments can do nothing for your credit file.\n\nThis is shifting: credit bureaus have been building ways to incorporate BNPL activity, and FICO has developed newer scoring models specifically designed to factor it in. But adoption varies by lender and isn’t universal yet, so don’t plan on Pay-in-4 as your credit-building strategy the way you would a secured card or credit-builder loan — check the specific provider’s current policy before assuming it counts.',
      },
      {
        heading: 'The part that CAN hurt you: missed payments and collections',
        body: 'Here’s the asymmetry that catches people off guard: even when on-time payments don’t help your score, missed payments can absolutely hurt it. If you fall behind, most BNPL providers charge a late fee, and if the balance stays unpaid, many will eventually send the debt to a third-party collections agency. A collections account reported to the bureaus is one of the more damaging things that can appear on a credit report, and it can stick around for years.\n\nSo the risk profile is one-sided: pay on time, and it’s often invisible to your credit file; miss payments, and it can show up as real, lasting credit damage. That’s a worse deal than a credit card, where good behavior is rewarded just as visibly as bad behavior is punished.',
      },
      {
        heading: 'The “phantom debt” problem',
        body: 'A credit card gives you one statement and one running balance you can check anytime. BNPL doesn’t work that way — there’s no shared ledger across apps, so three $20 payments due this week from three different BNPL apps don’t show up anywhere together. Each provider only sees its own slice of what you owe.\n\nThis makes it deceptively easy to stack more obligations than you realize, especially since each individual purchase feels small. Consumer researchers and regulators have flagged this “phantom debt” pattern as one of the biggest practical risks of BNPL — not that any single payment plan is dangerous, but that several of them running at once, invisible to each other, can quietly eat a chunk of every paycheck.',
      },
      {
        heading: 'Regulatory protections are still catching up',
        body: 'Because BNPL is newer than credit cards, it hasn’t always come with the same legal protections — like guaranteed dispute rights if a purchase arrives broken or never shows up. Regulators have been working to close that gap; in 2024 the Consumer Financial Protection Bureau issued guidance aimed at extending credit-card-style consumer protections to certain Pay-in-4 loans. The exact protections and how consistently they’re enforced have continued to evolve since then, so treat BNPL purchase protection as generally weaker and less standardized than a credit card’s until you’ve checked the specific provider’s policy.',
      },
      {
        heading: 'Your checklist before you tap “Pay in 4”',
        body: '1. Check whether the specific plan reports to credit bureaus — don’t assume on-time payments are building your credit.\n2. Only use BNPL for a purchase you could pay for in cash today; it’s a payment-timing tool, not a way to afford something you can’t.\n3. Track every open BNPL plan yourself (a notes app or spreadsheet works) since no single app shows your total obligations across providers.\n4. Turn on autopay or calendar reminders for every installment — a missed payment is the one thing that can genuinely hurt your credit.\n5. Read the late-fee and interest terms before checking out, especially for longer financing plans that aren’t simple 4-payment splits.\n6. If you’re trying to actually build credit, use a secured card, student card, or credit-builder loan instead — those are designed and reported for exactly that purpose.',
      },
    ],
    relatedTerms: ['Credit Rating', 'Federal Reserve', 'Liquidity', 'Inflation'],
    faq: [
      {
        q: 'Does Klarna or Afterpay build your credit score?',
        a: 'Usually not, at least not yet. Most short-term Pay-in-4 plans haven’t traditionally been reported to the major credit bureaus, so on-time payments often don’t help your score — though bureau and lender policies on this are evolving, so it’s worth checking the specific provider.',
      },
      {
        q: 'Can Buy Now, Pay Later hurt your credit score?',
        a: 'Yes, if you miss payments. Unpaid BNPL balances are commonly sent to collections agencies, and a collections account on your credit report can significantly damage your score, even if on-time payments on the same plan never helped it.',
      },
      {
        q: 'Is Buy Now, Pay Later the same as a credit card?',
        a: 'No. BNPL is typically a separate short-term installment loan tied to one purchase, often interest-free if paid on time, with a soft credit check at signup. A credit card is a revolving line of credit that reports monthly activity to the bureaus and generally comes with more standardized consumer protections.',
      },
      {
        q: 'How many Buy Now, Pay Later plans can you have at once?',
        a: 'There’s no built-in limit, and no single app shows you your total balance across other BNPL providers — which is exactly the risk. Track your own open plans manually so small payments across multiple apps don’t add up to more than you can cover.',
      },
    ],
  },
  {
    slug: 'what-happens-to-401k-when-you-switch-jobs',
    title: 'What Happens to Your 401(k) When You Quit or Switch Jobs?',
    metaTitle: '401(k) After You Switch Jobs: Rollover, Cash Out, or Leave It?',
    description:
      'Quitting doesn’t erase your 401(k) — but what you do next (rollover, cash out, or leave it) can cost or save you thousands. Here’s the actual mechanics.',
    date: '2026-07-24',
    category: 'Investing',
    intro:
      'You’re leaving a job — or already gone — and there’s a 401(k) balance sitting there that nobody explained what to do with. The money doesn’t disappear, but the choice you make next (or don’t make, since doing nothing is itself a choice) can cost you a chunk of it in taxes and penalties, or quietly keep growing tax-advantaged for another 40 years. Here’s exactly how it works.',
    sections: [
      {
        heading: 'Your four options, ranked from best to worst for most people',
        body: 'When you leave a job, you generally have four moves available for an old 401(k): roll it into your new employer’s 401(k) (if the new plan accepts incoming rollovers), roll it into an IRA of your own, leave it right where it is with the old employer, or cash it out. The first three all keep the money tax-advantaged and growing — you’re choosing where it lives, not whether it survives. The fourth, cashing out, is almost always the worst option financially, for reasons in the next section.\n\nRolling into an IRA is often the most popular choice because it gives you the widest investment menu — a workplace 401(k) usually limits you to a short list of funds the plan picked, while an IRA at any major brokerage can hold nearly any stock, ETF, or index fund. Leaving it with your old employer is the "do nothing" option, and it’s fine short-term, but old 401(k)s are easy to lose track of — multiple job changes over a career can leave you with several forgotten accounts at old employers you barely remember.',
      },
      {
        heading: 'The vesting trap: your match might not fully be yours yet',
        body: 'The money you personally contributed from your paycheck is always 100% yours the moment it lands in the account, no matter when you leave. Your employer’s matching contributions are a different story — many plans attach a vesting schedule to the match, meaning you only fully own it after working there a certain number of years.\n\nTwo common structures: cliff vesting (you own 0% of the match until a specific anniversary — often 3 years — at which point you own 100% all at once) and graded vesting (you own a rising percentage each year, for example 20% per year until fully vested at year 5). Quit before you’re vested and the unvested portion of the match is forfeited back to the plan — it was never fully yours to keep. Before you give notice, it’s worth checking your plan’s vesting schedule and your vesting percentage; timing a departure by even a few weeks can sometimes mean the difference between keeping or losing thousands in match money.',
      },
      {
        heading: 'Why a direct rollover beats an indirect rollover',
        body: 'When you do roll money into a new 401(k) or an IRA, how the money moves matters as much as where it goes. A direct rollover (sometimes called a trustee-to-trustee transfer) moves the money straight from the old plan to the new account without ever passing through your hands — no taxes withheld, no strings attached.\n\nAn indirect rollover is riskier: the old plan cuts you a check, but by law it must first withhold 20% for federal taxes — even though the whole thing is still supposed to be tax-free if handled correctly. You then have 60 days to deposit the full original balance (including the 20% that was withheld, which you’d have to cover out of pocket temporarily) into a new retirement account. Miss the 60-day window, or fail to make up the withheld 20%, and the shortfall gets treated as a taxable distribution — plus a 10% early withdrawal penalty if you’re under 59½. Always ask for a direct rollover; it removes this entire risk.',
      },
      {
        heading: 'The real cost of cashing out early',
        body: 'Cashing out an old 401(k) instead of rolling it over feels like free money showing up in your bank account, but it’s one of the most expensive financial decisions a young worker can make. The withdrawal counts as ordinary taxable income for the year, and if you’re under 59½, the IRS adds a 10% early withdrawal penalty on top of that income tax — before the mandatory 20% federal withholding mentioned above even gets reconciled at tax time.\n\nRun the math on a modest example: cash out $10,000 from an old 401(k) at 24. Between income tax and the 10% penalty, a meaningful chunk of it can vanish immediately — and that’s before counting the decades of tax-advantaged compounding you just gave up. At a long-term average return of roughly 10% a year, that $10,000 left alone could double roughly every 7 years — turning into something like $80,000–$160,000 by a typical retirement age, money that a cash-out this year converts into a fraction of that, spent long before it had the chance to grow.',
      },
      {
        heading: 'If your balance is small, the plan might move it without asking',
        body: 'There’s one wrinkle worth knowing even if you plan to do nothing: federal rules let an employer’s plan automatically force out small balances after you leave. If your vested balance is $1,000 or less, the plan can simply cash it out and mail you a check (with taxes withheld, same as above). If it’s more than $1,000 but under a threshold of $7,000, the plan can instead automatically roll it into an IRA opened in your name at a provider it chooses — usually parked in a low-yield, ultra-conservative fund — if you don’t respond to their notice within a set window.\n\nThat auto-rollover IRA isn’t a scam, but it’s rarely the best home for your money long-term. If you get a letter from an old employer’s plan about your balance, it’s worth acting on it yourself — rolling into an IRA or new 401(k) of your own choosing — rather than letting the default happen and forgetting where the money ended up.',
      },
      {
        heading: 'Your checklist when you leave a job',
        body: '1. Check your vesting schedule before you give notice — you might be close to fully owning match money you’d otherwise forfeit.\n2. Decide where the old 401(k) is going: new employer’s plan, an IRA, or (short-term only) staying put.\n3. Always request a direct (trustee-to-trustee) rollover — never let a check get cut to you personally if you can avoid it.\n4. If a check does come to you, redeposit the full amount — including any withheld 20% you cover yourself — within 60 days to avoid taxes and penalties.\n5. Don’t cash out to cover short-term expenses; the combined tax hit and penalty plus lost decades of compounding make it one of the most expensive ways to raise cash.\n6. Watch for a force-out notice on small balances (under $7,000) from an old employer’s plan, and redirect it yourself instead of letting the default rollover happen.',
      },
    ],
    relatedTerms: ['401(k)', 'Roth IRA', 'Compound Interest', 'Diversification', 'Index Investing'],
    faq: [
      {
        q: 'Do I lose my 401(k) if I quit my job?',
        a: 'No — your own contributions are always 100% yours. But any employer match may be subject to a vesting schedule, and if you leave before you’re fully vested, the unvested portion of the match is forfeited back to the plan.',
      },
      {
        q: 'Should I roll over my 401(k) or leave it with my old employer?',
        a: 'Rolling it into a new employer’s plan or an IRA usually gives you more control and a wider investment menu, and it’s easier to keep track of than accounts scattered across old employers. Leaving it in place is fine short-term but easy to lose track of over multiple job changes.',
      },
      {
        q: 'What happens if I cash out my old 401(k) instead of rolling it over?',
        a: 'You’ll owe ordinary income tax on the full amount, plus a 10% early withdrawal penalty if you’re under 59½, and the plan is required to withhold 20% upfront. On top of the immediate tax hit, you lose decades of potential tax-advantaged compounding.',
      },
      {
        q: 'Can my old employer force my 401(k) out without my permission?',
        a: 'Yes, for small balances. Under federal rules, balances of $1,000 or less can be cashed out automatically, and balances up to $7,000 can be automatically rolled into an IRA chosen by the plan if you don’t respond to their notice — so it’s worth acting on your own instead of leaving it to default.',
      },
    ],
  },
  {
    slug: 'how-does-a-high-yield-savings-account-work',
    title: 'How Does a High-Yield Savings Account Work, and How Much Will You Actually Earn?',
    metaTitle: 'High-Yield Savings Accounts Explained: APY, FDIC & Real Numbers',
    description:
      'A HYSA can pay far more interest than a regular bank account — here’s how APY, compounding, and FDIC insurance actually work, with real numbers attached.',
    date: '2026-07-25',
    category: 'Saving',
    intro:
      'Your regular bank account pays next to nothing in interest, and someone told you to move your savings to a “high-yield” account instead — but nobody explained what’s actually different about it, or whether your money is even safe there. Here’s the real mechanics: how the rate is set, what APY actually means, and what protects your cash if the bank itself runs into trouble.',
    sections: [
      {
        heading: 'Why a “high-yield” account pays so much more than your bank',
        body: 'A regular savings account at a big brick-and-mortar bank — the kind with branches on every corner — has historically paid next to nothing, often a small fraction of a percent (something like 0.01%–0.05% APY), no matter how much cash sits in it. That’s not because your money isn’t doing anything for the bank; it’s doing plenty. The bank takes deposits, lends them out at much higher rates through mortgages and credit cards, and keeps the spread between what it pays you and what it earns on your money.\n\nHigh-yield savings accounts (HYSAs), almost always offered by online-only banks, skip the branches and pass more of that spread back to you. Without real estate, tellers, or vaults to pay for, they can afford an APY that’s historically run several times higher than a traditional bank’s — sometimes ten times higher or more, depending on where interest rates stand at the time. On $5,000 sitting untouched for a year, the difference between a 0.05% APY and a 4% APY is roughly $2.50 versus $200 — same money, same risk, wildly different outcome.',
      },
      {
        heading: 'APY vs. a plain interest rate — the number that actually matters',
        body: 'The number to compare between accounts is APY — Annual Percentage Yield — not a bare interest rate. APY already bakes in compounding, meaning it accounts for the fact that the interest you earn this month starts earning its own interest next month. An account advertising a 4% APY, compounded daily, turns $1,000 left untouched into a little more than $1,040 after a full year — not just $1,000 plus a flat $40, because every day’s interest gets added back to the balance the next day’s calculation is based on.\n\nThis is the mirror image of how credit card debt compounds against you — the same daily-compounding math, just running in your favor instead of the bank’s. It’s also why comparing two accounts by their advertised APY is a fair, apples-to-apples comparison, while comparing raw interest rates without knowing how often they compound isn’t.',
      },
      {
        heading: 'Where the rate actually comes from: the Federal Reserve, not the bank’s mood',
        body: 'HYSA rates aren’t fixed, and the bank isn’t setting them based on how generous it feels — they move largely because of the Federal Reserve’s federal funds rate, the rate banks charge each other for short-term loans. When the Fed raises rates to fight inflation, HYSA APYs tend to climb right along with it. When the Fed cuts rates — usually because inflation has cooled or the economy needs support — HYSA APYs drift back down.\n\nThat means the “high” in high-yield is relative to the current rate environment, not a permanent promise. An account paying a strong APY today could be paying meaningfully less in a year if the Fed has been cutting — that’s not the bank quietly shortchanging you, it’s the whole system resetting. Check your rate every few months rather than assuming the number you signed up with is locked in forever.',
      },
      {
        heading: 'Is the money actually safe? FDIC insurance, explained',
        body: 'The safety question is separate from the rate question, and it has a clean answer: as long as the bank is FDIC-insured (or, for credit unions, NCUA-insured — the credit union equivalent), your deposits are protected up to $250,000 per depositor, per bank, per ownership category, even if the bank itself fails. That protection is backed by the federal government, and it applies exactly the same way to an online-only bank as it does to the branch on Main Street.\n\nBefore opening an account anywhere, confirm FDIC or NCUA coverage — most legitimate banks display the logo on their site, and any bank can be looked up directly through the FDIC’s BankFind tool. A savings app or fintech company that isn’t itself a bank usually holds your money at a partner bank behind the scenes, so check that the actual bank holding the deposits is insured, not just the name on the app’s homepage.',
      },
      {
        heading: 'HYSA vs. CD vs. money market fund — which one for which goal',
        body: 'A HYSA isn’t the only place to park cash, and the right choice depends on how soon the money might be needed. A certificate of deposit (CD) usually pays a fixed rate that can run a bit higher than a HYSA, but locks the money up for a set term — say, 12 months — and charges an early withdrawal penalty (often several months’ worth of interest) if it’s touched before the term ends. CDs make sense for money with a known, specific timeline where early access isn’t a concern.\n\nA money market fund (not the same thing as a bank’s “money market account”) is a type of mutual fund that invests in extremely short-term, low-risk debt. It isn’t FDIC-insured, though it’s historically been very stable, and it’s commonly the default spot uninvested cash sits inside a brokerage account.\n\nFor an emergency fund or money that might be needed on short notice, a HYSA is usually the right call: no lockup, FDIC insurance, and a rate that still meaningfully beats a checking account. Save CDs for cash on a fixed timeline, and leave brokerage cash in a money market fund only when it’s genuinely about to be invested.',
      },
      {
        heading: 'Your checklist',
        body: '1. Compare accounts by APY, not a bare interest rate — APY already accounts for compounding.\n2. Confirm the bank is FDIC-insured (or NCUA-insured for a credit union) before depositing anything.\n3. Expect the rate to move with the Federal Reserve — check it every few months instead of assuming it’s fixed.\n4. Use a HYSA for money that might be needed on short notice, like an emergency fund, and save CDs for cash on a fixed timeline.\n5. Watch for teaser rates — some accounts advertise a high introductory APY that drops after a few months, so read the fine print before opening one.\n6. Keep balances at any single bank under the $250,000 FDIC limit if you ever have that much cash to protect.',
      },
    ],
    relatedTerms: ['Liquidity', 'Inflation', 'Compound Interest', 'Federal Reserve'],
    faq: [
      {
        q: 'What’s a good APY for a high-yield savings account?',
        a: 'There’s no fixed target, since rates move with the Federal Reserve — but a HYSA should meaningfully beat a traditional bank’s, which has often paid as little as 0.01%–0.05%. Compare a few online banks’ current APYs before choosing one.',
      },
      {
        q: 'Is money in a high-yield savings account safe?',
        a: 'Yes, as long as the bank is FDIC-insured (or NCUA-insured for a credit union) — deposits are protected up to $250,000 per depositor, per bank, backed by the federal government.',
      },
      {
        q: 'Is a high-yield savings account the same as investing?',
        a: 'No. A HYSA is a bank deposit account with a government-backed guarantee — it can’t lose value, but its long-term returns are historically far below what a diversified stock portfolio has returned over decades.',
      },
      {
        q: 'Do I have to pay taxes on interest earned in a HYSA?',
        a: 'Yes — interest earned is taxed as ordinary income, and the bank will send a 1099-INT form if the account earns $10 or more in a year.',
      },
    ],
  },
  {
    slug: 'will-a-raise-put-me-in-a-higher-tax-bracket',
    title: 'Will a Raise Put You in a Higher Tax Bracket and Actually Shrink Your Paycheck?',
    metaTitle: 'Raise & Tax Brackets: Can a Raise Ever Lower Your Take-Home Pay?',
    description:
      'A raise can never shrink your paycheck because of “moving up a bracket” — that’s a myth about how marginal tax rates work. Here’s the real math.',
    date: '2026-07-26',
    category: 'Paychecks & Taxes',
    intro:
      'You’re about to take a raise or a shift with more hours, and someone — a coworker, a relative, a comment section — warns you it might bump you into a higher tax bracket and leave you with less take-home pay than before. It’s one of the most repeated myths in personal finance, and it’s backwards. Here’s how marginal tax brackets actually work, and the one real (but different) situation where extra income genuinely can cost you money.',
    sections: [
      {
        heading: 'The myth: “a raise pushed me into a higher bracket, so now I take home less”',
        body: 'This is not how the US federal income tax system works, and it’s worth killing the idea completely before it stops you from taking a raise or extra shift. The federal system doesn’t apply one tax rate to your whole income based on which bracket you land in — it’s a marginal system, meaning each bracket’s rate only applies to the slice of income that falls inside that bracket.\n\nSo getting a raise that pushes you from, say, a 12% bracket into a 22% bracket doesn’t mean your entire income suddenly gets taxed at 22%. It means only the new dollars above that bracket line get taxed at 22% — every dollar you were already earning keeps being taxed exactly the way it was before. A raise can never make your paycheck smaller through this mechanism. At worst, it means your next dollars are taxed a bit more, but you always keep more than you had before.',
      },
      {
        heading: 'How marginal brackets actually stack, with an illustrative example',
        body: 'The US currently uses seven federal income tax brackets, with rates running from 10% up to 37%. The exact dollar cutoffs for each bracket shift a little every year because they’re adjusted for inflation, so always check the current IRS tables rather than memorizing a number — but the mechanism itself never changes.\n\nHere’s the shape of it with simple, illustrative round numbers (not this year’s exact cutoffs): say the 10% bracket covers your first chunk of taxable income, the 12% bracket covers the next chunk after that, and so on up the ladder. If a raise moves $2,000 of your income from the 12% bracket into the 22% bracket, you don’t pay 22% on your whole salary — you pay 22% on that $2,000, and everything below it is taxed exactly as it was. You still net roughly $1,560 of that $2,000 after federal tax, instead of the full $2,000 — but that’s still $1,560 more than you had before the raise, not less.',
      },
      {
        heading: '“Effective rate” vs. “marginal rate” — the two numbers people mix up',
        body: 'Your marginal rate is the rate charged on your next dollar of income — the bracket you’re “in.” Your effective rate is your total tax bill divided by your total income, which blends every bracket you passed through on the way up, plus deductions. Your effective rate is always lower than your marginal rate once you’re past the first bracket, because a chunk of your income is still being taxed at the lower rates below it.\n\nThis is the exact confusion behind the bracket myth: people hear “I’m in the 22% bracket now” and assume 22% is being taken off their whole paycheck, when in reality their effective rate — what they actually pay as a share of total income — is meaningfully lower, because it blends in all the cheaper brackets below it too.',
      },
      {
        heading: 'FICA doesn’t work like brackets at all',
        body: 'The other lines on your paycheck — Social Security and Medicare, together called FICA — don’t use graduated brackets the way income tax does. Social Security is a flat 6.2% on wages, but only up to an annual wage base limit that’s adjusted each year; above that cap, the 6.2% simply stops being withheld for the rest of the year, which is part of why very high earners sometimes notice a bigger paycheck late in December.\n\nMedicare is a flat 1.45% with no cap at all — every dollar you earn owes it, no matter how much you make. There’s one exception that adds, not subtracts: once your income crosses $200,000 in a year (for a single filer), an Additional Medicare Tax of 0.9% kicks in on the amount above that threshold. Like everything else here, it only applies to the income above the line, not your whole paycheck.',
      },
      {
        heading: 'Where a bonus can genuinely feel smaller — and why it evens out',
        body: 'There’s a real reason bonuses sometimes feel over-taxed, and it’s not a bracket myth — it’s a withholding rule. The IRS allows employers to withhold supplemental wages (bonuses, commissions, some overtime payouts) at a flat rate — commonly 22% federally for amounts under $1 million in a year — instead of using your regular paycheck’s withholding formula. If your regular paycheck normally withholds less than 22%, that bonus can look like it got hit harder.\n\nThat flat rate is only withholding, not your actual final tax bill. When you file your return, all your income — regular pay and bonuses together — gets combined and taxed under the normal marginal brackets described above. If too much was withheld from the bonus, you get the difference back as part of your refund; you’re never actually stuck paying the flat 22% permanently.',
      },
      {
        heading: 'The one place extra income can genuinely cost you: benefit cliffs',
        body: 'The bracket myth is false, but there’s a real phenomenon that sounds similar: a “benefits cliff.” Certain income-based programs — some Affordable Care Act insurance subsidies, financial aid formulas, income-driven student loan repayment plans, and some state assistance programs — use income thresholds that aren’t marginal. Crossing one can reduce or eliminate a subsidy or benefit all at once, rather than phasing it out gradually.\n\nThis is worth knowing about, but it’s a completely different mechanism from “tax brackets,” and it applies to a fairly specific set of programs — not to ordinary income tax withholding. If you’re close to a known threshold for financial aid or a subsidized program, it’s worth checking that program’s specific rules; it’s not a reason to turn down a raise or extra work hours in general.',
      },
      {
        heading: 'Your checklist',
        body: '1. Remember: marginal tax brackets only tax the income inside each bracket, never your whole paycheck at the top rate.\n2. A raise can lower how much of the raise you keep, but it can never make your total take-home pay go down.\n3. Don’t confuse your marginal rate (the rate on your next dollar) with your effective rate (your real overall rate) — they’re never the same number once you’re past the first bracket.\n4. If a bonus withholding looks high, don’t panic — it’s usually a flat supplemental withholding rate, reconciled (and often refunded) when you file.\n5. Before turning down extra income out of fear, check whether you’re near an actual benefits cliff (financial aid, subsidies, income-driven loan payments) — that’s the real place income thresholds can bite, not ordinary income tax.',
      },
    ],
    relatedTerms: ['401(k)', 'Roth IRA', 'Inflation', 'Compound Interest'],
    faq: [
      {
        q: 'Can a raise ever make your paycheck smaller?',
        a: 'No. The US federal income tax system is marginal — only the income within each bracket is taxed at that bracket’s rate. A raise might mean your new dollars are taxed a bit more, but you always keep more money overall than before the raise.',
      },
      {
        q: 'What’s the difference between marginal tax rate and effective tax rate?',
        a: 'Your marginal rate is the tax rate applied to your next dollar of income — the bracket you’re currently in. Your effective rate is your total tax bill divided by your total income, blending every lower bracket you passed through. Effective rate is always lower than marginal rate once you’re past the first bracket.',
      },
      {
        q: 'Why does my bonus get taxed more than my regular paycheck?',
        a: 'It’s usually not taxed at a higher rate permanently — employers commonly withhold a flat rate (often 22% federally) on bonuses instead of your regular paycheck’s formula. When you file your taxes, bonus income and regular income combine and get taxed under the normal brackets, and any over-withholding comes back as part of your refund.',
      },
      {
        q: 'Is there any situation where earning more money actually costs you money?',
        a: 'Ordinary income tax brackets, no. But certain income-based programs — some ACA subsidies, financial aid, income-driven student loan plans — use non-marginal thresholds called “benefits cliffs,” where crossing a line can reduce or remove a benefit all at once. That’s a program-specific issue, not how income tax brackets work.',
      },
    ],
  },
  {
    slug: 'debit-card-vs-credit-card-difference',
    title: 'Debit Card or Credit Card: What’s the Real Difference, and Which Should You Get First?',
    metaTitle: 'Debit vs. Credit Card: The Real Difference (and Which First)',
    description:
      'Debit and credit cards look identical at checkout but work completely differently — whose money moves, what builds your credit, and who’s liable for fraud.',
    date: '2026-07-27',
    category: 'Credit',
    intro:
      'They’re the same size, the same chip, the same tap-to-pay — and functionally almost nothing alike. One spends money you already have; the other spends a bank’s money that you promise to pay back. That single difference cascades into everything else: whether it builds your credit, how you’re protected from fraud, and how each one can quietly cost you money if you’re not paying attention.',
    sections: [
      {
        heading: 'The core difference: whose money is actually moving',
        body: 'A debit card is wired directly to your checking account. Swipe it, and the money leaves your account within a day or two — you’re spending cash you already have. There’s no borrowing involved, so there’s no way to owe interest on a debit purchase.\n\nA credit card is a line of credit issued by a bank. Swipe it, and the bank pays the merchant on your behalf — you now owe that amount to the bank. Pay the full statement balance by the due date and it costs you nothing extra. Carry a balance past that date and it starts accruing interest, often at a steep APR. Same tap, completely different mechanism underneath.',
      },
      {
        heading: 'Only one of them builds your credit score',
        body: 'This is the detail that actually matters for your future: debit card activity is almost never reported to the three credit bureaus (Equifax, Experian, TransUnion), because you’re not borrowing anything — there’s nothing for a bureau to track. You can use a debit card responsibly for ten years and it will do essentially nothing for your credit score.\n\nA credit card, used well, is one of the main tools most people use to build credit. Every month, the issuer reports your balance and whether you paid on time to all three bureaus — that payment history is roughly 35% of a FICO score, the single biggest factor in the whole formula. Skip credit cards entirely and you can reach your mid-20s still showing up as “no credit history” to a landlord or lender, which can be just as much of a red flag as bad credit.',
      },
      {
        heading: 'The fraud-protection gap nobody explains at checkout',
        body: 'If your card number gets stolen, the legal protections are not the same, and the gap is bigger than most people realize. Debit card fraud is covered by the Electronic Fund Transfer Act: report it within 2 business days of noticing and your liability is capped at $50. Wait longer — up to 60 days after your statement is sent — and the cap jumps to $500. Wait past 60 days and you can be on the hook for the entire amount, with no legal cap at all. And because it’s your checking account, the money is already gone while the dispute gets investigated, which can mean a rent or grocery payment bounces in the meantime.\n\nCredit card fraud works in your favor by comparison. Under the Fair Credit Billing Act, your maximum legal liability for unauthorized charges is $50, and every major network — Visa, Mastercard, Amex, Discover — layers a $0 liability policy on top of that, so in practice you almost never pay a cent. Just as important: it’s the bank’s money on the line while the charge is disputed, not yours, so nothing drains out of your own account while it’s sorted out.',
      },
      {
        heading: 'Where each one can quietly cost you money',
        body: 'Debit cards carry overdraft risk. Spend more than your checking balance and, unless you’ve opted out of overdraft coverage, the bank can approve the purchase anyway and charge a fee — commonly in the $30–$35 range per occurrence, and if multiple transactions trip it in one day, those fees can stack fast. Opting out of overdraft coverage fixes this — the card simply declines instead of trapping you into a fee.\n\nCredit cards carry interest risk. Carry a balance past the due date and the issuer charges interest — often north of 20% APR — calculated daily on whatever you owe. Minimum payments are structured to shrink slowly, which is exactly how a $1,000 balance turns into years of payments if you only ever pay the minimum. The fix here is just as simple in principle: pay the full statement balance every month, and the interest rate becomes irrelevant because you never actually borrow anything for more than a few weeks at a time.',
      },
      {
        heading: 'So which should you actually get first?',
        body: 'You don’t have to choose — most people end up using both for different jobs, but the order matters. A debit card is the safer starting point for day-to-day spending as a teenager, since it’s tied to money you already have and there’s no way to rack up debt on it. Many banks offer teen checking accounts with a linked debit card and parental controls starting around age 13–16.\n\nA credit card becomes relevant once you have (or a parent is willing to co-sign or add you as an authorized user for) some form of income, generally starting at 18. If you can get added as an authorized user on a parent’s well-managed card, or qualify for a secured or student card, starting to build credit in your late teens or early twenties gives that 15%-of-your-score “length of credit history” factor years of a head start over waiting until you need an apartment or a car loan and have nothing on file.',
      },
      {
        heading: 'Your checklist',
        body: '1. Use a debit card for everyday spending you can fully afford — it can’t put you into debt.\n2. Once you have income (or a willing co-signer/authorized-user option), open a credit card specifically to build history — not to spend more than you would otherwise.\n3. Set every credit card to autopay the full statement balance, so interest never becomes a factor.\n4. Opt out of debit card overdraft coverage so a shortfall declines instead of triggering a fee.\n5. Check your bank and card statements regularly — for debit, report anything wrong within 2 days if you can, since the liability cap gets worse the longer you wait.\n6. Never treat a credit card’s limit as spending money — it’s borrowed money with your name and your future credit score attached to it.',
      },
    ],
    relatedTerms: ['Credit Rating', 'Liquidity', 'Federal Reserve', 'Inflation'],
    faq: [
      {
        q: 'Does using a debit card build your credit score?',
        a: 'No. Debit card activity is almost never reported to the credit bureaus, since you’re spending your own money rather than borrowing. Building credit generally requires a product that reports to Equifax, Experian, and TransUnion, like a credit card or credit-builder loan.',
      },
      {
        q: 'Is a debit card or credit card safer if my card gets stolen?',
        a: 'Credit cards offer stronger practical protection. Federal law caps your liability at $50 either way, but debit fraud can cost up to $500 (or more) if you don’t report it within 60 days, and the money leaves your checking account immediately. Credit card networks also layer on $0 liability policies, and it’s the bank’s money at risk during a dispute, not yours.',
      },
      {
        q: 'Should a teenager get a debit card or a credit card first?',
        a: 'A debit card, usually through a teen checking account with parental controls, is the standard starting point since it can’t create debt. A credit card becomes relevant once there’s income or a parent willing to add you as an authorized user or co-signer, typically in the later teen years.',
      },
      {
        q: 'What happens if I overdraft my debit card?',
        a: 'If you haven’t opted out of overdraft coverage, the bank can approve the purchase anyway and charge a fee, commonly in the $30–$35 range per occurrence. Opting out means the transaction is simply declined instead, which avoids the fee entirely.',
      },
    ],
  },
  {
    slug: 'do-you-pay-taxes-on-venmo-cash-app-money',
    title: 'Do You Have to Pay Taxes on Venmo, Cash App, or PayPal Money?',
    metaTitle: 'Venmo & Cash App Taxes: What’s Actually Taxable',
    description:
      'Splitting rent isn’t taxable, but selling stuff for profit is — here’s how the Venmo/Cash App 1099-K rules actually work, and what you really owe tax on.',
    date: '2026-07-28',
    category: 'Paychecks & Taxes',
    intro:
      'A friend Venmos you for their half of dinner, or your parents send you rent money through Cash App, and then tax season rolls around and someone panics about a “$600 rule” they saw online. Here’s the actual mechanics: what these apps report to the IRS, what you actually owe tax on, and why those are two very different questions.',
    sections: [
      {
        heading: 'The 1099-K panic, explained',
        body: 'Payment apps like Venmo, PayPal, and Cash App are classified by the IRS as “third-party settlement organizations.” Once your payments for goods and services on one of these apps cross a certain dollar threshold in a calendar year, the app is required to send you (and the IRS) a Form 1099-K summarizing what it processed under your account.\n\nThat threshold has been a moving target for several years running. A 2021 law originally set it to drop sharply from an older $20,000-and-200-transactions rule down to just $600 total — and the IRS has delayed, phased in, and adjusted that change multiple times since, with Congress also weighing in on where it should ultimately land. Because the exact number keeps shifting year to year, don’t trust a figure from an old article — check IRS.gov or the app’s own help page for whatever threshold applies to the current tax year.\n\nHere’s the part almost nobody explains clearly: the 1099-K threshold only controls when a form gets sent to you. It has nothing to do with whether the underlying money is actually taxable. That’s a completely separate question, and it’s the one that actually matters.',
      },
      {
        heading: 'The real rule: what was the money for?',
        body: 'Every payment app now asks you to tag a transaction as “friends and family” (personal) or “goods and services” (business) when money changes hands — and that tag is the whole ballgame.\n\nMoney that changes hands for personal reasons is never taxable income, no matter how large it is or whether a 1099-K shows up. Your roommate paying you back for their half of the electric bill, your parents sending money for a plane ticket home, a friend Venmoing you for concert tickets you covered — none of that is income. It’s just money moving between people, the same as if they’d handed you cash.\n\nMoney you receive for goods or services — freelance design work, tutoring, selling something you made, getting paid for a side gig — is taxable income, exactly the same as if you’d been paid by check or direct deposit. The app you used to receive it doesn’t change that. This is the same principle behind how gig and freelance income gets taxed — Venmo and Cash App are just another way that money can land in your account.',
      },
      {
        heading: 'Selling your own stuff: usually not taxable, with one exception',
        body: 'A lot of the false alarm around this topic comes from people selling their own used belongings — an old phone, clothes, furniture — through apps like Venmo, Facebook Marketplace, or Poshmark, and worrying the payment counts as taxable income.\n\nFor most personal items, it doesn’t. If you sell something for less than you originally paid for it — true of almost everything you personally own and use — there’s no taxable gain, because you sold it at a loss, not a profit. The IRS doesn’t tax money that was never a gain in the first place.\n\nThe exception is selling a personal item for more than you paid for it — a collectible that appreciated, concert tickets resold above face value, sneakers flipped for a profit. In that specific case, the profit (sale price minus what you originally paid) is taxable, reported the same way as any other capital gain. And if reselling becomes a regular, repeated activity rather than the occasional garage-sale item, the IRS can treat it as a business instead of casual selling — which brings in self-employment tax on top of income tax, the same $400 net-earnings threshold that applies to any other gig work.',
      },
      {
        heading: 'What to do if you get a 1099-K for money that wasn’t actually income',
        body: 'Because personal payments and business payments both flow through the same app, a 1099-K can sometimes lump in money that was never actually taxable — a roommate’s rent reimbursement that got mistagged, for instance. Getting the form doesn’t automatically mean you owe tax on the full amount shown.\n\nWhat it does mean is you need to account for it on your tax return rather than just ignoring it, since the IRS also gets a copy and expects the numbers to line up. If part of a 1099-K total wasn’t actually income, your return includes a way to report the 1099-K amount and then back out the non-taxable portion, with a brief explanation. This is exactly why it matters to tag transactions correctly as “friends and family” in the apps in the first place — it keeps the form itself accurate and saves you the cleanup later.',
      },
      {
        heading: 'Your checklist',
        body: '1. Always tag personal payments — rent splits, reimbursements, gifts — as “friends and family,” not “goods and services,” so they don’t get mixed into a 1099-K by mistake.\n2. Remember: getting a 1099-K doesn’t automatically mean you owe tax on the full amount — it’s a reporting form, not a bill.\n3. If you’re paid through an app for freelance work, tutoring, or a side hustle, treat it exactly like gig income — track it, and know the $400 self-employment filing threshold applies.\n4. Selling your own used stuff for less than you paid isn’t taxable; selling for a profit is, even if it’s just one collectible or a resold pair of sneakers.\n5. Keep basic records — what something cost, what it sold for, what a payment was actually for — so you’re not guessing at tax time.\n6. Check the current-year 1099-K reporting threshold on IRS.gov before assuming a number you saw online is still accurate.',
      },
    ],
    relatedTerms: ['Roth IRA', 'Compound Interest', 'Liquidity', 'Federal Reserve'],
    faq: [
      {
        q: 'Do I have to pay taxes on money my parents send me through Venmo?',
        a: 'No. Personal transfers — gifts, allowance, reimbursements from family or friends — are never taxable income, regardless of the amount or whether a 1099-K gets issued.',
      },
      {
        q: 'What is a 1099-K and why did I get one?',
        a: 'It’s a form payment apps send when your “goods and services” payments cross the IRS reporting threshold for the year. Getting one doesn’t automatically mean the full amount is taxable — personal payments that got mistagged can be backed out on your return.',
      },
      {
        q: 'Do I owe taxes if I sell my old phone or clothes on Venmo?',
        a: 'Usually not — selling personal items for less than you originally paid isn’t a taxable gain. If you sell something for more than you paid, like a collectible or resold tickets, that profit is taxable.',
      },
      {
        q: 'Is Venmo income the same as a regular paycheck for tax purposes?',
        a: 'If it’s payment for work — freelancing, tutoring, a side hustle — yes, it’s taxable income just like a regular paycheck, and if net earnings hit $400 in a year, it also triggers self-employment tax, same as any other 1099 income.',
      },
    ],
  },
  {
    slug: 'roth-ira-vs-traditional-ira-difference',
    title: 'Roth IRA vs. Traditional IRA: What’s the Real Difference, and Which Should You Open First?',
    metaTitle: 'Roth IRA vs. Traditional IRA: The Real Difference Explained',
    description:
      'Both hold the same stocks and funds — the difference is when you pay tax. Here’s how contribution limits, income rules, and withdrawals actually compare.',
    date: '2026-07-29',
    category: 'Investing',
    intro:
      'You’ve heard “open a Roth IRA” a hundred times, and somewhere along the way someone mentioned a “Traditional IRA” too, like you’re already supposed to know the difference. Both are just accounts — same brokerage, same stocks and index funds inside — and the entire difference comes down to one choice: pay tax on the money now, or pay tax on it later.',
    sections: [
      {
        heading: 'Same account, opposite tax bet',
        body: 'An IRA (Individual Retirement Account) isn’t an investment itself — it’s a tax-advantaged wrapper you open at a brokerage and then fill with stocks, ETFs, or index funds, exactly like a regular brokerage account. A Traditional IRA and a Roth IRA are two flavors of that same wrapper, and the only structural difference between them is which side of the tax bill you pay.\n\nA Traditional IRA is funded with pre-tax (or tax-deductible) money — it can lower your taxable income the year you contribute — and you pay ordinary income tax when you withdraw it in retirement. A Roth IRA is funded with money you’ve already paid tax on, and in exchange it grows completely tax-free — you owe nothing when you withdraw it later, not even on decades of gains. Same investments, same brokerage, opposite ends of the tax timeline.',
      },
      {
        heading: 'Contribution limits — and they’re shared, not separate',
        body: 'The IRS sets one combined annual contribution limit that applies across both a Traditional and a Roth IRA together, not per account. In recent tax years that limit has been $7,000 a year ($8,000 if you’re 50 or older), adjusted for inflation every so often rather than every single year. Put $4,000 into a Roth and you can only add $3,000 more to a Traditional IRA that same year — the two accounts share one ceiling.\n\nThat combined limit is separate from a 401(k)’s limit, which runs several times higher — so having a 401(k) at work doesn’t reduce how much you can also put into an IRA on the side.',
      },
      {
        heading: 'The income rules that decide which one you’re even allowed to use',
        body: 'A Traditional IRA has no income limit on contributing — anyone with earned income can put money in. But the tax deduction on those contributions phases out at higher incomes if you (or your spouse) are also covered by a workplace retirement plan like a 401(k). Below that phase-out range, contributions are fully deductible; above it, you can still contribute, you just don’t get the upfront tax break.\n\nA Roth IRA works the opposite way: there’s no deduction to lose since you never got one, but eligibility to contribute directly phases out entirely once your income crosses a fairly high threshold (adjusted most years, but it starts well into six figures for a single filer). For most students and early-career earners, this ceiling is nowhere close — it becomes relevant later, once raises start stacking up.',
      },
      {
        heading: 'Required withdrawals: one forces your hand, one never does',
        body: 'A Traditional IRA comes with Required Minimum Distributions (RMDs) — starting at a set age in retirement (currently 73), the IRS forces you to start withdrawing a calculated minimum amount each year, whether you need the money or not, and taxes it as ordinary income when you do. Skip an RMD and the penalty is steep.\n\nA Roth IRA has no RMDs at all during the original owner’s lifetime. The money can sit and keep compounding tax-free for as long as you want — even into your 90s — which is part of why a Roth is often the more flexible account to leave alone the longest, or to pass on to an heir who then inherits it tax-free too.',
      },
      {
        heading: 'Getting money out early: one is far more forgiving',
        body: 'If life happens before retirement, the two accounts treat you very differently. Withdraw earnings from a Traditional IRA before age 59½ and you generally owe ordinary income tax on the amount plus a 10% early withdrawal penalty, with only a short list of IRS-approved exceptions (a first home purchase up to a lifetime cap, certain education expenses, and a few others).\n\nA Roth IRA is more forgiving because you already paid tax on your contributions going in: you can withdraw the amount you’ve personally contributed (not the investment earnings) at any age, for any reason, with zero tax and zero penalty. Touch the earnings portion early, though, and the same age-59½-plus-exceptions rules generally apply as they do to a Traditional IRA. This flexibility is why some people treat Roth contributions as a legitimate backup emergency layer, even though it shouldn’t be the primary plan.',
      },
      {
        heading: 'Your checklist: which one should you actually open?',
        body: '1. If your income is low now and likely to rise later in your career, lean Roth — you’re paying tax at today’s lower rate instead of a probably-higher future rate.\n2. If you’re in a high tax bracket right now and expect a lower one in retirement, a Traditional IRA’s upfront deduction carries more weight.\n3. Check whether you’re covered by a workplace plan — it can phase out your Traditional IRA deduction at higher incomes, which tips the decision toward Roth.\n4. Confirm you’re under the Roth income limit before assuming it’s available to you — most students and early-career earners are nowhere close to it.\n5. Remember the contribution limit is shared across both accounts — decide how to split it, don’t assume you get the full limit in each.\n6. When genuinely unsure, Roth is the common default for young, lower-income earners — it locks in today’s tax rate on money that has decades left to grow.',
      },
    ],
    relatedTerms: ['Roth IRA', 'Compound Interest', 'Diversification', 'Index Investing', '401(k)'],
    faq: [
      {
        q: 'Can I have both a Roth IRA and a Traditional IRA?',
        a: 'Yes — you can contribute to both in the same year, as long as your total contributions across both accounts don’t exceed the combined annual limit.',
      },
      {
        q: 'Which is better for a college student or first job, Roth or Traditional IRA?',
        a: 'Most financial advisors default to Roth for young, lower-income earners, since you’re likely paying tax on the contribution at one of the lowest rates you’ll ever be in, and the money then grows tax-free for decades.',
      },
      {
        q: 'Do I have to take money out of a Roth IRA at a certain age?',
        a: 'No — Roth IRAs have no Required Minimum Distributions during the original owner’s lifetime, unlike Traditional IRAs, which force withdrawals starting at age 73.',
      },
      {
        q: 'Can I withdraw money from an IRA before retirement without a penalty?',
        a: 'From a Roth IRA, yes — you can withdraw your own contributions (not earnings) anytime, tax- and penalty-free. From a Traditional IRA, early withdrawals are generally taxed as income plus a 10% penalty, with only a short list of IRS-approved exceptions.',
      },
    ],
  },
  {
    slug: 'what-is-the-50-30-20-budget-rule',
    title: 'What Is the 50/30/20 Budget Rule, and Does It Actually Work on a First Paycheck?',
    metaTitle: '50/30/20 Budget Rule Explained: Does It Work on Entry-Level Pay?',
    description:
      'The 50/30/20 rule splits your paycheck into needs, wants, and savings — but it assumes rent doesn’t eat half your check. Here’s how to actually use it.',
    date: '2026-07-30',
    category: 'Saving',
    intro:
      'Someone told you to “follow the 50/30/20 rule” and it sounded reasonable until you actually did the math on your own paycheck and the numbers didn’t come close to lining up. The rule itself is solid — it’s just usually taught without the fine print. Here’s what it actually says, what counts in each bucket, and what to do when your real paycheck doesn’t fit it.',
    sections: [
      {
        heading: 'What the rule actually says',
        body: 'The 50/30/20 rule is a simple budgeting framework popularized by Elizabeth Warren (yes, the senator — she co-wrote a personal finance book, "All Your Worth," before running for office) with her daughter Amelia Warren Tyagi. It splits your take-home pay — what actually lands in your account after taxes, not your gross salary — into three buckets: 50% toward needs, 30% toward wants, and 20% toward savings and debt payoff.\n\nThat “after-tax” detail matters more than people realize. If you calculate the split off your gross pay instead of what you actually receive, every bucket ends up too big, and the whole budget feels broken by the second week of the month. Always start from the number that actually hits your bank account.',
      },
      {
        heading: 'The 50%: needs — smaller than people think',
        body: '“Needs” means the expenses you’d still have to pay even if your income dropped tomorrow: rent, utilities, groceries, insurance, minimum debt payments, and transportation to work or school. It does not mean everything that feels necessary in the moment.\n\nA streaming subscription, a coffee habit, a car payment on a nicer car than you need, and a phone upgrade all feel like needs day-to-day, but they belong in the next bucket. The test isn’t “would I miss this” — it’s “would I go without shelter, food, or my job if I cut it.” Being honest about that line is most of what makes this budget actually work.',
      },
      {
        heading: 'The 30%: wants — the bucket that’s supposed to flex',
        body: 'Wants are everything that improves your life but isn’t required to keep it running: eating out, entertainment, hobbies, subscriptions beyond the basics, travel, and upgraded versions of things you already have a cheaper option for. This bucket exists on purpose — a budget with zero room for fun rarely survives contact with real life.\n\nThe 30% is also the easiest bucket to quietly let grow past its share, since individual purchases here are usually small enough not to register. A $12 subscription here, a $20 delivery fee there — none of it feels significant until you total a month of it up.',
      },
      {
        heading: 'The 20%: savings and debt — the bucket that actually builds wealth',
        body: 'This is the bucket that matters most long-term, and it covers three things, roughly in priority order: an emergency fund if you don’t already have one, extra payments on any high-interest debt (credit cards especially), and retirement or investing contributions — a Roth IRA, or a 401(k) up to at least the full employer match if one’s offered.\n\nA useful mental shortcut: if a debt’s interest rate is higher than what you could reasonably expect to earn investing, paying it down early belongs ahead of investing inside this same 20% bucket. Once high-interest debt is gone and a starter emergency fund exists, this bucket shifts mostly toward long-term investing — and every year you keep that up, it compounds.',
      },
      {
        heading: 'Why it doesn’t fit an entry-level paycheck — and how to adapt it',
        body: 'The honest problem with the 50/30/20 rule: it was designed around a median household income, and on a minimum-wage or entry-level paycheck, rent alone can chew through a much bigger share than 50% — sometimes all of it — before groceries or insurance even enter the picture. If that’s your situation, the rule isn’t broken and neither are you; the ratio just needs to flex to match reality.\n\nThe fix isn’t to abandon the framework, it’s to treat 50/30/20 as a target to grow into rather than a rule to hit immediately. A more honest starting split for a tight paycheck might look like 70/20/10, or even 80/10/10, with the “wants” bucket doing most of the shrinking since it’s the only one that’s actually optional. What matters is protecting some percentage for the savings bucket, even a small one — 5% put toward savings consistently beats a “perfect” 20% you never actually hit. As income rises with raises or a better job, shift the ratio back toward 50/30/20 a few points at a time rather than trying to force it all at once.',
      },
      {
        heading: 'Your checklist',
        body: '1. Calculate your split from take-home (after-tax) pay, never your gross salary.\n2. List your true needs first — rent, utilities, groceries, insurance, minimum debt payments, transportation — and total them.\n3. If needs already eat more than half your paycheck, don’t force the 30/20 split — shrink the wants bucket first and protect whatever percentage you can for savings.\n4. Inside the savings bucket, prioritize in order: starter emergency fund, any employer 401(k) match, high-interest debt payoff, then a Roth IRA or other investing.\n5. Automate the savings bucket — a recurring transfer the day you get paid — so it happens before “wants” spending has a chance to eat it.\n6. Revisit the ratio every time your income changes; the goal is to grow toward 50/30/20 over time, not hit it perfectly on day one.',
      },
    ],
    relatedTerms: ['Liquidity', 'Compound Interest', 'Roth IRA', 'Inflation'],
    faq: [
      {
        q: 'Is the 50/30/20 rule based on gross or net income?',
        a: 'Net (take-home) income — what actually lands in your bank account after taxes. Calculating it off your gross salary makes every bucket too big and the budget feel impossible to hit.',
      },
      {
        q: 'What if my rent alone is more than 50% of my paycheck?',
        a: 'That’s common on an entry-level or minimum-wage income, and it doesn’t mean the budget failed — it means the ratio needs to shift. Shrink the “wants” bucket first, protect whatever percentage you can for savings even if it’s small, and move the ratio back toward 50/30/20 as your income grows.',
      },
      {
        q: 'Do retirement contributions count as part of the 20%?',
        a: 'Yes. The 20% bucket covers savings and debt payoff together — emergency fund, extra payments on high-interest debt, and retirement or investing contributions like a Roth IRA or 401(k) all live inside it.',
      },
      {
        q: 'What counts as a “want” versus a “need”?',
        a: 'A need is something you’d still have to pay for even with a much smaller income — housing, groceries, utilities, insurance, minimum debt payments. Everything that makes life more comfortable but isn’t required to keep it running — dining out, entertainment, subscriptions, upgrades — is a want, even if it feels essential day-to-day.',
      },
    ],
  },
  {
    slug: 'are-scholarships-and-grants-taxable',
    title: 'Are Scholarships and Grants Taxable? What You Actually Owe the IRS',
    metaTitle: 'Are Scholarships and Grants Taxable? The IRS Rules Explained',
    description:
      'Scholarship money isn’t automatically tax-free — the IRS only exempts the part spent on tuition and required course costs. Here’s exactly where the line falls.',
    date: '2026-07-31',
    category: 'College Money',
    intro:
      'A financial aid letter shows up with scholarship and grant money attached, and it feels like the one part of college that’s simply free — no strings, no tax form, no catch. Mostly true, but not entirely: the IRS draws a specific, narrow line around what counts as tax-free, and a chunk of “free” money can quietly become taxable income depending on exactly what it pays for.',
    sections: [
      {
        heading: 'The basic rule: tax-free, but only for qualified expenses',
        body: 'The IRS treats a scholarship or grant as tax-free income only when two things are both true: you’re a degree candidate at an eligible school, and the money goes toward “qualified education expenses.” That phrase has a specific, narrow meaning — tuition and fees required for enrollment, plus books, supplies, and equipment required of every student taking the course.\n\nMeet both conditions and the scholarship doesn’t show up on your tax return at all — not as income, not as a deduction, nothing. It’s the cleanest kind of financial aid there is: money that funds your education without the IRS ever asking for a cut.',
      },
      {
        heading: 'What’s not qualified — where it quietly becomes taxable',
        body: 'The part almost nobody explains at financial aid orientation: anything a scholarship covers beyond tuition and required course materials is taxable income, even though it never arrives looking like a paycheck. Room and board is the big one — a scholarship that includes a housing stipend or a meal plan allowance makes that portion taxable, full stop.\n\nTravel, a laptop that isn’t specifically required for your coursework, health insurance, and optional equipment fall into the same taxable bucket. It doesn’t matter whether the school pays your dorm directly or hands you a check — if the money was allocated to a non-qualified expense, that slice counts as income for the year you received it, and you’re expected to report it even though nobody withheld tax on it for you.',
      },
      {
        heading: 'When the scholarship comes with strings attached',
        body: 'Some scholarships and fellowships require you to do something in exchange — teach a section, grade papers, work in a research lab. The IRS draws a hard line here: any part of an award that’s payment for teaching, research, or other services required as a condition of getting the money is taxable compensation, regardless of what you spend it on. It doesn’t matter that the same check also funds your tuition — the “services” portion gets carved out and taxed like a paycheck.\n\nSchools that pay this way often report it on a W-2 alongside actual withholding, the same as any job. If yours doesn’t, you’re still responsible for reporting it — check with your financial aid or payroll office about how a specific award is classified before assuming it’s all tax-free.',
      },
      {
        heading: 'Work-study, Pell Grants, and other look-alikes',
        body: 'Federal Work-Study money isn’t a scholarship — it’s a paycheck for an actual job, on campus or through an approved employer, and it’s taxed like one: reported on a W-2, subject to income tax like any wages. One quirk worth knowing: students enrolled at least half-time who work for their own school are often exempt from FICA (Social Security and Medicare) tax on those specific wages under an IRS student exception — ask your payroll office whether it applies to your job.\n\nPell Grants and other need-based federal grants follow the exact same qualified-expense rule as any other scholarship: tax-free when the money goes to tuition, fees, and required course materials, taxable when it covers room, board, or other living costs. A Pell Grant isn’t automatically tax-free just because it’s need-based aid rather than a merit scholarship.',
      },
      {
        heading: '529 plans, and actually filing a return',
        body: 'If you’re also drawing from a 529 plan, a tax-free scholarship doesn’t force you to waste the account. You can withdraw an amount equal to the scholarship from the 529 without owing the usual 10% penalty on non-qualified withdrawals — the earnings portion of that withdrawal still owes ordinary income tax, but the penalty specifically gets waived up to the scholarship amount.\n\nOn the filing side: if any part of your scholarship is taxable and wasn’t already reported on a W-2, the IRS still expects you to include it as income on your return — tax software will walk you through exactly where it goes, since there’s a specific spot set aside for this situation. Whether you’re required to file at all still comes down to your total income for the year against the standard deduction, same as any other income — but a large taxable scholarship can be enough on its own to push a student over that line.',
      },
      {
        heading: 'Your checklist',
        body: '1. Add up what your scholarships and grants actually covered — tuition and required fees, books, and supplies are tax-free; room, board, and travel are not.\n2. Check whether any award requires teaching, research, or other work in exchange — that portion is taxable compensation no matter what it’s spent on.\n3. If you have Federal Work-Study income, expect a W-2 and treat it like any other job’s wages.\n4. Ask your school’s financial aid or payroll office exactly how each award is classified — don’t guess.\n5. If you also use a 529 plan, remember you can withdraw up to the scholarship amount without the 10% penalty, though earnings are still taxed.\n6. Keep a simple record each year of what each award paid for, so you’re not reconstructing it from memory at tax time.',
      },
    ],
    relatedTerms: ['Roth IRA', 'Compound Interest', 'Liquidity', 'Diversification'],
    faq: [
      {
        q: 'Do I have to pay taxes on my scholarship?',
        a: 'Only on the part that doesn’t go toward tuition, fees, and required course materials. Money from the same award that covers room, board, travel, or other living expenses is taxable income.',
      },
      {
        q: 'Is a Pell Grant taxable?',
        a: 'It follows the same rule as any other scholarship — tax-free when used for tuition and required course expenses, taxable when it covers room, board, or other living costs, regardless of it being need-based aid.',
      },
      {
        q: 'Do I owe taxes on Federal Work-Study money?',
        a: 'Yes — Work-Study is a job, not a scholarship, so it’s reported on a W-2 and taxed like any other paycheck. Some student employees are exempt from FICA taxes on it under a specific IRS rule for enrolled students, but income tax still applies.',
      },
      {
        q: 'What happens if my scholarship requires me to teach or do research?',
        a: 'Whatever portion of the award pays for that teaching or research work is taxable compensation no matter how it’s spent — treated like wages, separate from the tax-free treatment that applies to tuition-only scholarship money.',
      },
    ],
  },
  {
    slug: 'hsa-vs-fsa-difference',
    title: 'HSA vs. FSA: What’s the Difference, and Which Should You Actually Pick at Open Enrollment?',
    metaTitle: 'HSA vs. FSA: The Real Difference (and Which to Pick)',
    description:
      'An HSA rolls over and can be invested tax-free forever — an FSA usually can’t. Here’s how each account actually works, and which fits your health plan.',
    date: '2026-08-01',
    category: 'Paychecks & Taxes',
    intro:
      'Open enrollment throws two boxes at you — HSA and FSA — both promising to save you money on healthcare with pre-tax dollars, and the form assumes you already know the difference. You don’t need to be an insurance expert to get this right. You need one fact about your health plan and one rule about what happens to unused money — everything else follows from those two things.',
    sections: [
      {
        heading: 'The one question that decides everything: what kind of health plan are you on?',
        body: 'An HSA (Health Savings Account) and an FSA (Flexible Spending Account) both let you set aside money, tax-free, for medical costs — copays, prescriptions, dental work, glasses. But which one you’re even offered comes down to a single detail: an HSA is only available if you’re enrolled in a High-Deductible Health Plan (HDHP), a plan with a higher deductible and usually a lower monthly premium than a typical PPO. An FSA has no such requirement — it’s offered alongside almost any employer health plan.\n\nSo the real first question at open enrollment isn’t “HSA or FSA” — it’s “am I on an HDHP.” If you are, you likely get a choice between the two (though rarely both at once — more on that below). If you’re on a traditional PPO or HMO, an FSA is probably your only option, and this decision makes itself.',
      },
      {
        heading: 'The FSA: real tax savings, but “use it or lose it”',
        body: 'An FSA lets you set aside pre-tax money straight from your paycheck, typically capped somewhere in the low thousands per year — the IRS adjusts the exact limit periodically, so check your plan’s current cap during enrollment rather than trusting a number from an old article. That money comes out before income tax and FICA are calculated, so routing a few thousand dollars through an FSA can save you several hundred dollars in tax over the year, depending on your bracket.\n\nThe catch is the one every FSA horror story is about: the money is generally “use it or lose it.” Whatever you don’t spend on qualified medical expenses by the end of the plan year gets forfeited back to your employer — no rollover, no refund, no exceptions for “I forgot.” Many employers soften this with either a short grace period (commonly a couple of extra months to spend down the balance) or a small carryover allowance into the next year, but not both, and neither is guaranteed — check your specific plan’s rules before deciding how much to contribute.\n\nBecause of that deadline pressure, the smart way to use an FSA is to estimate your actual expected medical spending for the year — contacts, a known prescription, a planned dental procedure — and fund close to that number, not the max just because it’s tax-free.',
      },
      {
        heading: 'The HSA: the “triple tax advantage” account that doubles as a retirement account',
        body: 'An HSA is the more powerful of the two, and it’s not close. Contributions go in pre-tax (or tax-deductible if you contribute outside payroll), the balance grows completely tax-free while invested, and withdrawals for qualified medical expenses are also tax-free — three tax breaks stacked on the same dollar, which is why advisors sometimes call it the only true “triple tax advantage” account in the entire tax code. Even a Roth IRA only gets two of those three breaks.\n\nUnlike an FSA, HSA money never expires and never gets clawed back — whatever you don’t spend this year just keeps sitting in the account, still yours, still growing. Contribution limits for individual coverage have generally run a bit over $4,000 a year in recent years, with family-coverage limits close to double that, plus an extra catch-up amount once you turn 55 — all adjusted for inflation periodically, so pull the exact current-year numbers from IRS.gov or your plan provider rather than assuming last year’s figures still apply.\n\nHere’s the part most people never use: once your HSA balance crosses a threshold set by your specific provider (often somewhere in the $1,000–$2,000 range), you can invest the rest in mutual funds or ETFs, exactly like a 401(k) or Roth IRA. Left alone and invested for 20–30 years, an HSA can compound into a genuinely large sum — one that’s still completely tax-free when spent on medical costs, which, by retirement age, most people have plenty of.',
      },
      {
        heading: 'Portability: one account moves with you, one usually doesn’t',
        body: 'This is one of the sharpest practical differences. An HSA belongs to you personally, not your employer — it’s your account at whatever bank or brokerage holds it, the same way a Roth IRA is yours regardless of who you work for. Change jobs, change health plans, even go a year without HDHP coverage, and the money already in your HSA stays exactly where it is, still tax-free, still yours to spend on medical costs whenever you need to (you just can’t contribute more unless you’re back on a qualifying HDHP).\n\nAn FSA is tied to your employer’s plan. Leave the job mid-year and, in most cases, you forfeit whatever’s left — there’s no “rolling it into your next employer’s FSA.” Some plans offer COBRA continuation for a limited window, but it’s rarely worth the cost for a small remaining balance. The practical lesson: don’t overfund an FSA in a year you’re expecting to change jobs, since a leftover balance is money you’re very unlikely to see again.',
      },
      {
        heading: 'The under-65 penalty — and why HSAs reward patience',
        body: 'Spend HSA money on a qualified medical expense at any age and it’s entirely tax-free — no penalty, no catch. Spend it on something non-medical before age 65, though, and it’s treated harshly: the withdrawal counts as ordinary taxable income, plus a 20% penalty on top — steeper than the 10% early-withdrawal hit on a traditional IRA or 401(k).\n\nOnce you turn 65, that penalty disappears entirely. Non-medical withdrawals after 65 are still taxed as ordinary income, but the extra 20% goes away — which means at that point the account effectively behaves like a traditional IRA, except every dollar spent on medical costs (which, realistically, is a lot of retirement spending) is still completely tax-free on top of that. It’s a rare setup for a retirement-adjacent account: one that only gets more flexible with age, never less.',
      },
      {
        heading: 'Your checklist for open enrollment',
        body: '1. Check whether your health plan qualifies as a High-Deductible Health Plan (HDHP) — that single fact determines HSA eligibility.\n2. If you’re HSA-eligible, lean toward it over an FSA for money you don’t expect to need this year — it never expires and can be invested.\n3. If you only have FSA access, estimate your actual expected medical spending for the year and fund close to that number, not the max.\n4. Ask your HSA provider what balance unlocks investing, and move money past cash once you clear that threshold.\n5. Changing jobs mid-year? Don’t overfund an FSA — a leftover balance is usually forfeited the day you leave.\n6. Keep medical receipts even for years afterward — you can reimburse yourself from an HSA for a past qualified expense at any point, as long as it happened after the account was opened.',
      },
    ],
    relatedTerms: ['Roth IRA', '401(k)', 'Compound Interest', 'Inflation'],
    faq: [
      {
        q: 'Can I have both an HSA and an FSA at the same time?',
        a: 'Generally no — enrolling in a full-purpose FSA typically makes you ineligible to contribute to an HSA for that plan year. Some employers offer a “limited-purpose FSA” covering only dental and vision, which is specifically designed to pair with an HSA — ask your benefits team if that option exists.',
      },
      {
        q: 'What happens to unused FSA money at the end of the year?',
        a: 'In most cases it’s forfeited back to your employer — FSAs are generally “use it or lose it.” Some plans offer a short grace period or a small carryover amount into the next year, but check your specific plan, since neither is guaranteed.',
      },
      {
        q: 'Is HSA money gone if I don’t use it this year?',
        a: 'No — unlike an FSA, HSA balances roll over completely, year after year, for as long as you have the account. There’s no deadline to spend it.',
      },
      {
        q: 'Can I invest the money in my HSA?',
        a: 'Yes — once your balance crosses a threshold set by your provider (often in the $1,000–$2,000 range), most HSAs let you invest the rest in mutual funds or ETFs, where it can grow tax-free for decades, just like a retirement account.',
      },
    ],
  },
]
