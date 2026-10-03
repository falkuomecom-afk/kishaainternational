'use strict';
/**
 * Editorial seed — programmatic SEO / AEO pillar content.
 * Each guide carries: an answer-first summary (AEO), key takeaways (AIO), a target query
 * mapping (SEO), and body content with tables and sourced figures (GEO citations).
 */
module.exports = function seedPosts(db, ctx) {
  const ins = ctx.ins;
  const J = JSON.stringify;
  const cid = ctx.cid;
  const cats = ctx.cats;

  const posts = [
    {
      category: 'visa-immigration', country: 'canada', target_query: 'Canada 10 year visit visa from Pakistan',
      title: 'Canada 10-Year Multiple Entry Visit Visa: Requirements, Cost and Timeline (2026)',
      answer_summary: 'The Canada 10-year multiple-entry visit visa allows stays of up to six months per visit over a ten-year validity, subject to IRCC approval. Kishaa International files the route with a business Invitation Letter, a sponsor letter and IRCC plus VFS biometric fees for AED 7,500 (about PKR 575,000) paid in three milestones, with processing typically taking 60–70 days. In refusal, only the AED 1,500 submission milestone is retained.',
      key_takeaways: ['Ten-year multiple entry, stays of up to six months per visit, decided solely by IRCC',
        'Business Invitation Letter (LOI) and sponsor letter strengthen the file materially',
        'AED 7,500 total in three milestones: 1,500 submission · 1,500 biometric · 4,500 on approval',
        'Six months of bank statements with stable, explainable balances',
        'Typical processing 60–70 days from a complete submission'],
      tags: ['Canada', 'Visit visa', 'IRCC', 'Business LOI'],
      body: `<h2>What the route actually is</h2><p>Canada issues visitor visas with a validity period that can extend to ten years, aligned to the passport expiry. The "multiple entry" element, not the ten years itself, is what allows repeat visits without reapplying. Officers decide validity and entry at their discretion, so the honest way to plan is to target a strong file rather than a headline number.</p>
<h2>What goes into a strong file</h2><table><thead><tr><th>Component</th><th>Why it matters</th></tr></thead><tbody>
<tr><td>Business Invitation Letter (LOI)</td><td>Establishes a genuine commercial purpose for travel and a reason to return</td></tr>
<tr><td>Sponsor letter</td><td>Explains the source of funds where the applicant's own balance is modest</td></tr>
<tr><td>Six-month bank statements</td><td>Demonstrates stable, explainable balances rather than a single large deposit</td></tr>
<tr><td>Travel history</td><td>Prior compliant travel is the strongest single credibility signal</td></tr>
<tr><td>Ties to country of residence</td><td>Employment, business, property, dependants and ongoing obligations</td></tr>
</tbody></table>
<h2>Costs, separated honestly</h2><p>Our package of AED 7,500 covers the assessment, the business Invitation Letter, the sponsor letter, IRCC filing and the VFS biometric appointment. It is payable in three milestones: AED 1,500 at submission, AED 1,500 at biometrics, and AED 4,500 after approval. If the application is refused, the AED 1,500 submission milestone is retained and the remaining milestones are not charged. Fees paid to IRCC and VFS are included in this package; any additional third-party costs are quoted in writing before they are incurred.</p>
<h2>Timeline reality</h2><p>Processing typically runs 60–70 days for a complete submission. Incomplete files and unverifiable financial evidence are the two most common causes of delay. We advise applicants to plan travel dates with a buffer and never to book non-refundable tickets before a decision.</p>
<h2>Common refusal triggers</h2><ul><li>Funds that appear suddenly without an explainable source</li><li>Purpose of travel described vaguely or inconsistently with the invitation</li><li>Weak ties to the country of residence</li><li>Prior overstays anywhere in the world, including unrelated countries</li></ul>
<p>Where we see these patterns, we say so before filing. A refused application on record is far more expensive than a delayed one.</p>`,
    },
    {
      category: 'study-abroad', country: 'uk', target_query: 'UK student visa maintenance funds 28 day rule',
      title: 'UKVI 28-Day Rule Explained: How Much Must Sit in the Bank for a Student Visa (2026)',
      answer_summary: 'UK student visa applicants must show maintenance funds of £1,483 per month if studying in London, or £1,136 outside London, for a course of nine months or longer — a total of £13,347 or £10,224 — held continuously for 28 days, with the closing balance dated no more than 31 days before the application. Tuition for the first year (or the full course if under one year) is required in addition.',
      key_takeaways: ['London £1,483/month · outside London £1,136/month · capped at nine months',
        'Hold the full amount for 28 consecutive days — a single dip breaks the requirement',
        'The bank statement must close within 31 days of the application date',
        'Tuition is required in addition to maintenance, less any deposit already paid',
        'Dependants add £845 (London) or £680 (outside London) per month, capped at nine months'],
      tags: ['UK', 'UKVI', 'Proof of funds', 'Student visa'],
      body: `<h2>The two numbers that decide your file</h2><table><thead><tr><th>Study location</th><th>Monthly rate</th><th>Nine-month total</th></tr></thead><tbody>
<tr><td>London (within the M25)</td><td>£1,483</td><td>£13,347</td></tr>
<tr><td>Outside London</td><td>£1,136</td><td>£10,224</td></tr></tbody></table>
<p>Courses shorter than nine months require funds for the full course duration rather than a nine-month cap.</p>
<h2>The 28-day rule, precisely</h2><p>The funds must be present in a permitted account, at or above the required level, on every single day of a 28-day period. The closing balance on the statement must be dated within 31 days of the application date. This is the step most applicants fail: money that is moved into a savings account for 30 days and then moved out before the statement is printed does not satisfy the requirement.</p>
<h2>What counts</h2><ul><li>Cash in a bank or building society account in your name, or a joint account, or a parent's account where the relationship is documented</li>
<li>An official financial sponsor or government scholarship letter</li>
<li>Deposits already paid to the university towards tuition, where the institution confirms them</li></ul>
<h2>What does not count</h2><ul><li>Shares, bonds, property or gold</li>
<li>A sponsor's business turnover</li>
<li>Money in an account that is not accessible on demand</li></ul>
<h2>Planning with the calculator</h2><p>Open the <a href="/cost-planner">cost planner</a> and select the United Kingdom with your city and purpose: the planner shows the maintenance figure, its authority and its effective date, separately from flights and living spending. Where a rule is flagged for review it will not compute a figure — instead it asks a counselor to confirm the current amount with you.</p>`,
    },
    {
      category: 'cost-planning', country: 'finland', target_query: 'Finland student residence permit funds 9600 spouse children',
      title: 'Finland Student Permit: Why €9,600 Covers You and Your Family (2026 Guide)',
      answer_summary: 'Finland requires student residence permit applicants to hold €9,600 in personal funds for a twelve-month stay. Unlike most countries, this sum is treated as covering the student together with dependants, so a spouse and children can be included without the separate per-dependant surcharge applied elsewhere. Spouses receive work rights and children attend school free of charge.',
      key_takeaways: ['€9,600 for twelve months — the figure covers the student and dependants',
        'About €6,500 per year in tuition at partner institutions',
        'Spouse receives unrestricted work rights on the family permit',
        'Children receive free education',
        'Permit decisions typically take 4–8 weeks'],
      tags: ['Finland', 'Family', 'Residence permit', 'Proof of funds'],
      body: `<h2>The family advantage</h2><p>Most study destinations make family relocation expensive by requiring additional funds for every dependant. Finland's published student funds requirement of €9,600 for twelve months is designed to cover the student together with family members, which makes the total cost of relocating a household dramatically lower than in comparable destinations.</p>
<h2>What to budget</h2><table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>
<tr><td>Statutory funds (student + dependants)</td><td>€9,600</td></tr>
<tr><td>Tuition at partner institutions</td><td>approx. €6,500 per year</td></tr>
<tr><td>Living costs, Helsinki</td><td>approx. €1,120 per month</td></tr>
<tr><td>Living costs, smaller cities</td><td>approx. €860 per month</td></tr></tbody></table>
<h2>Residence permit and permanent residence</h2><p>Students receive a continuous residence permit. Family members receive permits linked to the student, and spouses can work without the restrictions applied in many other systems. After the qualifying residence period, applicants can move towards permanent residence status subject to the permit and language conditions in force at that time.</p>
<h2>Entrance requirements</h2><p>Finnish institutions typically use entrance examinations or interview-based selection in addition to academic documents. We prepare candidates for the examination format, which is a significant gate that catches unprepared applicants out.</p>`,
    },
    {
      category: 'cost-planning', country: 'germany', target_query: 'Germany blocked account amount 2026 student visa',
      title: 'Germany Blocked Account (Sperrkonto) 2026: Exact Amount and Payout Rules',
      answer_summary: 'Germany requires student visa applicants to fund a blocked account (Sperrkonto) of €11,904 for twelve months, which is released at €992 per month after arrival. The amount is tied to the BAföG student support rate under § 16b AufenthG and rises when that rate rises, so the current figure must be confirmed before transferring money.',
      key_takeaways: ['€11,904 required for a twelve-month stay', 'Monthly payout capped at €992 after arrival',
        'Legal basis is § 16b AufenthG, tied to the BAföG rate', 'Public university tuition is typically nil, with a semester contribution of roughly €150–€400',
        'Dependants require proof of additional funds'],
      tags: ['Germany', 'Sperrkonto', 'Blocked account', 'Student visa'],
      body: `<h2>What a blocked account is</h2><p>A Sperrkonto is a special account opened with an approved provider into which the full statutory amount is deposited before the visa is issued. The student cannot withdraw it all at once: the provider releases a fixed monthly amount after the account is activated in Germany.</p>
<h2>Current figures</h2><table><thead><tr><th>Item</th><th>2026 figure</th></tr></thead><tbody>
<tr><td>Required deposit (12 months)</td><td>€11,904</td></tr>
<tr><td>Monthly withdrawal cap</td><td>€992</td></tr>
<tr><td>Public university semester contribution</td><td>approx. €150–€400</td></tr></tbody></table>
<h2>The mistake to avoid</h2><p>Many applicants transfer the funds and then expect to use the blocked account as their everyday current account. In practice the blocked account releases money into an ordinary German current account you open after arrival — arrange that in the first week, because rent and semester fees are usually collected by direct debit.</p>
<h2>Why our planner shows this rule as official</h2><p>The figure is published with its issuing authority, its legal basis and an effective date, and it is versioned. If the BAföG rate changes and the rule has not yet been reconfirmed by our reviewer, the planner stops calculating and asks a counselor to verify the amount with you rather than showing a stale number.</p>`,
    },
    {
      category: 'study-abroad', country: 'georgia', target_query: 'Georgia MBBS for Pakistani students no IELTS fees',
      title: 'Georgia MBBS for Pakistani Students: Fees, Recognition and Study Gaps (2026)',
      answer_summary: 'Georgian medical universities charge approximately $4,000–$5,000 per year for MBBS and BDS programs, with broader tuition across specialisations ranging $2,000–$8,000. Study gaps are accepted, IELTS is not required for qualifying applicants, and monthly living costs are around $1,100. Recognition should be checked against MCI and WHO listings before applying, because recognition is program-specific rather than institution-wide.',
      key_takeaways: ['MBBS/BDS tuition approximately $4,000–$5,000 per year',
        'No IELTS requirement for qualifying applicants', 'Study gaps accepted with an explanation strategy',
        'Living costs approximately $1,100 per month', 'Verify program-level recognition against MCI and WHO listings'],
      tags: ['Georgia', 'MBBS', 'Study abroad', 'No IELTS'],
      body: `<h2>Why Georgia is popular</h2><p>Georgia combines English-medium medical instruction, low tuition, no entrance examination for most programs and an admission cycle that accepts applicants with study gaps. For families who cannot fund £15,000-per-year tuition, it is often the only route to a recognised medical degree.</p>
<h2>Costs in detail</h2><table><thead><tr><th>Item</th><th>Typical amount</th></tr></thead><tbody>
<tr><td>MBBS / BDS tuition</td><td>$4,000–$5,000 per year</td></tr>
<tr><td>Other programs</td><td>$2,000–$8,000 per year</td></tr>
<tr><td>Living costs (Tbilisi, standard)</td><td>approx. $1,100 per month</td></tr>
<tr><td>Living costs (Batumi, budget)</td><td>approx. $605 per month</td></tr></tbody></table>
<h2>The recognition question</h2><p>Recognition is the single most important issue and it is program-level. Before paying any tuition, confirm that the specific program appears on the relevant listings for the country where you intend to practise. We check this with you at assessment stage and we decline to place students on programs that do not meet the requirement for their intended destination of practice.</p>
<h2>Study gaps</h2><p>Gaps are accepted, but unexplained gaps are a visa risk. We prepare a written explanation covering what you did during the gap — employment, further study, family responsibilities — and, where relevant, evidence to support it.</p>`,
    },
    {
      category: 'ielts-cambridge', target_query: 'IELTS 7.5 academic preparation plan',
      title: 'How to Move from Band 6.5 to 7.5 in IELTS Academic: A Ten-Week Plan',
      answer_summary: 'Moving from 6.5 to 7.5 in IELTS Academic is usually a writing and speaking precision problem rather than a vocabulary problem. The fastest route is a diagnostic test, a written roadmap stating the band each skill must reach, marked writing feedback on every submission, and full mock examinations under exam conditions. Twelve marked writing tasks and four mocks is the minimum realistic cycle for a one-band improvement.',
      key_takeaways: ['Diagnose first — the weakest skill decides your overall band',
        'Writing Task 2 coherence and task response move the band more than vocabulary range',
        'Twelve marked writing tasks is the practical minimum for a one-band gain',
        'Four full mocks under exam conditions reveal timing failures, not just knowledge gaps',
        'Speaking improves fastest with recorded, structured feedback rather than more practice alone'],
      tags: ['IELTS', 'Academic', 'Band 7.5', 'Study plan'],
      body: `<h2>Where the band actually goes</h2><p>Most candidates at 6.5 lose marks in exactly two places: Writing Task 2 task response and coherence, and Speaking fluency under pressure. Vocabulary range is rarely the binding constraint. This is why a diagnostic test matters — working on the wrong skill for ten weeks produces no band movement and considerable frustration.</p>
<h2>A ten-week structure</h2><table><thead><tr><th>Weeks</th><th>Focus</th><th>Deliverable</th></tr></thead><tbody>
<tr><td>1</td><td>Diagnostic across four skills</td><td>Written roadmap with per-skill targets</td></tr>
<tr><td>2–4</td><td>Writing Task 1 and 2 structures with marked submissions</td><td>Six marked essays with error analysis</td></tr>
<tr><td>5–6</td><td>Listening and Reading timing drills</td><td>Two mocks with time-per-section logs</td></tr>
<tr><td>7–8</td><td>Speaking fluent-response practice, recorded</td><td>Four recorded speaking sets with feedback</td></tr>
<tr><td>9–10</td><td>Full mocks and test-day strategy</td><td>Two mocks plus final strategy session</td></tr></tbody></table>
<h2>What marked feedback changes</h2><p>Unmarked writing practice reinforces errors. Each submission in our course is returned with the four IELTS criteria scored separately, so you can see whether you are losing band on task response, coherence, lexical resource or grammar — and therefore what to fix first.</p>
<h2>General Training vs Academic</h2><p>General Training writing is a different task type with different expectations. If you need General Training for migration, do not prepare with Academic materials — the task-achievement criteria will mislead you.</p>`,
    },
    {
      category: 'visa-immigration', country: 'uae', target_query: 'UAE Golden Visa categories 2026',
      title: 'UAE Golden Visa and Freelance Permit: Which Category Actually Fits You?',
      answer_summary: 'UAE long-term residency is issued under several distinct categories through ICP and GDRFA, including investor, skilled professional, outstanding student and talent routes, while many professionals are better served by a Freelance Permit with residence. Category criteria are updated without a fixed cycle, so eligibility must be confirmed against the current published thresholds rather than cached guidance.',
      key_takeaways: ['Category criteria are set by ICP/GDRFA and change without a fixed cycle',
        'A Freelance Permit with residence is often the faster, cheaper route for self-employed professionals',
        'Attested educational and professional documents are required in every category',
        'Medical fitness testing and Emirates ID enrolment are part of every residence issuance',
        'Renewal dates should be tracked from the day the visa is stamped'],
      tags: ['UAE', 'Golden Visa', 'Freelance', 'PRO'],
      body: `<h2>Categories, plainly</h2><table><thead><tr><th>Route</th><th>Typical applicant</th><th>Key evidence</th></tr></thead><tbody>
<tr><td>Golden Visa — investor</td><td>Property or capital investors meeting current thresholds</td><td>Title deeds or attested financial evidence</td></tr>
<tr><td>Golden Visa — skilled professional</td><td>Degree-holding professionals in qualifying fields</td><td>Attested degree, salary certificate, contract</td></tr>
<tr><td>Freelance Permit + residence</td><td>Self-employed professionals and consultants</td><td>Qualification evidence, activity permit, insurance</td></tr>
<tr><td>Family sponsorship</td><td>Residents sponsoring spouse, children, parents</td><td>Salary threshold, attested marriage and birth certificates</td></tr></tbody></table>
<h2>Why we do not publish fixed thresholds</h2><p>ICP and GDRFA revise category criteria and fees without a fixed publication cycle. Publishing a number that becomes wrong is worse than publishing none, so our planner flags these routes for reviewer confirmation and our team verifies the current position for your category at assessment stage.</p>
<h2>Document attestation</h2><p>Nearly every delay we see traces back to attestation. Degrees must be attested through the correct chain for the issuing country and, where required, verified by the relevant UAE authority. Start attestation before you start anything else.</p>`,
    },
    {
      category: 'cost-planning', target_query: null,
      title: 'Monthly Living Cost in the UK: London vs Manchester vs Glasgow (2026)',
      answer_summary: 'A student in London should budget approximately £2,085 per month on a standard profile, compared with about £1,290 in Manchester and £1,090 in Glasgow. Rental accommodation is the dominant variable: a standard London room or studio costs roughly £1,150 against £700 in Manchester and £520 in Glasgow.',
      key_takeaways: ['London standard monthly budget approximately £2,085',
        'Manchester approximately £1,290 and Glasgow approximately £1,090 on the same profile',
        'Rent is 55–70% of the difference between cities',
        'London maintenance funds are £1,483 per month against £1,136 elsewhere',
        'Regional cities reduce total cost by roughly 35–50% over a year'],
      tags: ['UK', 'Living costs', 'London', 'Manchester'],
      body: `<h2>City comparison, standard profile</h2><table><thead><tr><th>Category</th><th>London</th><th>Manchester</th><th>Glasgow</th></tr></thead><tbody>
<tr><td>Rent</td><td>£1,150</td><td>£700</td><td>£520</td></tr>
<tr><td>Food &amp; groceries</td><td>£420</td><td>£310</td><td>£250</td></tr>
<tr><td>Transit</td><td>£165</td><td>£100</td><td>£80</td></tr>
<tr><td>Insurance</td><td>£60</td><td>£45</td><td>£40</td></tr>
<tr><td>Utilities &amp; SIM</td><td>£150</td><td>£125</td><td>£105</td></tr>
<tr><td>Contingency</td><td>£140</td><td>£110</td><td>£90</td></tr>
<tr><td><strong>Total</strong></td><td><strong>£2,085</strong></td><td><strong>£1,390</strong></td><td><strong>£1,085</strong></td></tr></tbody></table>
<h2>Reading these numbers correctly</h2><p>These are maintained statistical estimates, not quotations. They carry an observation date and are refreshed on a semi-annual cycle. Your personal figure depends on whether you take university halls, a shared house or a private studio, and whether you cook or eat out.</p>
<h2>The maintenance-funds connection</h2><p>Your visa maintenance requirement is set at £1,483 (London) or £1,136 (outside London) per month for up to nine months. Notice that the London requirement sits below a standard London budget, which is why students who move to expensive central accommodation frequently run short in the second term. Plan accommodation before you plan anything else.</p>`,
    },
    {
      category: 'cost-planning', target_query: 'flight tickets from Pakistan to Dubai price',
      title: 'Flight Tickets from Pakistan to Dubai and Europe: How Seasonal Pricing Works',
      answer_summary: 'Flight prices on Pakistan–Gulf and Pakistan–Europe routes move mainly with seasonality and cabin class rather than with the base fare alone. Summer and December travel carries multipliers of roughly 15–25% on top of shoulder-season fares, while business class typically costs three times the economy fare on the same route.',
      key_takeaways: ['Seasonality multipliers peak in July and December at roughly 1.22–1.25',
        'Shoulder months — February, March, October, November — are the cheapest windows',
        'Business class costs roughly 3.1× economy on the same route',
        'Excess baggage is charged per kilogram above the standard allowance',
        'Live quotes expire; always reconfirm before paying'],
      tags: ['Flights', 'Cost planning', 'Seasonality'],
      body: `<h2>The pricing formula we use</h2><p>Base airfare + departure and security taxes + fuel surcharge + baggage allowance, adjusted by cabin multiplier and a seasonal multiplier for the travel month. Breaking the fare into these components makes the seasonal effect visible instead of hidden inside a single number.</p>
<h2>Seasonal multipliers by month</h2><table><thead><tr><th>Period</th><th>Multiplier</th><th>Interpretation</th></tr></thead><tbody>
<tr><td>February, March, November</td><td>0.95–0.98</td><td>Cheapest window</td></tr>
<tr><td>April, May, October</td><td>1.00–1.05</td><td>Shoulder season</td></tr>
<tr><td>June, September</td><td>1.05–1.15</td><td>Early summer and return peak</td></tr>
<tr><td>July, August, December</td><td>1.15–1.25</td><td>Peak — book early or shift dates</td></tr></tbody></table>
<h2>What "live" means here</h2><p>A fare is live only when an approved airline API returns a quote for the exact itinerary, cabin and baggage allowance with a booking timestamp. When no provider is connected, the planner labels the figure as a maintained route-matrix estimate rather than pretending it is a live quote — and the label is visible on the result, not buried in small print.</p>
<h2>Practical booking rules</h2><ul><li>Student fares often allow extra baggage — ask before paying a standard fare</li>
<li>A flexible ticket is worth the premium if your visa decision date is uncertain</li>
<li>Tue–Thu departures are frequently cheaper than weekend departures on the same route</li></ul>`,
    },
    {
      category: 'study-abroad', country: 'italy', target_query: 'Italy free tuition scholarship Pakistani students',
      title: 'Italy Free Tuition Scholarships for Pakistani Students: Eligibility and Timelines',
      answer_summary: 'Italy offers English-taught degrees where tuition can be fully covered by regional and merit scholarships, with a partial-funding route charging €3,600 in year one and becoming free thereafter. Applicants typically evidence PKR 4.5–5.5 million from the applicant or a blood relative, and free or subsidised accommodation is available in several university cities. Scholarship windows close early, so documents must be prepared months in advance.',
      key_takeaways: ['Fully funded route: tuition free, plus free accommodation options',
        'Partial route: €3,600 year one, then free', 'Financial evidence PKR 4.5–5.5M from applicant or blood relative',
        'Pre-enrolment on Universitaly is mandatory', 'Scholarship deadlines fall months before the September intake'],
      tags: ['Italy', 'Scholarship', 'Free tuition', 'Europe'],
      body: `<h2>Two funding routes</h2><table><thead><tr><th>Route</th><th>Tuition</th><th>Accommodation</th></tr></thead><tbody>
<tr><td>Fully funded scholarship</td><td>Free</td><td>Free or heavily subsidised in participating cities</td></tr>
<tr><td>Partial funding</td><td>€3,600 in year 1, free from year 2</td><td>Applicant arranges</td></tr></tbody></table>
<h2>Documents that decide the outcome</h2><p>Scholarship assessment depends on your academic record, the completeness of the dossier and, critically, whether the financial evidence is in the accepted format. The Italian authorities accept funds held by the applicant or by a blood relative where the relationship is documented — which means a family member's bank statement can support the application when structured correctly.</p>
<h2>Timeline</h2><p>Applications for the following September typically open around November and scholarship windows close early in the year. Starting in January for a September intake is comfortable; starting in June is not. Students who miss a scholarship window can still enrol on the partial-funding route.</p>
<h2>Language</h2><p>A large and growing catalogue of Italian degrees is taught entirely in English, particularly at master's level. Italian language ability is not required for admission to these programs, though learning basic Italian materially improves daily life and part-time work prospects.</p>`,
    },
    {
      category: 'visa-immigration', target_query: 'Schengen visa refusal reasons Pakistan',
      title: 'Why Schengen Visa Applications Get Refused — and How to Build a File That Holds',
      answer_summary: 'The most common Schengen refusal grounds are insufficient proof of purpose, unreliable financial evidence, weak ties to the country of residence, and inconsistent travel history. Refusals are recorded and make subsequent applications harder, which is why an honest pre-filing assessment is more valuable than an optimistic one.',
      key_takeaways: ['Purpose, funds, ties and consistency decide most outcomes',
        'A refusal record materially weakens later applications',
        'Bank statements must show explainable history, not a recent lump sum',
        'Travel insurance must cover the entire Schengen area for the full period',
        'Book refundable travel only until the visa is issued'],
      tags: ['Schengen', 'Refusal', 'Europe', 'Visa'],
      body: `<h2>The four pillars</h2><table><thead><tr><th>Pillar</th><th>What officers look for</th></tr></thead><tbody>
<tr><td>Purpose</td><td>A specific, documented reason for the dates you have chosen</td></tr>
<tr><td>Funds</td><td>Stable balances with explainable sources over months rather than days</td></tr>
<tr><td>Ties</td><td>Employment, business, property, dependants and obligations that require your return</td></tr>
<tr><td>Consistency</td><td>Dates, itinerary, accommodation and insurance that agree with each other</td></tr></tbody></table>
<h2>Why we screen before filing</h2><p>We ask for the same evidence an officer will examine, then tell you what an officer is likely to conclude. If the answer is "refuse", we say so and propose what to change — more time in the account, a different route, a sponsor letter, or simply waiting. Losing a fee is irritating; acquiring a refusal record is costly.</p>
<h2>Booking discipline</h2><p>Book refundable or changeable travel until the visa is in your passport. Officers routinely see non-refundable bookings presented as evidence and treat the resulting inflexibility as a credibility problem when dates shift.</p>`,
    },
    {
      category: 'ielts-cambridge', target_query: 'IELTS vs PTE for Australia',
      title: 'IELTS vs PTE for Australia: Which Test Should You Take?',
      answer_summary: 'Both IELTS and PTE Academic are accepted for Australian study and migration, but they measure the same skills differently. IELTS uses human examiners for speaking and rewards structured, natural delivery; PTE is entirely computer-scored, faster to book and returns results in about 48 hours. Candidates who speak clearly but write more slowly tend to score better on IELTS; candidates who are comfortable with fast keyboard work and integrated tasks often score higher on PTE.',
      key_takeaways: ['Both are accepted for Australian study and skilled migration',
        'PTE is fully computer-scored; IELTS speaking is assessed by a trained examiner',
        'PTE results typically return in about 48 hours; IELTS in 3–5 days on computer',
        'Integrated skills tasks on PTE suit candidates with strong keyboard speed',
        'Prepare for the specific test format — the underlying skills transfer, the technique does not'],
      tags: ['IELTS', 'PTE', 'Australia', 'Comparison'],
      body: `<h2>Side-by-side</h2><table><thead><tr><th></th><th>IELTS</th><th>PTE Academic</th></tr></thead><tbody>
<tr><td>Scoring</td><td>Examiner-assessed speaking and writing</td><td>Fully computer-scored</td></tr>
<tr><td>Results</td><td>3–5 days (computer), 13 days (paper)</td><td>Typically about 48 hours</td></tr>
<tr><td>Speaking</td><td>Live interview with an examiner</td><td>Recorded responses to prompts</td></tr>
<tr><td>Best suited to</td><td>Fluent, structured speakers</td><td>Fast, accurate keyboard users</td></tr>
<tr><td>Validity for Australia</td><td>Accepted for study and migration</td><td>Accepted for study and migration</td></tr></tbody></table>
<h2>How to actually choose</h2><p>Take a timed diagnostic in both formats if you are unsure. The score difference between formats for the same candidate is frequently half a band, which matters when a visa threshold sits exactly at your current level. Do not choose on the basis of which test a friend found easier.</p>
<h2>Where preparation effort goes</h2><p>Roughly 80% of the skill work — vocabulary, reading speed, listening accuracy, essay structure — transfers between formats. The remaining 20% is technique specific to the test interface, and that 20% is where the band is usually lost or won.</p>`,
    },
    {
      category: 'visa-immigration', target_query: 'Romania Serbia work permit Pakistan 2026',
      title: 'Romania and Serbia Work Permits: What a Realistic Timeline Looks Like',
      answer_summary: 'Romania releases non-EU work-permit quotas annually and processes long-stay visas in roughly 6–14 weeks, while Serbia processes work-permit routes in about 2–10 weeks with considerably lower living costs. In both cases the employer must be verified before any payment, and contract terms should state the salary, hours, accommodation and duration in writing.',
      key_takeaways: ['Romania: annual quota, long-stay visa 6–14 weeks',
        'Serbia: 2–10 weeks, lower living costs, simplified entry for many nationalities',
        'Verify the employer and the permit approval before paying fees',
        'Contract must state salary, hours, accommodation and duration in writing',
        'Criminal record certificates and attested documents are required in both'],
      tags: ['Romania', 'Serbia', 'Work permit', 'Europe'],
      body: `<h2>Romania</h2><p>Non-EU workers require an employment approval issued within the annual quota before a long-stay visa can be filed. Quotas are released periodically and fill quickly, so timing matters as much as eligibility. Living costs are among the lowest in the EU, and family reunification is possible once residence is established.</p>
<h2>Serbia</h2><p>Serbia offers a faster route with lower costs and simplified entry for many nationalities, including UAE residents and Pakistani passport holders in many cases. Temporary residence permits can be extended and, over time, converted to longer-stay status subject to current rules.</p>
<h2>Employer verification</h2><p>Any employer who asks for money in exchange for a job offer, who will not provide a written contract before payment, or who cannot produce evidence of a valid permit allocation should be treated with suspicion. We verify employers before recommending a route and we decline cases where the offer cannot be substantiated.</p>
<h2>What a complete contract should state</h2><ul><li>Gross and net salary, and payment frequency</li><li>Contracted weekly hours and overtime treatment</li><li>Accommodation arrangements and who pays for what</li><li>Contract duration and renewal conditions</li><li>Employer registration details that can be independently checked</li></ul>`,
    },
    {
      category: 'study-abroad', country: 'australia', target_query: 'Australia student visa 500 financial capacity OSHC genuine student',
      title: 'Australia Subclass 500: Financial Capacity, OSHC and the Genuine Student Requirement',
      answer_summary: 'The Australian subclass 500 student visa requires a Confirmation of Enrolment from a CRICOS-registered provider, Overseas Student Health Cover, English evidence as required by the provider, and evidence of financial capacity covering living costs, tuition and travel. The financial capacity figure is indexed periodically by the Department of Home Affairs and must be confirmed against the current published amount before lodging.',
      key_takeaways: ['Confirmation of Enrolment from a CRICOS-registered provider is mandatory',
        'Overseas Student Health Cover must be held for the full course duration',
        'Financial capacity covers living costs, tuition and travel — the figure is indexed periodically',
        'The Genuine Student requirement is assessed in writing, not just at interview',
        'Post-study work rights depend on the qualification level completed'],
      tags: ['Australia', 'Subclass 500', 'OSHC', 'Proof of funds'],
        body: `<h2>What must be in place before lodging</h2><table><thead><tr><th>Requirement</th><th>Detail</th></tr></thead><tbody>
<tr><td>Confirmation of Enrolment</td><td>Issued by a CRICOS-registered provider after the deposit is paid</td></tr>
<tr><td>Overseas Student Health Cover</td><td>Minimum cover for the duration of the course</td></tr>
<tr><td>English evidence</td><td>Per provider and program requirements; IELTS or PTE both accepted</td></tr>
<tr><td>Financial capacity</td><td>Living costs, tuition and travel — indexed periodically, so confirm the current figure</td></tr>
<tr><td>Genuine Student statement</td><td>Written responses explaining your course choice, its value to your career and your intentions</td></tr></tbody></table>
<h2>The indexed figure problem</h2><p>The financial capacity amount is adjusted by the Department of Home Affairs from time to time. Because a superseded figure can cause a refusal, our planner holds this rule as pending review rather than presenting a stale number, and routes it to a counselor to confirm with you against the current legislation.</p>
<h2>The Genuine Student requirement</h2><p>Assessors read for specificity. A statement that could be copied into any applicant's file is a liability. Explain why this course, at this institution, at this point in your career — and what you will do next.</p>
<h2>Post-study work rights</h2><p>Work rights after graduation depend on the qualification level and on the rules in force at the time you apply. We brief you on the current position during planning so that your course choice matches your longer-term migration objective.</p>`,
    },
  ];

  const authorId = db.prepare("SELECT id FROM users WHERE role = 'administrator' ORDER BY id LIMIT 1").get()?.id
    || db.prepare('SELECT id FROM users ORDER BY id LIMIT 1').get().id;
  const inserted = [];
  for (const p of posts) {
    const daysAgo = createdDays(posts.indexOf(p));
    const id = ins('posts', {
      title: p.title, slug: require('../lib/helpers').slugify(p.title),
      excerpt: p.answer_summary.slice(0, 220),
      body: p.body, category_id: cats[p.category], tags: J(p.tags || []),
      author_id: authorId, status: 'published',
      publish_at: daysAgo, answer_summary: p.answer_summary,
      key_takeaways: J(p.key_takeaways || []),
      seo_title: p.title.length > 60 ? p.title.slice(0, 57) + '…' : p.title,
      seo_description: p.answer_summary.slice(0, 300),
      target_query: p.target_query, primary_pillar: p.category,
      read_minutes: Math.max(3, Math.round(p.body.replace(/<[^>]*>/g, ' ').split(/\s+/).length / 200)),
      views: 40 + Math.round(Math.random() * 900),
      geo_summary: p.answer_summary.slice(0, 320),
      created_at: daysAgo, updated_at: daysAgo,
    });
    inserted.push(id);
  }

  function createdDays(i) {
    const d = new Date(Date.now() - (i * 9 + 3) * 86400e3);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  return inserted;
};
