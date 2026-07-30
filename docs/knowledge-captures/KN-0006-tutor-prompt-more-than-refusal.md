# Knowledge Capture Note

- **Knowledge ID:** `KN-0006`
- **Cycle or commit:** Tutor-not-ghostwriter evidence grounding and publication-readiness verification; no implementation commit
- **Working article title:** *A Tutor Prompt Is More Than a Refusal*
- **Date:** `2026-07-30`
- **Trigger:** A community-proposed prompt replaces assignment-ready prose with explanation, learner restatement, diagnostic questions, and another attempt.
- **Reusable insight:** In a learning-oriented writing task, refusal is only a boundary. The potentially instructive activity is the supported loop that follows: retrieval, explanation, diagnosis, bounded feedback, another attempt, and learner choice.
- **Primary destination:** `sources-case-studies`
- **Status:** `Drafted`
- **Evidence confidence:** `3.5 / 5`

## Primary source intake

- **Source ID:** `reddit-promptengineering-tutor-not-ghostwriter`
- **Source title:** *Stop letting ChatGPT be an ai writing tool for your essays. Here's the prompt I give people instead.*
- **Source URL:** https://www.reddit.com/r/PromptEngineering/comments/1v2oglo/stop_letting_chatgpt_be_an_ai_writing_tool_for/
- **Platform:** Reddit
- **Community:** `r/PromptEngineering`
- **Post date:** `2026-07-21`
- **Capture date:** `2026-07-30`
- **Author or username:** Not recorded. The current knowledge-ledger schema does not require it, and the verified source record used for this intake did not expose a stable username.
- **Source type:** Community post and proposed interaction pattern
- **Source summary:** The poster describes a familiar essay-use pattern—requesting finished prose, rewording it, and submitting it—and proposes a prompt that forbids paste-ready assignment writing. The proposed loop explains an idea simply, asks the learner to explain it back, responds to errors with questions, and continues until the learner can articulate the concept.
- **Central observation:** A model can be prompted to delay finished prose and elicit learner participation instead.
- **Evidence quality:** `2.5 / 5` as a direct record of one community proposal; not evidence of learning effectiveness, prevalence, authorship preservation, grades, memory, or academic integrity.
- **Confidence:** High confidence that the post proposes the recorded workflow; low confidence in its causal claims about what learners retain.
- **Limitations:** Self-report from one poster; no controlled comparison; no outcome measurement; no verified prevalence estimate; comments and engagement metrics are not validation.
- **Relevance to article:** Provides the source signal and interaction pattern that the article tests against educational research.
- **Article working title:** *A Tutor Prompt Is More Than a Refusal*
- **Article status:** Editorial QA complete; publication-readiness verified; eligible for unpublished HTML implementation, not publication.
- **Archive or snapshot information:** The stable Reddit post URL, post identifier `1v2oglo`, title, date, community, bounded summary, and capture date are preserved here. No local copy of the full post, comments, engagement counts, or user data was created.

## Contractor and Reyes primary-paper record

- **Exact title:** *Experimental Evidence on the Learning Impact of Generative AI*
- **Authors:** Zara Contractor and Germán Reyes
- **Primary version used:** arXiv `2607.08849v1`, submitted July 9, 2026; manuscript dated July 2026
- **IZA record:** IZA Discussion Paper No. 18792, July 2026
- **Institutions disclosed:** Both authors are affiliated with Middlebury College; Reyes is also affiliated with IZA. The experiment took place at Middlebury College in Spring 2025.
- **Analytical sample:** 211 undergraduates attended Session One and form the main analytical sample; 204 attended both sessions. The sign-up survey had 256 respondents.
- **Setting:** Two proctored, in-person laboratory sessions approximately one week apart.
- **Topics:** Blockchain technology, carbon capture systems, or CRISPR gene editing. Students were randomly assigned one topic and reported limited baseline knowledge.
- **Task:** Up to 35 minutes to learn about the assigned topic and write an approximately 500-word analytical essay. Students then completed an unaided five-item knowledge test. In Session Two they completed an unaided ten-item knowledge test and a 20-minute analytical essay using the complementary prompt.
- **Treatment assignment:** Between-subject random assignment to AI-allowed or AI-forbidden conditions during the Session One learning phase. Assignment was stratified through eight time slots and parallel labs.
- **AI access:** AI-allowed students could use any generative-AI tool and were given a logged-in ChatGPT account running GPT-4o. AI-forbidden students could use traditional online resources but not generative AI.
- **Immediate outcomes:** Self-assessed knowledge, an unaided five-item factual and conceptual knowledge test, essay quality and dimensions, linguistic features, AI-detection measures, time allocation, task experience, and integrity measures.
- **Delayed outcomes:** An unaided ten-item knowledge-retention test, an unaided analytical essay, and an exit survey in Session Two.
- **Follow-up interval:** Mean 6.99 days; 61.4% returned exactly seven days later and 80.5% within six to eight days.
- **Main immediate test result:** Intent-to-treat gain of 6.7 percentage points, or 0.27 control-group standard deviations (`p = 0.034`), from a control mean of 56.3%.
- **Main delayed test result:** Intent-to-treat gain of 5.1 percentage points, or 0.27 control-group standard deviations (`p = 0.027`), from a control mean of 49.5%. The point estimate is about 76% of the immediate raw-score effect; the two session effects are not statistically distinguishable.
- **Delayed essay results:** Writing style and clarity rose 0.30 SD (`p = 0.016`) and relevance rose 0.26 SD (`p = 0.041`). Overall essay quality rose 0.20 SD but was imprecise (`p = 0.143`).
- **Primary statistical specification:** Linear intent-to-treat models with randomization-strata fixed effects and controls selected by double lasso; heteroskedasticity-robust standard errors. Treatment-on-the-treated estimates instrument actual ChatGPT use with randomized AI-allowed assignment using two-stage least squares.

### Usage classification

The paper did not randomize students to augmentation or automation interfaces. It used an LLM, Anthropic Claude Opus 4, to classify monitored ChatGPT logs after treatment.

At prompt level, “explaining concepts” meant asking ChatGPT to explain, clarify, or teach a concept from the reading. “Drafting responses” meant asking it to write, draft, or generate essay text. Other categories were summarizing, proofreading, editing, and other.

At conversation level:

- **Automation:** AI does the work for the student, including essay text, draft paragraphs, or paste-ready content.
- **Augmentation:** AI works with the student through explanation, clarifying questions, feedback on the student's own writing, or checking work.
- **Mixed:** Substantial elements of both.
- **Other:** Off-topic, unrelated, or tool-testing conversation.

Student-level indicators were then constructed. A student entered the automation subgroup if any conversation was Automation or Mixed, and the augmentation subgroup if any conversation was Augmentation or Mixed. Mixed users can therefore appear in both groups; the groups are neither mutually exclusive nor collectively exhaustive. Each treated subgroup was compared separately with the full control group.

The paper does not report that this behavior classification was preregistered. The categories are observed, post-treatment usage patterns. The authors call the broader experiment randomized, but the augmentation-versus-automation comparison is not itself a randomized treatment contrast.

### Subgroup estimates and uncertainty

For Session Two:

- **Augmentation subgroup:** test-score estimate 0.292 SD (`SE = 0.154`, `p = 0.061`); overall essay-quality estimate 0.220 SD (`SE = 0.177`, `p = 0.216`); quality-index estimate 0.249 SD (`SE = 0.186`).
- **Automation subgroup:** test-score estimate 0.189 SD (`SE = 0.193`, `p = 0.330`); overall essay-quality estimate 0.017 SD (`SE = 0.237`); quality-index estimate 0.036 SD (`SE = 0.246`).

These are suggestive subgroup patterns, not causal estimates of being an augmentation user rather than an automation user. The paper does not report a randomized test of a tutor-style interface against a generator-style interface.

### Author-stated limitations and design boundaries

- The estimates hold time on task approximately fixed in a laboratory setting with few competing uses of time.
- The authors explicitly state that the findings do not imply widespread AI adoption will raise learning overall.
- Outside the laboratory, students can use AI to save time and reallocate that time elsewhere, so total learning may differ.
- Students chose how to use AI; those choices are endogenous to incentives.
- The study covers one institution, undergraduate volunteers, three technical topics, a time-bounded learning-and-essay task, and one-week follow-up.
- The main analytical sample is 211, with 204 completing both sessions.
- Four early protocol deviations are disclosed; the analyses include session fixed effects.
- AI access increased test-rule violations. The authors estimate that violations could explain at most a modest share of the immediate test effect under their stated assumptions.

## Version record

### Earlier conference abstract

- **Title:** *Experimental Evidence on the Learning Impact of Generative AI*
- **Date and venue:** 2025 Economic Science Association conference Book of Abstracts
- **Authorship shown:** Germán Reyes
- **Sample reported:** 210 undergraduates
- **Claims reported:** AI-allowed versus AI-forbidden randomized conditions; immediate gain of 0.20 SD; no meaningful longer-term retention effect; 11% less drafting, 20% less planning, more passive information gathering, and 15% higher enjoyment.
- **Interpretation reported:** Tension between short-term utility and durable learning.

### July 2026 primary paper

- **Title:** *Experimental Evidence on the Learning Impact of Generative AI*
- **Date and repositories:** July 2026; arXiv `2607.08849v1`; IZA Discussion Paper No. 18792
- **Authors:** Zara Contractor and Germán Reyes
- **Sample reported:** 211 Session One participants; 204 completed both sessions
- **Claims reported:** Immediate knowledge-test gain of 0.27 SD and a statistically significant 5.1-point retention-test gain one week later; delayed style-and-clarity and relevance gains; post-treatment usage heterogeneity between augmentation and automation patterns.

The July paper differs materially from the earlier abstract on sample count, immediate effect size, durable retention, behavioral interpretation, and the addition of essay outcomes and usage-pattern analysis. The article must cite and describe only the July 2026 paper unless it explicitly identifies the conference abstract as version history.

## Required article corrections

1. Describe augmentation and automation as observed, LLM-classified use patterns among treated ChatGPT users—not assigned interfaces.
2. Qualify “explanation-seeking behavior was associated with more durable gains” as a suggestive subgroup pattern: the augmentation test estimate at one week was positive and marginal (`p = 0.061`), while delayed essay estimates were positive but imprecise.
3. Describe the automation result precisely: short-run essay-quality gains faded after AI removal; its delayed test estimate was positive but imprecise, not evidence of zero learning.
4. Do not say the paper proves tutor-style use is causally superior to text generation.
5. Use the July 2026 arXiv/IZA version only. Do not merge its results with the 2025 conference abstract.
6. Correct the difficulty citation. The 2018 article is by Ouhao Chen, Juan C. Castro-Alonso, Fred Paas, and John Sweller—not Chen, Kalyuga, and Sweller.
7. Remove any remaining attribution of the 2025 retrieval meta-analysis to Moreira and colleagues. No such attribution appears in the current repository; it existed only in superseded drafting instructions.

## Corrected source list

- Bisra, Kiran; Liu, Qing; Nesbit, John C.; Salimi, Farimah; & Winne, Philip H. “Inducing Self-Explanation: a Meta-Analysis.” *Educational Psychology Review*, 30, 703–725 (2018). Published March 29, 2018. https://doi.org/10.1007/s10648-018-9434-x.
- Chen, Ouhao; Castro-Alonso, Juan C.; Paas, Fred; & Sweller, John. “Undesirable Difficulty Effects in the Learning of High-Element Interactivity Materials.” *Frontiers in Psychology*, 9, Article 1483 (2018). Published August 13, 2018. https://doi.org/10.3389/fpsyg.2018.01483.
- Chi, Michelene T. H.; de Leeuw, Nicholas; Chiu, Mei-Hung; & LaVancher, Christian. “Eliciting Self-Explanations Improves Understanding.” *Cognitive Science*, 18(3), 439–477 (1994). https://doi.org/10.1207/s15516709cog1803_3.
- Contractor, Zara, & Reyes, Germán. “Experimental Evidence on the Learning Impact of Generative AI.” arXiv:2607.08849v1, submitted July 9, 2026; IZA Discussion Paper No. 18792, July 2026.
- Dunlosky, John; Rawson, Katherine A.; Marsh, Elizabeth J.; Nathan, Mitchell J.; & Willingham, Daniel T. “Improving Students’ Learning With Effective Learning Techniques: Promising Directions From Cognitive and Educational Psychology.” *Psychological Science in the Public Interest*, 14(1), 4–58 (2013). https://doi.org/10.1177/1529100612453266.
- Gonçalves, Ariel de Oliveira; Muniz, Bruno Felipe Barbosa; & Jaeger, Antônio. “Retrieval Practice Versus Elaborative Encoding: A Systematic and Meta-analytic Review.” *Educational Psychology Review*, 37, Article 100 (2025). Published October 30, 2025. https://doi.org/10.1007/s10648-025-10076-6.
- Lodge, Jason M.; Kennedy, Gregor; Lockyer, Lori; Arguel, Amael; & Pachman, Mariya. “Understanding Difficulties and Resulting Confusion in Learning: An Integrative Review.” *Frontiers in Education*, 3, Article 49 (2018). Published June 28, 2018. https://doi.org/10.3389/feduc.2018.00049.
- Roediger, Henry L., III, & Karpicke, Jeffrey D. “Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention.” *Psychological Science*, 17(3), 249–255 (2006). https://doi.org/10.1111/j.1467-9280.2006.01693.x.

## Claim boundaries

- The Reddit source directly supports only the existence and content of the proposed prompt and the poster’s stated concern.
- Self-explanation and retrieval research supports bounded learning mechanisms in studied settings, not the complete Reddit workflow.
- Difficulty is not inherently productive. Prior knowledge, task complexity, cognitive load, feedback, accessibility, and scaffolding matter.
- The cited evidence does not measure legal authorship, originality, or “authorship preservation.”
- “Preserved intellectual participation” is an editorial inference about visible learner activity and decision-making.
- PasteLint is not an educational tutor, Second Draft does not assess understanding, and this investigation establishes no engine requirement.

## Publication-readiness decision

**Ready for unpublished article implementation.**

The primary paper, version discrepancy, community source, and corrected research citations are now recorded. Implementation must carry forward the subgroup qualifications above. This status does not authorize publication, a manifest entry, homepage placement, analytics, a publication date, a CTA, sitemap changes, engine work, or product behavior changes.

## Repository relationships

- **Related rules:** None.
- **Related tests:** None.
- **Related publications:** None until an unpublished article record is separately approved.
- **Secondary references:** `docs/workflow-v2.md`
- **Canon promotion candidate:** `false`
- **Handbook promotion candidate:** `false`
- **Invalidation risk:** Later paper versions, peer review, replication, direct interface experiments, accessibility research, or source deletion may require narrowing the synthesis.
- **Existing knowledge potentially affected:** Future Journal claims about augmentation, automation, learning, intellectual participation, and tool responsibility.
