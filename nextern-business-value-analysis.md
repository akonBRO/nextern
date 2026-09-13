# Nextern — Bangladesh Business Value Analysis

## PART 1 — Complete Understanding of Nextern

### Evidence and classification standard

This report uses four labels consistently:

- **ACTUAL** — directly observed in Nextern's current source code or subsequently evidenced by an auditable Nextern record. A configured price is actual product configuration; it is not actual revenue.
- **VERIFIED MARKET DATA** — published Bangladesh-specific data from an identified source and year.
- **CALCULATED ESTIMATE** — arithmetic derived from verified data, with the formula shown.
- **BUSINESS PROJECTION** — a future operating target based on explicit assumptions. It is not historical performance.

### What Nextern is

Nextern is a Bangladesh-focused, multi-sided campus-to-career platform. It is designed to convert employer requirements into student guidance, applications and assessments, while returning aggregate readiness signals to academic advisors and department heads.

Its strongest defensible positioning is **not merely “AI job matching.”** Bangladeshi products such as Chakri.ai already market AI matching, résumé tools and interviews. Nextern's more distinctive proposition is a closed campus data loop:

`Employer requirements → student fit/gaps → learning and mentoring actions → applications/assessments → verified outcomes → advisor and department insight`

The product is substantially implemented in code, including role-specific dashboards, database models and API routes. That demonstrates product scope—not production reliability, adoption or outcomes.

### Stakeholders, features and measurable value

| Stakeholder  | Code-implemented capability                                                            | Bangladesh problem addressed                                                | Defensible annual KPI                                                                    |
| ------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Students     | AI skill-gap analysis using profile skills, CGPA and courses against role requirements | Students often do not know what a role requires or why they are not a match | Unique students analyzed; recommended actions completed                                  |
| Students     | Internship fit score and job recommendations                                           | Search noise and indiscriminate applications                                | Applying students; applications per interview; recommendation-to-application rate        |
| Students     | Personalized training path                                                             | A skill diagnosis alone does not create action                              | Learning actions started/completed; repeat assessment improvement                        |
| Students     | Opportunity Score                                                                      | No single view of platform activity and readiness                           | Score movement, but only after its predictive validity is tested                         |
| Students     | Résumé builder and review                                                              | Unequal access to professional application support                          | Résumés completed; time to complete; recruiter progression rate                          |
| Students     | Graduation Evaluation Report (GER)                                                     | Fragmented evidence of academic and career preparation                      | Reports generated/viewed; employer acceptance—without calling it a university credential |
| Students     | Alumni mentorship and sessions                                                         | Limited professional networks and guidance                                  | Completed mentor sessions; mentee action completion                                      |
| Students     | Applications, assessments, interviews, messaging and calendar                          | Fragmented transition from discovery to interview                           | Applications, interviews and employer-confirmed starts                                   |
| Employers    | Applicant fit scores and AI-assisted shortlist                                         | High-volume, inconsistent first-pass screening                              | Application records scored; time per first-pass review; shortlist acceptance             |
| Employers    | Batch hiring and cross-university workflows                                            | Repeated campus-by-campus recruitment work                                  | Campuses reached per campaign; opportunities; hires per campaign                         |
| Employers    | Structured student profiles, academic reviews and work evidence                        | Difficulty comparing early-career candidates with little formal experience  | Profile completeness; evidence coverage; assessment-to-interview conversion              |
| Employers    | Coding/other assessments, video interviews, messaging and scheduling                   | Tool fragmentation and coordination delay                                   | Assessment completion; scheduling cycle time; interview completion                       |
| Universities | Career-readiness dashboard and distribution                                            | Limited timely visibility across a cohort                                   | Students with current readiness records; ready/developing/support-needed distribution    |
| Universities | Skill-gap heatmaps and industry alignment                                              | Curriculum and training decisions lack current employer-demand signals      | Skills below benchmark; departments reviewing data; interventions launched               |
| Universities | Advisor reviews and AI-assisted training plans                                         | Career support is difficult to personalize at scale                         | Students reviewed; plans assigned; follow-up completion                                  |
| Universities | Department reports and semester trends                                                 | Reporting is often periodic and fragmented                                  | Cohorts/departments analyzed; report cycle time; term-over-term movement                 |

The core AI skill-gap route is grounded in student and job fields, and stores the resulting fit score, gaps and suggested path; it is therefore more than a static mock-up. However, there is no evidence supplied that these scores predict hiring success or are free from bias. See the [skill-gap route](./src/app/api/ai/skill-gap/route.ts), [Opportunity Score logic](./src/lib/opportunity-score.ts), and [department reporting interface](./src/app/dept/report/page.tsx).

### Current monetization implemented in the product

- **Student Premium: BDT 299/month — ACTUAL product configuration.** It expands AI analyses, mock interviews, recommendations, résumé review, mentorship and GER export.
- **Employer Premium: BDT 1,499/month — ACTUAL product configuration.** It expands postings, batch hiring, applicant analysis, assessments, interviews and analytics.
- **Freelance marketplace fee: 15% — ACTUAL product configuration.** No verified gross merchandise value was supplied, so this stream is excluded from the financial forecast.
- **University licensing — possible future model, not currently priced.** It fits the institutional dashboards, but should not enter revenue claims until a paid pilot or signed commercial proposal exists.

The configuration is visible in [subscription-plans.ts](./src/lib/subscription-plans.ts) and [freelance-shared.ts](./src/lib/freelance-shared.ts). Payment routes for bKash and Stripe exist, but code presence does not prove paid transactions.

### Product-evidence audit

| Website statement               | What the code establishes                                                                         | Required classification now                       | Poster decision                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| 2,400+ active/enrolled students | The value is literal landing-page text; no supporting analytics export was supplied               | **Platform-stated figure requiring verification** | Do not use                                |
| 340+ companies hiring           | Literal landing-page text; no company/activity ledger was supplied                                | **Platform-stated figure requiring verification** | Do not use                                |
| 14 or 14+ partner universities  | Literal marketing text and a list of selectable universities do not establish signed partnerships | **Platform-stated figure requiring verification** | Do not use as actual                      |
| 89% placement rate              | Literal marketing text; no cohort, denominator, period or placement confirmations were supplied   | **Platform-stated figure requiring verification** | Remove until audited                      |
| Student/employer prices         | Single source-of-truth configuration is present                                                   | **ACTUAL configuration**                          | May use as pricing, not revenue           |
| 15% freelance fee               | Fee constant and deduction logic are present                                                      | **ACTUAL configuration**                          | May describe; do not forecast without GMV |

Two additional integrity issues matter. First, students are currently auto-approved at registration, so “verified academic profile” should be described as a **profile and academic-review workflow**, not registrar-grade credential verification. Second, Premium marketing says two free mentorship requests per month while the limit constant is 20; this contradiction should be corrected before public pricing is promoted.

### Business value thesis

- **Student value:** less uncertainty, more relevant preparation and a more navigable internship journey.
- **Employer value:** structured early-talent evidence and a shorter, more consistent first-pass workflow.
- **University value:** aggregated, current signals for targeted advising, training and curriculum discussion.
- **Nextern value:** freemium network acquisition, recurring student/employer subscriptions, and later institutional licensing or marketplace fees after validation.

## PART 2 — Bangladesh Market & Problem Analysis

### Bangladesh evidence snapshot

| Evidence                                                                                                                           |                                    Value |              Year | Classification           | Interpretation                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------: | ----------------: | ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Public/private universities under the UGC's 2023 umbrella                                                                          |                                      163 |              2023 | **VERIFIED MARKET DATA** | Broad institutional universe; not every institution supplied comparable student data                            |
| Students in 50 regular public universities, excluding National, Open and Islamic Arabic university systems and affiliated colleges |                                  296,696 |              2023 | **VERIFIED MARKET DATA** | Comparable direct-campus public-university population                                                           |
| Undergraduate honours students in those 50 public universities                                                                     |                                  232,595 |              2023 | **VERIFIED MARKET DATA** | Core public undergraduate market                                                                                |
| Students in reporting private universities                                                                                         |                                  358,414 |              2023 | **VERIFIED MARKET DATA** | UGC reports academic activity/data for 103 private universities                                                 |
| Annual direct-campus honours admissions                                                                                            |                                  178,282 |              2023 | **CALCULATED ESTIMATE**  | 49,883 public first-year + 128,399 private new honours admissions                                               |
| Direct-campus graduates                                                                                                            |                                  158,643 |              2022 | **CALCULATED ESTIMATE**  | 86,237 from 50 public universities + 72,406 private; useful annual flow, but one year older than the stock data |
| University-graduate unemployment rate                                                                                              |                                   13.54% |              2024 | **VERIFIED MARKET DATA** | Highest unemployment rate among education levels in BBS LFS 2024; about 885,000 unemployed graduates            |
| Youth unemployment, ages 15–29                                                                                                     |                                       8% |              2022 | **VERIFIED MARKET DATA** | Broader youth context; not interchangeable with graduate unemployment                                           |
| Youth not in employment, education or training                                                                                     |                                      22% |              2022 | **VERIFIED MARKET DATA** | Indicates school-to-work exclusion; women 27.1%, men 16.2%                                                      |
| Individual internet use                                                                                                            | 53.4% national; 75.7% urban; 43.6% rural |         FY2024–25 | **VERIFIED MARKET DATA** | A digital platform is viable, but access is unequal and these rates are not student-specific                    |
| Registered public and private limited companies                                                                                    |                                  229,289 | Through Feb. 2026 | **CALCULATED ESTIMATE**  | 3,835 public + 225,454 private; a legal upper universe, not active firms or intern hirers                       |

The higher-education figures come from the [UGC 50th Annual Report 2023](https://ugc.gov.bd/pages/annual-reports/%E0%A7%AB%E0%A7%A6%E0%A6%A4%E0%A6%AE-%E0%A6%AC%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%B7%E0%A6%BF%E0%A6%95-%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%A4%E0%A6%BF%E0%A6%AC%E0%A7%87%E0%A6%A6%E0%A6%A8-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%A9-93bc29-6922de8f933eb65569e1b95b), released in 2025. The graduate-flow breakdown is reproduced from UGC 2022 in the Government task-force chapter on the [Youth Unemployment Paradox](https://gedkp.gov.bd/wp-content/uploads/2025/04/7.-Final-Report-of-Task-Force-April-2025.pdf). BBS publishes the [LFS 2024 final report](https://bbs.gov.bd/site/page/111d09ce-718a-4ae6-8188-f7d938ada348/Labour-%26-Employment); the 13.54% rate and 885,000 figure are also reported directly from it by [The Daily Star](https://online.thedailystar.net/business/news/bangladesh-had-9-lakh-unemployed-graduates-2024-3983696) and [The Business Standard](https://www.tbsnews.net/bangladesh/unemployment-rises-366-2024-higher-among-educated-1234376). Digital-access figures come from the [BBS ICT survey page](https://bbs.gov.bd/pages/static-pages/6922e012933eb65569e25543) and its 2026 release coverage in [The Daily Star](https://www.thedailystar.net/business/economy/news/rural-areas-lag-behind-digital-divide-persists-4153326). The company count is from the [RJSC February 2026 statistics](https://roc.gov.bd/site/page/2f14b592-33c7-4931-b276-e16b0a9ded0d/Statistics-of-RJSC).

### Problem → evidence → scale → value → Nextern response

| Problem                                                      | Bangladesh-specific evidence and scale                                                                                                                                                                                                                                                                                                                                                                                      | Economic/social consequence                                                                           | Nextern response                                                                                                         |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Students cannot translate degrees into employer-ready skills | BBS reports 13.54% unemployment among university graduates in 2024. The World Bank identifies gaps in problem-solving, work attitude, communication, teamwork and adaptability. Older employer/tracer evidence found problem-solving, ICT and communication among the areas graduates most needed to strengthen.                                                                                                            | Longer transitions, discouraged search, underemployment and wasted education investment               | Role-specific gap analysis, training path, assessments, mock interviews and readiness tracking                           |
| Students lack clear opportunity and fit information          | The World Bank describes information constraints and mismatch between graduate competencies and employer demand. In its 2024 Bangladesh youth discussions, students requested stronger career counselling, alumni links, private-sector internships and job fairs.                                                                                                                                                          | Higher search cost, indiscriminate applications, network-based inequality                             | Fit scores, recommendations, application tracking, mentoring and employer messaging                                      |
| Internship supply and fresh-graduate pathways are uneven     | In CPD's exploratory 2024 survey of 250 employed young people, respondents said their organizations offered paid internships (52%), unpaid internships (12%) or no internships (36%); only 42% reported a dedicated fresh-graduate program. This sample is directional, not nationally representative.                                                                                                                      | Students struggle to acquire the experience employers seek; access depends on institution and network | A structured internship marketplace plus cross-campus employer distribution                                              |
| Employers must compare many thin early-career profiles       | Bangladesh-specific national evidence on average CV volume or minutes screened was not found. However, employers' stated skills needs and the presence of AI screening products in the local market support the problem's relevance—not a claimed saving.                                                                                                                                                                   | Recruiter time, inconsistent screening and missed candidates                                          | Structured requirements, application-level fit analysis, batch actions and assessments; time saving must be pilot-tested |
| Employer access is fragmented across campuses                | Career offices can provide valuable workshops, job boards, visits and alumni support, but provision varies by institution. ULAB's career office is one positive example, not a national standard.                                                                                                                                                                                                                           | Smaller employers and students outside top networks may not meet efficiently                          | Cross-university opportunities, messaging, scheduling and shared talent workflows                                        |
| Universities lack continuous, comparable readiness data      | The World Bank reports a need for stronger institution–industry collaboration and career support. Its [HEAT project results framework](https://documents1.worldbank.org/curated/en/837761632153552105/pdf/Disclosable-Version-of-the-ISR-Higher-Education-Acceleration-and-Transformation-Project-P168961-Sequence-No-01.pdf) includes a career-service-center job-placement indicator, confirming institutional relevance. | Career offices react late; training and curriculum conversations lack current demand signals          | Cohort readiness distribution, skill heatmaps, advisor workflows, semester trends and exportable reports                 |
| Digital access is unequal                                    | Internet use is 75.7% in urban areas but 43.6% in rural areas in FY2024–25.                                                                                                                                                                                                                                                                                                                                                 | A web-only rollout can reproduce geographic and income inequality                                     | Mobile-first/low-bandwidth design, campus onboarding and later regional tracking; impact by district should be measured  |

Relevant sources include the World Bank's [Bangladesh Development Update: Creating Jobs for a Better Future (2024)](https://documents1.worldbank.org/curated/en/099104310142425439/pdf/IDU14133e18a1c40f1459018e8c1afa6d6293eca.pdf), [Tertiary Education Sector Review (2019)](https://documents1.worldbank.org/curated/en/303961553747212653/pdf/Bangladesh-Tertiary-Education-Sector-Review-Skills-and-Innovation-for-Growth.pdf), [Skills for Tomorrow's Jobs (2018)](https://documents1.worldbank.org/curated/en/684441522921114827/AUS0000069-revised-PUBLIC.pdf), the [ILO Bangladesh youth statement (2024)](https://www.ilo.org/resource/statement/ilos-call-empowering-youth-decent-work-and-sustainable-development-0), the [CPD Gen Z study (2024)](https://cpd.org.bd/resources/2024/09/Gen-Zs-Employment-Expectations-An-Exploratory-Study-in-Bangladesh.pdf), and the World Bank's [Bangladeshi youth consultation (2024)](https://blogs.worldbank.org/en/endpovertyinsouthasia/voices-bangladeshi-youth-preparing-world-work).

### Competitive reality

Nextern competes for attention and hiring workflow with university career offices, Bdjobs, LinkedIn, Facebook groups, training/mentoring programs, and newer Bangladesh-focused AI platforms. Current local examples include:

- **Bdjobs:** broad recruitment marketplace, employer applicant-processing, online-test and video-interview options. A basic local listing is BDT 3,098 including VAT as of the access date. See [Bdjobs packages](https://corporate3.bdjobs.com/ServicePackages.asp).
- **Chakri.ai:** explicitly markets AI profile matching, résumé screening, ranked candidates, AI interviews, application tracking and recruiting tools. Its displayed candidate Pro price is BDT 699/month after launch, while Pro features are currently described as free during its seed round. See [AI tools](https://chakri.ai/ai-tools) and [pricing](https://chakri.ai/pricing).
- **GYC:** curated jobs, cohorts, aptitude tests, expert sessions and an AI résumé builder. Its scale statements are first-party claims and are not used in this model. See [GYC](https://gycplatform.com/).
- **BYLC CareerX / ProMentor Campus2Career:** structured career preparation, mentoring, assessment and linkage. Public examples show BDT 1,500–2,000 for BYLC's short program and BDT 1,000 assessment / BDT 10,000 full program for ProMentor. These are not direct subscription equivalents. See [BYLC CareerX](https://opd.bylc.org/careerx.html) and [ProMentor](https://promentorbd.com/campus2career).

| Capability                       | Traditional career services              | General job portals / AI hiring platforms                | Social media / Facebook groups | Nextern                                                                                        |
| -------------------------------- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Internship-specific matching     | Often manual and institution-specific    | Search/filter is common; AI matching exists on Chakri.ai | Informal posts; weak structure | Implemented around job requirements and student profiles                                       |
| AI skill-gap analysis            | Uncommon; advisor-dependent              | Emerging, with overlapping AI career tools               | Generally absent               | Implemented; outcome validity untested                                                         |
| Internship fit score             | Usually manual                           | Available from some AI platforms                         | No systematic score            | Implemented; should remain explainable and advisory                                            |
| Personalized learning path       | Workshops/advice vary                    | Available in some AI career tools                        | Informal recommendations       | Implemented from role gaps                                                                     |
| Verified academic profile        | Institution can verify its own records   | Usually candidate-declared unless separately checked     | Usually self-declared          | Academic-review/work-evidence workflow exists; registrar-grade verification is not established |
| Multi-university employer access | Usually limited to one institution/event | Strong broad-market reach                                | Broad but noisy                | Designed for campus cohorts and batch hiring; live coverage unverified                         |
| Career-readiness analytics       | Varies; often periodic/manual            | Mainly applicant/pipeline analytics                      | Absent                         | Advisor and department cohort analytics implemented                                            |

The credible differentiation is therefore: **campus-integrated readiness intelligence plus the student-to-employer workflow**, not “Bangladesh's only AI career platform.”

## PART 3 — Bangladesh Market Opportunity

### Student and institution TAM

| Layer                                             |                                                       Calculation |               Result | Classification                           |
| ------------------------------------------------- | ----------------------------------------------------------------: | -------------------: | ---------------------------------------- |
| Broad direct-campus student TAM                   |       296,696 regular public + 358,414 reporting private students |          **655,110** | **CALCULATED ESTIMATE**                  |
| Core undergraduate honours TAM                    |          232,595 regular public honours + 325,833 private honours |          **558,428** | **CALCULATED ESTIMATE**                  |
| Annual direct-campus honours admissions           | 49,883 public first-year + 128,399 private new honours admissions |     **178,282/year** | **CALCULATED ESTIMATE**                  |
| Latest separately comparable annual graduate flow |                            86,237 regular public + 72,406 private |     **158,643/year** | **CALCULATED ESTIMATE**, using 2022 data |
| Broad institution TAM                             |                                       UGC public/private universe | **163 universities** | **VERIFIED MARKET DATA**, 2023           |
| Comparable direct-campus core                     |     50 regular public + 103 academically active/reporting private | **153 institutions** | **CALCULATED ESTIMATE**                  |

The private degree-level table totals 358,412, creating a two-student discrepancy with the report's 358,414 headline. Its extracted honours value also loses a leading digit; the internally consistent calculation is `358,412 − 29 degree-pass − 31,146 postgraduate − 1,404 certificate/diploma/other = 325,833`. Both issues are disclosed instead of silently resolving them.

National University, Bangladesh Open University, Islamic Arabic University and their affiliated systems are excluded from the launch core. They add millions of learners, but their distributed college structures, student journeys and institutional procurement model differ materially. They are an expansion market, not a defensible Year-1 base.

### Serviceable Available Market (SAM)

Nextern is most relevant immediately before graduation. With no official year-of-study distribution, this model uses final- and penultimate-year students as a 50% proxy for a four-year honours population.

1. Stage-relevant students: `558,428 × 50% = 279,214`.
2. Conservative national digital-access proxy: `279,214 × 53.4% = 149,100`.
3. Urban-connected rollout proxy: `279,214 × 75.7% = 211,365`.

**Student SAM = approximately 149,100–211,365 students — CALCULATED ESTIMATE.** This is a planning range, not a count of observed Nextern-ready students. General internet-use rates are deliberately identified as proxies because no current, representative university-student digital-access dataset was found.

For institutions, the serviceable core is the **153 regular/reporting direct-campus universities**. A Year-1 outreach shortlist of **30 institutions** is a business planning assumption and should be selected using observable criteria: active career office or sponsor, adequate digital operations, relevant undergraduate cohorts, willingness to share outcome data, and manageable location/onboarding effort.

For employers, **229,289 registered limited companies is only an upper legal universe**. RJSC does not say how many are active, hire graduates, offer internships or would buy software. CPD's internship percentages cannot responsibly be multiplied by the RJSC count because its 250-person employed-youth sample is not representative of all firms. Accordingly, this report does not invent an employer TAM/SAM point estimate. It uses a capacity-based Year-1 acquisition funnel instead.

### Serviceable Obtainable Market (SOM)

| Metric                     |      Year 1 |      Year 2 |       Year 3 | Basis                                           |
| -------------------------- | ----------: | ----------: | -----------: | ----------------------------------------------- |
| Registered students        |       3,000 |       7,500 |       15,000 | Campus-led acquisition targets                  |
| Share of student SAM range | 1.42%–2.01% | 3.55%–5.03% | 7.10%–10.06% | Registrations ÷ 211,365 to 149,100              |
| Active students            |       1,800 |       4,875 |       10,500 | 60%, 65%, 70% annual active rates               |
| Active employers           |          40 |          90 |          175 | Direct employer acquisition and retention       |
| Partner universities       |           3 |           7 |           12 | Paid or formally documented pilots/partnerships |

Year 1 assumes a team can close three of 30 qualified university prospects, activate 40 of 60 registered employers, and acquire about 1,000 student registrations per partner/adjacent campus ecosystem. These are execution assumptions—not Bangladesh market facts.

## PART 4 — Annual Business Value Analysis

All numbers in this part are **Year-1 BUSINESS PROJECTIONS**, except the market bases explicitly identified above.

### A. Annual student funnel

| Funnel stage                         |                   Formula |    Annual value | Conversion from prior stage |
| ------------------------------------ | ------------------------: | --------------: | --------------------------: |
| Core undergraduate TAM               |         232,595 + 325,833 |         558,428 |                           — |
| Stage-relevant students              |             558,428 × 50% |         279,214 |                       50.0% |
| Digitally serviceable range          |  279,214 × 53.4% to 75.7% | 149,100–211,365 |           53.4%–75.7% proxy |
| Registered students                  | Year-1 acquisition target |           3,000 |          1.42%–2.01% of SAM |
| Active students                      |               3,000 × 60% |           1,800 |                       60.0% |
| Skill-gap users                      |               1,800 × 70% |           1,260 |                       70.0% |
| Recommendation users                 |               1,800 × 90% |           1,620 |                       90.0% |
| Unique applying students             |               1,800 × 50% |             900 |                       50.0% |
| Applications facilitated             |                   900 × 4 |           3,600 |    4 applications/applicant |
| Unique students interviewed          |                 900 × 30% |             270 |                       30.0% |
| Employer-confirmed internship starts |                 270 × 40% |             108 |        40.0% of interviewed |

Resulting conversion rates are `108 ÷ 900 = 12%` of unique applicants, `108 ÷ 1,800 = 6%` of active students, and `108 ÷ 3,600 = 3%` of application records. These are targets, not evidence that Nextern causes placement.

Additional Year-1 targets:

- **Completed mentorship:** `1,800 × 15% = 270 students` with at least one completed session.
- **Measured readiness progress:** `1,260 skill-gap users × 40% = 504 students`. Count only a student who completes at least one recommended action and improves by at least five points on the same documented scoring rubric within 90 days. This metric is internal progress, not proven employability.

Definitions should prevent vanity counting: “active” means at least two meaningful actions in a 90-day window or an application plus a readiness action; “placement” means a deduplicated internship start confirmed by both employer and student; “opportunity” means an approved, non-duplicate listing.

### B. Annual employer funnel

| Employer metric                        |                          Formula |  Year-1 value | Confidence |
| -------------------------------------- | -------------------------------: | ------------: | ---------- |
| Registered companies                   |               Acquisition target |            60 | Medium     |
| Active employers                       |                       60 × 66.7% |            40 | Medium     |
| Approved opportunities                 |                      40 × 6/year |           240 | Medium     |
| Applications/records screened          |                         240 × 15 |         3,600 | Medium–low |
| Application-level fit scores generated | One score per application record | 3,600 records | Medium–low |
| Unique candidates interviewed          |              From student funnel |    270 people | Low–medium |
| Confirmed internship starts            |                        270 × 40% |    108 people | Low        |

The model assumes six approved opportunities per active employer per year and 15 applications per opportunity. A listing may contain more than one seat, but this conservative model credits no more than one confirmed placement per filled opportunity.

No separate “candidates matched” total is projected. Nextern first needs to validate what score threshold constitutes a useful match and whether employers accept that threshold; until then, “fit scores generated” is the auditable metric.

**Screening-effort scenario:** assume a manual first pass takes eight minutes and an AI-assisted, human-reviewed pass takes three minutes. Saving per record is five minutes, or 62.5% of that first-pass task. `3,600 × 5 ÷ 60 = 300 employer hours/year`. No representative Bangladesh benchmark was found for these minutes, so this is a low-confidence pilot assumption—not an industry fact.

### C. Annual university funnel

| University metric                                |                        Formula | Year-1 value | Classification           |
| ------------------------------------------------ | -----------------------------: | -----------: | ------------------------ |
| Broad potential institutions                     |                   UGC universe |          163 | **VERIFIED MARKET DATA** |
| Comparable direct-campus core                    |                       50 + 103 |          153 | **CALCULATED ESTIMATE**  |
| Qualified outreach shortlist                     |  Selection-capacity assumption |           30 | **BUSINESS PROJECTION**  |
| Formal partners                                  |            30 × 10% close rate |            3 | **BUSINESS PROJECTION**  |
| Active students acquired/served through partners |                    1,800 × 50% |          900 | **BUSINESS PROJECTION**  |
| Department/cohort dashboards                     | 3 partners × 5 initial cohorts |           15 | **BUSINESS PROJECTION**  |

A “partner” must mean a signed pilot/MOU with a named owner, scope and data-processing basis—not a university appearing in a registration dropdown. The other 900 active students may enter through direct, employer, ambassador or organic channels.

### D. Annual time and cost value

- **Student time saved:** `900 applying students × 8 hours/year = 7,200 hours`. Assumption: two hours saved per month across four active search months through consolidated discovery, fit guidance and tracking.
- **Employer first-pass time saved:** `3,600 application records × 5 minutes ÷ 60 = 300 hours`.
- **Combined time saved:** `7,200 + 300 = 7,500 hours/year`.

No monetary cost-saving figure is recommended. Bangladesh-specific wage/time evidence for the affected students, recruiters and career staff was not sufficient, and converting the same hours to money would risk double-counting. University administration time and “unnecessary applications avoided” should be measured in pilots before being claimed.

## PART 5 — Annual Financial Value

### Pricing and market context

Nextern's BDT 299 student price and BDT 1,499 employer price are **ACTUAL configured prices**. They are commercially plausible in local context: the student price is below Chakri.ai's displayed future BDT 699 Pro plan and below structured one-off programs such as BYLC CareerX; the employer monthly price is below one current Bdjobs basic listing at BDT 3,098 including VAT. These are different products, durations, audiences and reach, so the nominal gaps are not customer “savings.”

### Realistic Year-1 revenue-stream table

| Revenue Stream               | Annual Customers |                                   Price |    Annual Revenue | Data Type                                                  |
| ---------------------------- | ---------------: | --------------------------------------: | ----------------: | ---------------------------------------------------------- |
| Student Premium              |        90 payers |   BDT 299/month × 4 average paid months |       BDT 107,640 | Price **ACTUAL**; customers/tenure **BUSINESS PROJECTION** |
| Employer Premium             |        10 payers | BDT 1,499/month × 6 average paid months |        BDT 89,940 | Price **ACTUAL**; customers/tenure **BUSINESS PROJECTION** |
| Freelance fee                |      Not modeled |                     15% of released GMV | BDT 0 in forecast | Rate **ACTUAL**; volume unavailable                        |
| University analytics/license |      Not modeled |                      No validated price | BDT 0 in forecast | Potential model only                                       |
| **Realistic total**          |                — |                                       — |   **BDT 197,580** | **BUSINESS PROJECTION**                                    |

### Scenario range

| Scenario     |           Student Premium |           Employer Premium | Annual subscription revenue | Main assumptions                                       |
| ------------ | ------------------------: | -------------------------: | --------------------------: | ------------------------------------------------------ |
| Conservative |   `36 × 3 × 299 = 32,292` |   `4 × 4 × 1,499 = 23,984` |              **BDT 56,276** | 2% of active students and 10% of active employers pay  |
| Realistic    |  `90 × 4 × 299 = 107,640` |  `10 × 6 × 1,499 = 89,940` |             **BDT 197,580** | 5% of active students and 25% of active employers pay  |
| Optimistic   | `180 × 6 × 299 = 322,920` | `20 × 9 × 1,499 = 269,820` |             **BDT 592,740** | 10% of active students and 50% of active employers pay |

These are gross subscription receipts before payment fees, refunds, discounts, taxes, AI/video/hosting costs, sales cost and payroll. They are neither profit nor valuation.

**Poster recommendation:** do not make revenue a hero claim before willingness-to-pay is demonstrated. If a competition template requires it, use the small supporting line **“BDT 1.98 lakh realistic Year-1 subscription revenue potential — Projected”** and retain the assumptions in the source note. Do not show the optimistic case.

## PART 6 — Annual Social & Economic Impact

### Direct Year-1 impact

| Direct beneficiary/value                           | Year-1 target | What must be recorded                                                 |
| -------------------------------------------------- | ------------: | --------------------------------------------------------------------- |
| Active students supported                          |         1,800 | Deduplicated meaningful activity definition                           |
| Students receiving role-specific gap analysis      |         1,260 | Completed analyses, not button clicks                                 |
| Students receiving recommendations                 |         1,620 | Unique students shown qualifying recommendations                      |
| Students completing mentorship                     |           270 | Completed session with both participants recorded                     |
| Students demonstrating measured readiness progress |           504 | Completed action plus ≥5-point same-rubric improvement within 90 days |
| Unique students interviewed                        |           270 | Employer-confirmed completed interviews                               |
| Internship starts                                  |           108 | Employer + student confirmation and start date                        |
| Active employers                                   |            40 | At least one approved opportunity or completed hiring action          |
| Partner universities                               |             3 | Signed pilot/MOU with accountable owner                               |
| Student and recruiter time saved                   |   7,500 hours | Pilot baseline and post-use time diary/time-motion check              |

The most defensible economic contribution is improved matching efficiency and work-experience access, not “jobs created.” An internship existed because an employer funded/offered it; Nextern may facilitate and improve the match. Count a new position as job creation only if the employer explicitly confirms it would not otherwise have existed.

### Indirect impact—plausible but not quantified

- Better visibility for students beyond established professional networks.
- More current employer-demand signals for advising, workshops and curriculum review.
- Stronger school-to-work transitions and potentially lower mismatch or underemployment.
- Wider access outside major campuses if low-bandwidth delivery and regional employer supply are built.
- Employer learning about which skills and assessments predict successful interns.

None of these effects should be converted into people, taka or unemployment-rate reduction without longitudinal and counterfactual evidence. At 108 placements, Nextern would be creating valuable individual outcomes, but the number is far too small to claim a measurable change in Bangladesh's national 13.54% graduate unemployment rate.

### Inclusion measures to add from launch

Track activation, recommendations, interviews and placements by gender, district, university type, disability/accessibility status where voluntarily and lawfully supplied, and socioeconomic proxy such as fee-waiver status. Report gaps rather than assuming the platform automatically reduces inequality. The urban/rural digital divide makes offline campus onboarding and low-data mobile performance part of the impact model, not merely a design preference.

## PART 7 — Three-Year Growth Projection

Every value in this table is a **BUSINESS PROJECTION**.

| Metric                           |      Year 1 |       Year 2 |        Year 3 |
| -------------------------------- | ----------: | -----------: | ------------: |
| Registered Students              |       3,000 |        7,500 |        15,000 |
| Active Students                  |       1,800 |        4,875 |        10,500 |
| Active Employers                 |          40 |           90 |           175 |
| Partner Universities             |           3 |            7 |            12 |
| Opportunities Posted             |         240 |          675 |         1,575 |
| Applications Facilitated         |       3,600 |       11,475 |        31,500 |
| Successful Internship Placements |         108 |          375 |         1,008 |
| Annual Revenue                   | BDT 197,580 |  BDT 761,819 | BDT 2,232,980 |
| Annual Time Saved                | 7,500 hours | 22,404 hours |  53,025 hours |

### Formula audit

| Driver                                 |              Year 1 |         Year 2 |         Year 3 |
| -------------------------------------- | ------------------: | -------------: | -------------: |
| Annual active rate                     |                 60% |            65% |            70% |
| Opportunities per active employer      |                 6.0 |            7.5 |            9.0 |
| Applications per opportunity           |                  15 |             17 |             20 |
| Unique applying students               | 50% of active = 900 |    55% = 2,681 |    60% = 6,300 |
| Interview rate among applying students |           30% = 270 |      35% = 938 |    40% = 2,520 |
| Placement rate among interviewed       |                 40% |            40% |            40% |
| Student payers and tenure              |       90 × 4 months | 293 × 5 months | 735 × 6 months |
| Employer payers and tenure             |       10 × 6 months |  27 × 8 months | 61 × 10 months |

Revenue calculations are:

- Year 1: `(90 × 4 × 299) + (10 × 6 × 1,499) = BDT 197,580`.
- Year 2: `(293 × 5 × 299) + (27 × 8 × 1,499) = BDT 761,819`.
- Year 3: `(735 × 6 × 299) + (61 × 10 × 1,499) = BDT 2,232,980`.

Time calculations are:

- Year 1: `(900 × 8 hours) + (3,600 × 5/60 hours) = 7,500 hours`.
- Year 2: `(2,681 × 8) + (11,475 × 5/60) = 22,404.25`, displayed as **22,404**.
- Year 3: `(6,300 × 8) + (31,500 × 5/60) = 53,025 hours`.

Whole-person funnel counts are rounded to the nearest person before the next stage. Student paid conversion rises from 5% to 6% to 7% of active students, while employer paid conversion rises from 25% to 30% to 35%; average paid tenure rises from 4/6 student/employer months in Year 1 to 5/8 in Year 2 and 6/10 in Year 3. The same unvalidated eight-hour student and five-minute recruiter savings assumptions are held constant across all three years.

### Why this growth can be reasonable

- Registered students grow 2.5× and then 2×, but Year 3 is still only 7.10%–10.06% of the modeled student SAM and 2.69% of the core undergraduate TAM.
- University partners rise from 3 to 12, only 7.8% of the 153-institution core.
- Employer growth follows a denser student/campus network rather than an assumed fraction of all Bangladeshi companies.
- Employer posting frequency rises as repeat employers and multi-role programs mature.
- Activation and paid tenure improve gradually; no instant nationwide dominance is assumed.

### Operational conditions required

1. Three Year-1 universities must provide accountable campus owners and allow measurable onboarding/outcome tracking.
2. Employer acquisition must precede mass student marketing so opportunity supply does not collapse.
3. By Year 2, Nextern needs repeat-employer success, moderation/SLA processes, campus success capacity and reliable assessment/interview operations.
4. AI outputs need explainability, appeal/correction mechanisms, bias testing and human control.
5. Student identity/academic evidence, placement confirmation and duplicate detection must become auditable.
6. Pricing must survive payment-conversion testing; infrastructure and model cost must fit gross margin.

These conditions make the table a testable operating plan rather than a forecast guarantee.

## PART 8 — The 6–8 Strongest Numbers for the Poster

### 1. 558,428 — Relevant Undergraduate Students in the Core Market

- **Meaning:** Undergraduate honours students in regular public and reporting private universities.
- **Classification:** **CALCULATED ESTIMATE**.
- **Formula:** `232,595 public + 325,833 private = 558,428`.
- **Bangladesh data used:** UGC 50th Annual Report 2023 degree-level student tables.
- **Assumptions:** Excludes NU/BOU/Islamic Arabic affiliated systems and postgraduates; private honours count is restored from the internally consistent degree-table arithmetic disclosed in Part 3.
- **Source:** [UGC 50th Annual Report 2023](https://ugc.gov.bd/pages/annual-reports/%E0%A7%AB%E0%A7%A6%E0%A6%A4%E0%A6%AE-%E0%A6%AC%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%B7%E0%A6%BF%E0%A6%95-%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%A4%E0%A6%BF%E0%A6%AC%E0%A7%87%E0%A6%A6%E0%A6%A8-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%A9-93bc29-6922de8f933eb65569e1b95b), data year 2023; report publication date March 2025 and UGC webpage posting date 16 November 2025.
- **Confidence:** **Medium** because the source is authoritative but the private degree table contains the disclosed extraction anomaly and two-student subtotal discrepancy.
- **Poster recommendation:** **Yes.** Label it “core market,” not “students Nextern serves.”

### 2. 13.54% — University-Graduate Unemployment

- **Meaning:** BBS unemployment rate among university graduates in 2024.
- **Classification:** **VERIFIED MARKET DATA**.
- **Formula:** Published rate; no Nextern calculation.
- **Bangladesh data used:** BBS Labour Force Survey 2024; about 885,000 unemployed graduates.
- **Assumptions:** Uses the BBS unemployment definition; it does not include every form of underemployment and is not a Nextern outcome.
- **Source:** [BBS LFS page](https://bbs.gov.bd/site/page/111d09ce-718a-4ae6-8188-f7d938ada348/Labour-%26-Employment) and [LFS coverage with education breakdown](https://www.tbsnews.net/bangladesh/unemployment-rises-366-2024-higher-among-educated-1234376), report year 2024, released 2025.
- **Confidence:** **High**.
- **Poster recommendation:** **Yes.** It is the clearest current problem statistic.

### 3. 1,800 — Active Students Served in Year 1

- **Meaning:** Deduplicated students completing meaningful activity during the year.
- **Classification:** **BUSINESS PROJECTION**.
- **Formula:** `3,000 registrations × 60% annual activation = 1,800`.
- **Bangladesh data used:** This target is only 0.85%–1.21% of the calculated 149,100–211,365 SAM.
- **Assumptions:** Three campus partners plus direct channels; “active” definition in Part 4; adequate employer supply.
- **Source:** UGC/BBS market inputs above; registration and activation are Nextern planning assumptions.
- **Confidence:** **Medium**.
- **Poster recommendation:** **Yes, only as “Year-1 projection.”**

### 4. 240 — Approved Internship Opportunities in Year 1

- **Meaning:** Unique, moderated opportunity listings, not raw reposts or seats.
- **Classification:** **BUSINESS PROJECTION**.
- **Formula:** `40 active employers × 6 opportunities/year = 240`.
- **Bangladesh data used:** RJSC confirms a large formal company universe; CPD directionally confirms that internship provision exists but is uneven. Neither source supplies this conversion.
- **Assumptions:** Each active employer averages one approved post every two months; Nextern can acquire/retain 40 active employers.
- **Source:** [RJSC statistics](https://roc.gov.bd/site/page/2f14b592-33c7-4931-b276-e16b0a9ded0d/Statistics-of-RJSC), Feb. 2026; [CPD Gen Z study](https://cpd.org.bd/resources/2024/09/Gen-Zs-Employment-Expectations-An-Exploratory-Study-in-Bangladesh.pdf), 2024.
- **Confidence:** **Medium**.
- **Poster recommendation:** **Yes, labeled projected.**

### 5. 40 — Active Employers in Year 1

- **Meaning:** Employers completing at least one approved posting or hiring workflow.
- **Classification:** **BUSINESS PROJECTION**.
- **Formula:** `60 registered employers × 66.7% activation ≈ 40`.
- **Bangladesh data used:** 229,289 registered public/private limited companies is the upper legal context, not the denominator used to claim market share.
- **Assumptions:** Focused outbound sales, university/employer networks and an opportunity-supply-first launch.
- **Source:** [RJSC statistics](https://roc.gov.bd/site/page/2f14b592-33c7-4931-b276-e16b0a9ded0d/Statistics-of-RJSC), Feb. 2026; acquisition conversion is a Nextern assumption.
- **Confidence:** **Medium**.
- **Poster recommendation:** **Yes, labeled projected.**

### 6. 3 — Formal University Partners in Year 1

- **Meaning:** Signed and active pilot/MOU relationships, not selectable university names.
- **Classification:** **BUSINESS PROJECTION**.
- **Formula:** `30 qualified institutions approached × 10% close rate = 3`.
- **Bangladesh data used:** 153 comparable direct-campus institutions in the core.
- **Assumptions:** A campus owner, onboarding access, data-processing basis and at least five initial cohorts per partner.
- **Source:** [UGC 50th Annual Report 2023](https://ugc.gov.bd/pages/annual-reports/%E0%A7%AB%E0%A7%A6%E0%A6%A4%E0%A6%AE-%E0%A6%AC%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%B7%E0%A6%BF%E0%A6%95-%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%A4%E0%A6%BF%E0%A6%AC%E0%A7%87%E0%A6%A6%E0%A6%A8-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%A9-93bc29-6922de8f933eb65569e1b95b), 2023.
- **Confidence:** **Medium**.
- **Poster recommendation:** **Yes, as a Year-1 target.** Never present the current 14/14+ marketing claim as actual without agreements.

### 7. 108 — Employer-Confirmed Internship Starts in Year 1

- **Meaning:** Deduplicated internships that actually begin, confirmed by both parties.
- **Classification:** **BUSINESS PROJECTION**.
- **Formula:** `1,800 active × 50% apply × 30% interview × 40% start = 108`.
- **Bangladesh data used:** The market size and unemployment context establish need; no Bangladesh source validates Nextern's conversion rates.
- **Assumptions:** 240 opportunities, sufficient role fit, human hiring decisions and one credited start per filled listing in the conservative model.
- **Source:** UGC/BBS sources for context; all funnel conversions are disclosed Nextern assumptions.
- **Confidence:** **Low** until a pilot validates conversion.
- **Poster recommendation:** **Conditionally yes** as “Year-1 target,” never “placements achieved.” This is the key outcome to validate first.

### 8. 7,500 — Student + Recruiter Hours Potentially Saved in Year 1

- **Meaning:** Modeled search/application and first-pass screening effort avoided.
- **Classification:** **BUSINESS PROJECTION**.
- **Formula:** `(900 applying students × 8 hours) + (3,600 application records × 5 minutes ÷ 60) = 7,500 hours`.
- **Bangladesh data used:** The user/application volumes derive from the Bangladesh-based market model; no representative local time benchmark was found.
- **Assumptions:** Two student hours saved monthly for four search months; five recruiter minutes saved per first-pass record; no university-admin time included.
- **Source:** Nextern operating model; Bangladesh market inputs from UGC/BBS.
- **Confidence:** **Low** pending a time-motion pilot.
- **Poster recommendation:** **Use only with “projected” and the formula in a footnote.** Otherwise replace it with the more controllable “1,260 skill-gap users/year.”

## PART 9 — EXACT POSTER TEXT

### BUSINESS NAME

**Nextern**

### TAGLINE

**From Campus Potential to Career Readiness—Built for Bangladesh.**

### ONE-SENTENCE VALUE PROPOSITION

**One connected workflow turns employer requirements into student action and university insight.**

### THE BANGLADESH PROBLEM — 39 words

**Bangladesh has about 558,000 bachelor's students across regular public and reporting private universities, while university-graduate unemployment reached 13.54% in 2024. Students lack clear skill signals and networks; employers face noisy screening; universities lack timely, cohort-level evidence of career readiness.**

### OUR SOLUTION — 52 words

**Nextern connects Bangladesh students, employers and universities through structured academic and career profiles, AI-assisted skill-gap and internship-fit analysis, personalized learning paths, mentorship, applications, assessments and interviews. Employers receive explainable, ranked campus candidates; advisors and department heads see cohort readiness and skill trends. People retain final learning and hiring decisions throughout the workflow.**

### HOW NEXTERN CREATES VALUE

#### 🎓 FOR STUDENTS

- See role-specific gaps and fit before applying.
- Turn gaps into learning, résumé and mentor actions.
- Track applications, assessments and interviews together.

#### 🏢 FOR EMPLOYERS

- Rank first-pass applications with explainable evidence.
- Recruit and batch-manage talent across campuses.
- Assess, interview, schedule and message in one workflow.

#### 🏫 FOR UNIVERSITIES

- See cohort readiness and common skill gaps.
- Target advisor support and training by evidence.
- Track term trends, applications and confirmed outcomes.

### ANNUAL VALUE IN BANGLADESH

**YEAR-1 TARGETS — BUSINESS PROJECTIONS**

**1,800**  
Active Students Served / Year

**240**  
Approved Internship Opportunities / Year

**40**  
Active Employers / Year

**3**  
Formal University Partners / Year

**108**  
Employer-Confirmed Internship Starts / Year

**7,500 Hours**  
Student + Recruiter Effort Potentially Saved / Year

### BANGLADESH MARKET OPPORTUNITY

**558,428**  
Relevant Undergraduate Students in the Core Market — UGC 2023 calculation

**13.54%**  
University-Graduate Unemployment — BBS LFS 2024

### BUSINESS MODEL

- **Student Premium** — BDT 299/month
- **Employer Premium** — BDT 1,499/month
- **Freelance Marketplace** — 15% of released transaction value
- **University Analytics License** — future only; validate price in paid pilots

**Free core access builds the student–employer network; it is not a revenue stream.**

**Realistic Year-1 subscription revenue potential: BDT 197,580 — Projected**

### THREE-YEAR PATH

**Year 1:** 3,000 registered students • 40 employers • 3 universities  
**Year 2:** 7,500 registered students • 90 employers • 7 universities  
**Year 3:** 15,000 registered students • 175 employers • 12 universities

### FUTURE VISION

**Validate outcomes at three campuses, then scale Bangladesh's campus-to-career evidence loop—so students, employers and universities act on the same current skill signals.**

### REQUIRED FOOTNOTE

**All annual impact and revenue figures are Year-1 business projections—not achieved results. Hours estimate = 900 applying students × 8 hours + 3,600 application records × 5 minutes. Market sources: UGC 2023 and BBS LFS 2024. Current website traction claims are excluded pending verification.**

### CALL TO ACTION

**nextern-virid.vercel.app**  
**Scan to explore Nextern**

## PART 10 — EXACT POSTER STRUCTURE

Use an **A1 portrait layout** unless the competition specifies another format. The visual reading order should take no more than 30 seconds:

```text
┌───────────────────────────────────────────────────────┐
│ LOGO + NEXTERN                                        │
│ Tagline + one-sentence value proposition              │
├───────────────────────┬───────────────────────────────┤
│ BANGLADESH PROBLEM    │ NEXTERN SOLUTION              │
│ 39-word statement     │ 52-word statement + flow      │
├───────────────────────────────────────────────────────┤
│              ANNUAL VALUE IN BANGLADESH               │
│                Year-1 targets — projected             │
│ [1,800] [240] [40]                                    │
│ [3]     [108] [7,500 hours]                           │
├─────────────────┬─────────────────┬───────────────────┤
│ 🎓 STUDENTS     │ 🏢 EMPLOYERS    │ 🏫 UNIVERSITIES  │
│ 3 short benefits│ 3 short benefits│ 3 short benefits  │
├───────────────────────┬───────────────────────────────┤
│ MARKET OPPORTUNITY    │ 3-YEAR PATH                   │
│ 558,428 | 13.54%      │ Three aligned growth rows     │
├───────────────────────┴───────────────────────────────┤
│ BUSINESS MODEL | FUTURE VISION | QR + URL             │
│ Data/projection footnote across full width            │
└───────────────────────────────────────────────────────┘
```

### Section proportions and hierarchy

1. **Top 12%:** logo/name, tagline and value proposition. Make “Nextern” the largest type after the impact numbers.
2. **Problem → solution 17%:** two cards connected by one arrow. Use only the exact problem and solution copy; no extra paragraphs.
3. **Center 29%:** title the section **“ANNUAL VALUE IN BANGLADESH”**, place **“Year-1 targets — projected”** directly below it, and use six large metric cards in a 3×2 grid. Make 1,800, 108 and 7,500 the strongest visual anchors.
4. **Stakeholder value 18%:** three equal columns with icons and three one-line benefits each.
5. **Market and growth 14%:** two market-number cards on the left; three simple aligned rows on the right for students, employers and universities. Do not put unlike units on one axis.
6. **Bottom 10%:** four business-model labels, future-vision sentence, QR/URL and the full footnote.

### Visual recommendations

- **Large number cards:** best for the six annual targets. Put a small “PROJECTED” pill on every card or once in the unmistakable section title.
- **Problem-to-solution arrow:** best for the platform logic. Use `Skills unclear / screening noisy / insight delayed → one evidence workflow`.
- **Three stakeholder columns:** best for showing who receives value without repeating features.
- **Three-year aligned bar rows:** show registered students, active employers and partner universities as separate rows with their own scales. Applications and revenue belong in the detailed report, not the main poster chart.
- **Funnel:** optional only in a judge handout. If included on the poster, use the compact chain `3,000 registered → 1,800 active → 900 apply → 270 interview → 108 start`; remove another element to make room.
- **Bangladesh map:** omit. There is no verified district-level Nextern adoption or opportunity data, so a map would be decoration rather than evidence.

### Style system

- Use a white/off-white base, deep navy text and Nextern's existing blue/teal accents. A restrained Bangladesh green/red accent may mark the market section, not dominate the page.
- Use one sans-serif family, three weights and generous whitespace. Minimum print body size should remain legible at normal poster-viewing distance.
- Numbers should be 2–3 times the height of their labels. Keep icons secondary.
- Use no stock “AI brain” image, pie charts, gauges or decorative maps.
- Put source years directly beside market figures. Put the projection footnote in at least 16–18 pt on A1; it must be genuinely readable.

## PART 11 — DATA SOURCES

1. **University Grants Commission of Bangladesh, 50th Annual Report 2023** (data year 2023; report publication date March 2025; UGC webpage posting date 16 November 2025). Public/private university counts, regular-campus student totals, degree levels, admissions and private degrees awarded. [Official UGC report page](https://ugc.gov.bd/pages/annual-reports/%E0%A7%AB%E0%A7%A6%E0%A6%A4%E0%A6%AE-%E0%A6%AC%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%B7%E0%A6%BF%E0%A6%95-%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%A4%E0%A6%BF%E0%A6%AC%E0%A7%87%E0%A6%A6%E0%A6%A8-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%A9-93bc29-6922de8f933eb65569e1b95b).
2. **UGC, 49th Annual Report 2022** (data year 2022; released 2024). Underlying source for annual graduates. [Official UGC report page](https://ugc.gov.bd/pages/annual-reports/%E0%A7%AA%E0%A7%AF%E0%A6%A4%E0%A6%AE-%E0%A6%AC%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%B7%E0%A6%BF%E0%A6%95-%E0%A6%AA%E0%A7%8D%E0%A6%B0%E0%A6%A4%E0%A6%BF%E0%A6%AC%E0%A7%87%E0%A6%A6%E0%A6%A8-%E0%A7%A8%E0%A7%A6%E0%A7%A8%E0%A7%A8-a693c2-6922deae933eb65569e1c919).
3. **Government of Bangladesh Task Force, “Youth Unemployment Paradox”** (2025), Table 17.2 reproducing UGC 2022 graduate totals. [Task-force report](https://gedkp.gov.bd/wp-content/uploads/2025/04/7.-Final-Report-of-Task-Force-April-2025.pdf).
4. **Bangladesh Bureau of Statistics, Labour Force Survey 2024 Final Report** (data year 2024; released September 2025). Graduate and national unemployment. [Official BBS labor page](https://bbs.gov.bd/site/page/111d09ce-718a-4ae6-8188-f7d938ada348/Labour-%26-Employment).
5. **The Daily Star / The Business Standard reporting of BBS LFS 2024** (2025). Exact 885,000 and 13.54% education-level figures. [Daily Star](https://online.thedailystar.net/business/news/bangladesh-had-9-lakh-unemployed-graduates-2024-3983696); [TBS](https://www.tbsnews.net/bangladesh/unemployment-rises-366-2024-higher-among-educated-1234376).
6. **Bangladesh Bureau of Statistics, ICT Access and Use by Households and Individuals Survey 2024–25** (released April 2026). National/urban/rural digital access. [Official BBS ICT page](https://bbs.gov.bd/pages/static-pages/6922e012933eb65569e25543); [release coverage](https://www.thedailystar.net/business/economy/news/rural-areas-lag-behind-digital-divide-persists-4153326).
7. **International Labour Organization, Bangladesh youth statement** (12 August 2024), citing LFS 2022. Youth unemployment, NEET and gender gap. [ILO](https://www.ilo.org/resource/statement/ilos-call-empowering-youth-decent-work-and-sustainable-development-0).
8. **World Bank, Bangladesh Development Update—Special Focus: Creating Jobs for a Better Future** (October 2024). Skills mismatch, job quality, informality and tertiary labor underutilization. [Full report](https://documents1.worldbank.org/curated/en/099104310142425439/pdf/IDU14133e18a1c40f1459018e8c1afa6d6293eca.pdf).
9. **World Bank, Bangladesh Tertiary Education Sector Review** (2019). Graduate tracer evidence and university-to-work transition. This is contextual, not used as a current rate. [Report](https://documents1.worldbank.org/curated/en/303961553747212653/pdf/Bangladesh-Tertiary-Education-Sector-Review-Skills-and-Innovation-for-Growth.pdf).
10. **World Bank, Bangladesh Skills for Tomorrow's Jobs** (2018). Employer-prioritized problem-solving, ICT, communication and practical skills, and need for labor-market feedback. Historical/contextual only. [Report](https://documents1.worldbank.org/curated/en/684441522921114827/AUS0000069-revised-PUBLIC.pdf).
11. **World Bank, Higher Education Acceleration and Transformation Project results framework** (2021 ISR). Establishes that career-service-supported job placement is an explicit Bangladesh higher-education program indicator; used only to confirm institutional relevance, not as a current outcome. [Report](https://documents1.worldbank.org/curated/en/837761632153552105/pdf/Disclosable-Version-of-the-ISR-Higher-Education-Acceleration-and-Transformation-Project-P168961-Sequence-No-01.pdf).
12. **World Bank, Voices of Bangladeshi Youth: Preparing for the World of Work** (5 March 2024). Student demand for counselling, alumni outreach, internships and institution–industry links. [World Bank](https://blogs.worldbank.org/en/endpovertyinsouthasia/voices-bangladeshi-youth-preparing-world-work).
13. **Centre for Policy Dialogue, Gen Z's Employment Expectations** (September 2024). Exploratory surveys of 250 employed and 250 unemployed young people; internship/fresh-graduate practices are used directionally only. [CPD report](https://cpd.org.bd/resources/2024/09/Gen-Zs-Employment-Expectations-An-Exploratory-Study-in-Bangladesh.pdf).
14. **Registrar of Joint Stock Companies and Firms** (through February 2026). Registered entity totals. [RJSC statistics](https://roc.gov.bd/site/page/2f14b592-33c7-4931-b276-e16b0a9ded0d/Statistics-of-RJSC).
15. **ULAB Career Services Office** (accessed 4 September 2026). Example of workshops, job-board, alumni and record-keeping services; not treated as representative of every university. [ULAB](https://career.ulab.edu.bd/).
16. **Bdjobs employer packages** (accessed 4 September 2026). Current local listing price and recruiting features. [Service packages](https://corporate3.bdjobs.com/ServicePackages.asp); [full posting menu](https://corporate3.bdjobs.com/Job_Posting_Board_Services.asp).
17. **Chakri.ai** (accessed 4 September 2026). Current first-party product and future-pricing statements used only for competitor capability/price context. [AI tools](https://chakri.ai/ai-tools); [employer product](https://chakri.ai/hire); [pricing](https://chakri.ai/pricing).
18. **BYLC CareerX, ProMentor Campus2Career and GYC** (accessed 4 September 2026). Local alternative features and public prices; first-party performance claims are not used. [BYLC](https://opd.bylc.org/careerx.html); [ProMentor](https://promentorbd.com/campus2career); [GYC](https://gycplatform.com/).
19. **Nextern source code** (audited 4 September 2026). Product behavior, configured prices/limits/fees and hard-coded landing claims. Key files: [subscription plans](./src/lib/subscription-plans.ts), [freelance fee](./src/lib/freelance-shared.ts), [landing page](./src/app/page.tsx), [student registration](./src/app/api/auth/register/route.ts), [skill-gap API](./src/app/api/ai/skill-gap/route.ts), and [department dashboard](./src/app/dept/dashboard/page.tsx).

## PART 12 — ASSUMPTIONS & LIMITATIONS

### Market-data limitations

1. The latest UGC annual report available in this research is the 2023 report, released in November 2025. It is authoritative but lagged.
2. UGC's broad public-university totals include National, Open and Islamic Arabic university systems and affiliated institutions. This report excludes them from the launch core to avoid inflating a direct-campus product market.
3. The private degree table has a two-person difference from the headline total and a missing leading digit in extracted honours text. The report discloses and arithmetically reconstructs 325,833 instead of hiding the issue.
4. The annual graduate flow uses 2022 because a clean, comparable 2023 direct-campus public/private split was not found. It is context, not a projection driver.
5. General internet-use rates are not university-student access rates. The SAM is therefore a range and has medium confidence.
6. RJSC counts legal registrations, not active businesses, recruiters or internship providers. It is not used as an employer conversion denominator.
7. CPD internship results are from an exploratory youth sample and are not nationally representative of companies.
8. Older World Bank tracer and employer studies establish persistent patterns, not current rates; their age is stated wherever used.
9. No sufficiently authoritative, representative current statistic was found for internship vacancies, applications per internship, recruiter screening minutes, university career-office coverage or AI adoption among Bangladeshi students/employers. This report does not invent them.

### Business-projection assumptions

1. Degrees average four years and final/penultimate students are approximated as 50% of the honours stock.
2. Year 1 registers 3,000 students, activates 60%, acquires 60 registered/40 active employers and signs three of 30 qualified institutional prospects.
3. Each active employer posts six approved opportunities; each receives 15 applications.
4. Half of active students apply, making four applications each; 30% receive an interview; 40% of interviewed students start an internship.
5. Seventy percent of active students use gap analysis, 90% receive recommendations and 15% complete mentorship.
6. Five initial department/cohort dashboards are activated per partner university.
7. Student search effort falls by eight hours per applying student per year; recruiter first-pass effort falls by five minutes per application. Both require pilot validation.
8. Realistic Year-1 paid conversion is 5% of active students for four months and 25% of active employers for six months. No churn cohort, discount, tax or refund evidence exists yet.
9. Years 2–3 require improving activation, employer posting, paid tenure and institutional capacity as specified in Part 7.

### Claims and product limitations

- The current website's 2,400+ students, 340+ companies, 14/14+ universities and 89% placement rate remain **Platform-stated figures requiring verification**. They are excluded from every recommended calculation.
- Code implementation does not demonstrate uptime, accuracy, security, usability, market demand or realized impact.
- Student auto-approval means academic identity/credential verification is not yet strong enough for an unqualified “verified student” claim.
- AI-generated fit, gap, interview and readiness scores can be wrong or biased. They must assist—not replace—student, advisor and employer judgment. Nextern needs transparent factors, data correction, monitoring and appeal.
- GER and Opportunity Score are Nextern-generated signals, not accredited qualifications. Their predictive validity must be tested before they are called proof of employability.
- The mentorship free-limit contradiction (marketing says two; code says 20) should be resolved before launch communication.

### Values deliberately excluded

- No monetary valuation of employability, student time, recruiter time, university administration or national unemployment reduction.
- No university-license revenue without validated price and buyer commitment.
- No freelance-fee revenue without observed completed GMV.
- No cost saving inferred from Bdjobs/Chakri/BYLC price differences because the products are not equivalent.
- No “jobs created” claim; the model counts facilitated, employer-confirmed internship starts.
- No causal claim that Nextern produces readiness or placement without a comparison design.

### Minimum evidence needed before changing “projected” to “actual”

1. An anonymized analytics export with deduplicated users, active-event rules and date range.
2. Employer registry, approved listings and audit trail for application status.
3. Signed university documents and named campus owners.
4. Dual-confirmed internship starts, duration and completion—not merely accepted applications.
5. Payment ledger net of refunds for subscription revenue.
6. A 4–8 week student time diary and recruiter time-motion pilot.
7. Pre/post score records with a fixed rubric, followed by evidence that score movement predicts external outcomes.
8. Fairness and conversion reporting by gender, region and university type.

The most defensible one-year answer for a judge is therefore:

> **With three university pilots and 40 active employers, Nextern can target 1,800 active students, facilitate 240 approved opportunities and 108 confirmed internship starts, while saving about 7,500 student and recruiter hours. Every figure is a transparent Year-1 projection awaiting pilot validation.**
