# PasteLint Demo Copy Bank

## Purpose

This file collects safe, reusable messy-text examples for PasteLint demos, manual QA, screenshots, landing page proof, Reddit posts, LinkedIn posts, and short product videos.

The examples are fictional and designed to show common text-preparation problems without using private customer, client, patron, library, or production text.

## Usage Notes

- Use these examples for screenshots, manual QA, social posts, and future landing page proof.
- Do not treat every "expected direction" as a guaranteed exact engine output unless verified.
- Avoid real customer/client text.
- Keep examples browser-only and cleanup-focused.
- Do not use these examples to position PasteLint as a cheating or evasion tool.

## Demo Sets

### 1. AI Meeting Follow-Up Slop

**Use case:** Clean up AI-generated follow-up copy before sending it.

**Messy input:**

```text
Hi team,

I just wanted to reach out and say that we should probably take a look at the draft before sending it over. I think there are a few areas where we can leverage the opportunity to move forward in a seamless way and make sure the messaging is aligned.

At the end of the day, this will help us drive clarity, unlock momentum, and ensure everyone is on the same page.

Thanks in advance!
```

**What PasteLint should help with:**

- Reduce inflated wording and repeated business filler.
- Make the next action easier to spot.
- Prepare the text for a clearer rewrite.

**Best destination page/tool:** Clean ChatGPT Output -> SecondDraft

**Notes for future screenshot or post:**

- Good for showing the "AI output cleanup first, rewrite second" story.
- Expected direction: shorter, clearer, less padded. Verify exact engine output before quoting it.

### 2. PDF Paste Line Break Mess

**Use case:** Repair text copied out of a PDF or report.

**Messy input:**

```text
This is a sentence that
was copied from a PDF and
breaks in the middle of the
thought.

Section 4.2    Results
The report found    inconsistent spacing
across copied text.

1. First item
2. Second item
3. Third item
```

**What PasteLint should help with:**

- Rejoin wrapped paragraph lines.
- Preserve headings and list structure where possible.
- Normalize odd spacing.

**Best destination page/tool:** Fix PDF Paste

**Notes for future screenshot or post:**

- Strong before/after screenshot candidate.
- Avoid implying PDF upload or OCR. This is pasted-text cleanup only.

### 3. Hidden Character Trap

**Use case:** Show text that looks normal but contains invisible formatting.

**Messy input:**

```text
This text​looks normal but contains hidden spacing.

This line uses nonbreaking spaces.

support​@example.com

https://example​.com/path
```

**What PasteLint should help with:**

- Remove zero-width characters without merging words.
- Preserve email and URL structure.
- Preserve pasted line and paragraph structure.
- Convert hard spaces into normal spaces.

**Best destination page/tool:** Remove Hidden Characters

**Notes for future screenshot or post:**

- The sample includes actual zero-width characters between `text` and `looks`, inside `support@example.com`, and inside `example.com`.
- Add a visual annotation in screenshots so people understand the problem is invisible.

### 4. IVR Menu Prep

**Use case:** Prepare a phone menu script for review before speech markup.

**Messy input:**

```text
Welcome to the Example Library phone line.

Press 1 for hours@example.org     Press 2 for upcoming events
Press 3 for account help

Visit library.example.org for more information
or call the main desk at 2-4-8, 0-0-0, 0-1-0-0.
```

**What PasteLint should help with:**

- Separate menu options.
- Clean rough spacing.
- Make contact information easier to review before audio.
- Prepare the cleaned script for SSML if needed.

**Best destination page/tool:** IVR Text Prep -> SSML Builder

**Notes for future screenshot or post:**

- Use `example.org` domains only.
- Do not claim the basic IVR page performs every speech conversion unless verified.

### 5. TTS Read-Aloud Script

**Use case:** Clean narration text before read-aloud or TTS preparation.

**Messy input:**

```text
This Friday, July 24, the community center will host a long informational session about parking, forms, guest check-in, accessibility seating, and volunteer assignments, so please read all of the details carefully before arriving & bring any questions with you.

Doors open @ 9:00 AM. Coffee/snacks available.
```

**What PasteLint should help with:**

- Surface long sentences that may be hard to follow when heard.
- Normalize symbols that can sound awkward.
- Prepare text for SSML review if needed.

**Best destination page/tool:** TTS Text Cleanup -> SSML Builder

**Notes for future screenshot or post:**

- Good for "text that reads fine silently but sounds awkward aloud."
- Expected direction: cleaner punctuation, clearer review target, better speech prep.

### 6. SSML Safety Sample

**Use case:** Exercise SSML Builder safety behavior.

**Messy input:**

```text
Need help?

Contact OTBS@example.org for more information.

Featured title: DB123456

A & B < C > D

Program™ update

Visit library.example.org before the event.
```

**What PasteLint should help with:**

- Format contact information for speech prep.
- Expand DB numbers for review.
- Escape XML-sensitive characters during SSML generation.
- Preserve terminal punctuation on headings.
- Remove common legal/trademark symbols from cleaned speech copy.

**Best destination page/tool:** SSML Builder

**Notes for future screenshot or post:**

- Good regression/demo source for SSML safety.
- Do not quote exact generated SSML unless verified against current code.

### 7. Mobile Text Message Cleanup

**Use case:** Clean a quick message before sending.

**Messy input:**

```text
hey sorry just seeing this now

i can probably make it work but   i need to move a couple things around first

if that is annoying no worries just let me know lol
```

**What PasteLint should help with:**

- Clean spacing and line breaks.
- Make the message easier to review.
- Prepare the text for a more confident rewrite if needed.

**Best destination page/tool:** Clean Text Message

**Notes for future screenshot or post:**

- Keep tone casual; do not over-polish it into a corporate email.
- Good small-screen demo candidate.

### 8. Support Email Cleanup

**Use case:** Turn a long, hedgy support/update email into something cleaner.

**Messy input:**

```text
Hi there,

I just wanted to follow up because I think there might have been a little confusion about the update that went out yesterday. We are still looking into the issue and we will probably have a better answer soon, but in the meantime I wanted to let you know that nothing has been lost and your request is still in progress.

Please let us know if you have any additional questions or concerns and we would be happy to help however we can.
```

**What PasteLint should help with:**

- Remove filler and hedging.
- Preserve the practical message.
- Prepare the email for SecondDraft if the wording needs refinement.

**Best destination page/tool:** PasteLint Clean -> SecondDraft

**Notes for future screenshot or post:**

- Good demo for "clearer without changing meaning."
- Expected direction: direct, calm, reassuring.

### 9. "AI Slop to AI Sleek" Campaign Example

**Use case:** Marketing exploration for a playful before/after concept.

**Messy input:**

```text
In today's fast-paced digital landscape, it is more important than ever to leverage robust communication strategies in order to ensure that your message resonates with stakeholders in a meaningful and impactful way.
```

**What PasteLint should help with:**

- Show how bloated copy can become easier to inspect and revise.
- Demonstrate cleanup before rewrite.
- Keep the joke pointed at messy text, not at users.

**Best destination page/tool:** Clean ChatGPT Output -> SecondDraft

**Notes for future screenshot or post:**

- Marketing exploration only, not production copy.
- Avoid wording that implies cheating or evasion.
- Possible caption: "Not magic. Just less mush."

### 10. Accessibility / Public Info Script

**Use case:** Prepare a public-service announcement for reading, publishing, or audio.

**Messy input:**

```text
Public notice:

The building will be closed Tues. 8/12 from 9:00-11:30 AM for maintenance & safety testing. Visitors may use the north entrance after 11:30 AM. For accessibility assistance, email access@example.org or visit services.example.org.

Thank you for your patience.
```

**What PasteLint should help with:**

- Review dates, times, symbols, and contact details.
- Improve read-aloud clarity.
- Prepare the text for TTS or SSML if needed.

**Best destination page/tool:** PasteLint Clean -> TTS Text Cleanup -> SSML Builder

**Notes for future screenshot or post:**

- Good for accessibility-friendly, public-information positioning.
- Keep claims practical: cleanup and prep, not final compliance approval.

## Future Ideas

- 30-second screen recording.
- Before/after carousel.
- Reddit-safe launch comment.
- GSC query-inspired demo pages.
- IVR/SSML niche demo.
- Hidden character horror story.
