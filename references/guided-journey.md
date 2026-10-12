# The guided journey

How the site opens, why, and what still needs deciding. Written 2026-10-13 from the founder's brief. The code is in `site/assets/js/journey.js` and `site/assets/css/journey.css`.

## 1. The founder's brief, condensed

- Make the site interactive, not the usual Home, About, Rooms.
- Open with something engaging, such as asking visitors who they are or putting a direct question to them. It must not feel off-putting or cliché.
- Hold attention for a couple of minutes.
- Guide people step by step through what interests them: the stay, music, the café and food, yoga.
- End by collecting contact details, either because they ask us to reach out or because they give us permission to pitch them.

## 2. The approach: a front door, not a wall

The journey is a full-screen layer over the existing one-page site. It opens on a first visit and is always one tap from the full site ("Skip to the full site", top right). Nothing on the page is removed. That keeps three things working:

- **Search and sharing.** Every section is still in the HTML, so search engines and link previews see the whole site.
- **Returning visitors.** Once someone skips or finishes, the journey stays closed for them. It reopens from "Plan your stay", the contact section, or the preview ribbon.
- **Links to a section.** A link such as `/#cafe` goes straight to the café and never shows the journey.

## 3. The opening question

> Dusk in the Himalayas. The fire is lit, and somewhere below you is the river.
>
> **What has the city been keeping you from?**

Why this question:

- It is about the visitor, not about us, which is what the brief asked for. It still avoids "Who are you?", which reads like a form.
- It names the Delhi weekender's problem (the city) without a wellness cliché like "find your inner peace".
- Every answer is one of the five things the place offers, so one tap tells us what to show next.
- It costs nothing to answer: no typing, no email, and the fire video plays behind it.

| Door | Opens the chapter | Micro-question in the chapter |
|---|---|---|
| Sleep, and a quiet room | Stay | What would make the room right for you? |
| Music that isn't traffic | Sound and music (with a singing bowl to strike) | Have you tried sound healing before? |
| Room to stretch and breathe | Vedic yoga (with a breathing ring) | Where is your practice right now? |
| Food you know the source of | Café | How do you like to eat? |
| Making things with my hands | Workshops | Which ones catch your eye? |

Two quieter links sit under the doors: "I'm just looking around" (straight to the full site) and "I'm a practitioner, artist or volunteer" (the hosting path, section 5).

## 4. The route through it

The steps are worked out from the answers, so nobody sees a chapter they didn't ask for.

```
intro ─► who's coming ─► how long ─► your chapter ─► anything else? ─► extra chapters ─► where from ─► your plan ─► contact ─► thanks
  │
  └─► practitioner ─► contact ─► thanks
```

- **About 7 to 10 taps, roughly two minutes.** Each screen asks one thing.
- **Every answer gets a reply** in the handwritten Kalam style ("A week. Long enough to settle in."). It feels like being listened to, and it proves the answer was used.
- **Where from** draws the road from Delhi on a small map and counts up the kilometres. That answers the "how do I get there" question early.
- **The plan** is a cream postcard built from the answers: a title such as "A week for two, from Delhi.", what they picked, up to three photos, and a sample day (first light, midday, dusk, night). It is marked "A sketch, not a booking", and prices and timings are TBC.
- **Progress, back and resume.** A thin progress line, a Back button that works with the browser's back button, and "Pick up where you left off" if someone returns mid-way.

## 5. Asking for contact details

The plan is the reason to leave details. Below it are two honest choices, matching the two outcomes in the brief:

| Button | Intent | What we promise |
|---|---|---|
| **Yes, get in touch with me** | `outreach` | A real person replies about their plan. A separate, unticked box offers news as well. |
| **Not yet. Just keep me posted** | `updates` | News when dates and retreats open, nothing else. Choosing the button is the consent, and the line under it says so. |
| Practitioner path | `host` | A reply about their practice. The note field opens by default. |

Visitors choose email or WhatsApp, and only the field they picked is required. The form asks for no more than it needs: a name, one way to reply, and an optional note.

**Consent.** For India, the DPDP Act 2023 commentary we found says marketing needs a separate, unticked, specific opt-in, that withdrawing must be as easy as agreeing, and that each opt-in should be recorded. The form follows that. It still needs:

- a privacy notice (shown as TBC)
- a lawyer's review of the consent lines, including whether the notice must be offered in other Indian languages
- a record of each consent wherever leads are stored

**What the browser keeps.** Only the answers and the step reached, under `sp-journey` in localStorage. Names, emails and phone numbers are never stored in the browser. Campaign tags (`utm_*`) are kept for the session and sent with the lead.

## 6. Motion, video and sound

- **Fire video.** A silent 10-second loop, wide on laptops and tall on phones, with a still poster. It pauses when the tab is hidden, and it is skipped under reduced motion or a data-saver connection.
- **Scenes.** Each step has its own photo, with a slow drift and a crossfade that never dips to black.
- **Embers** rise over the fire scenes only.
- **Sound is off by default.** The toggle starts a quiet bed of fire and air that changes with the scene. The singing bowl plays when struck. All of it is generated in the browser, so there are no audio files.
- **Reduced motion.** Everything arrives at once, nothing drifts, the map draws complete and the video stays a still.

## 7. Campaign links

| Link | Opens |
|---|---|
| `/?path=stay`, `sound`, `yoga`, `food`, `craft` | Straight into that chapter, then the usual steps. Use these on social posts, e.g. `?path=food` from a café post. |
| `/?path=host` | The practitioner path |
| `/?journey=1` or `/#journey` | The journey from the start, even for returning visitors |
| `/?journey=0` | The full site, never the journey |

Add `utm_source` and `utm_campaign` to any of them and the lead will carry them.

## 8. Measuring it

The journey sends events to `window.dataLayer` (for Google Tag Manager or GA4) and as a `sp:journey` browser event:

| Event | When |
|---|---|
| `journey_open` | It opens, with `via`: landing, link, page button or campaign path |
| `journey_step` | Each step, with its index in the route |
| `journey_answer` | Each answer |
| `journey_intent` | One of the two plan buttons |
| `journey_lead` | A contact form is sent, with intent, channel and news consent |
| `journey_exit` | Skip, "just looking", or done, with the step they left from |
| `journey_sound`, `journey_bowl`, `journey_restart` | Sound toggled, bowl struck, journey restarted |

What to watch: the share who answer the first question, drop-off at each step, how many reach the plan, the split between the two buttons, and above all how many leads turn into stays.

## 9. Is a quiz better than a form? Test it

Vendor data says quiz funnels capture more leads than plain contact forms. The numbers vary widely, and almost every source sells quiz software. Read loosely, they suggest roughly 2 to 5 times as many leads, not the 16 times some claim. Multi-step forms close much of the gap on their own. The only figure worth trusting is our own, so:

1. Run an A/B test: half of first-time visitors see the journey, half land on the full site. Use `?journey=0` and `?journey=1` links, or a flag in the head script.
2. Compare leads per visitor and, more importantly, enquiries that become bookings.
3. Watch for the journey annoying people: a high skip rate on the first screen is the warning sign.

## 10. To decide

Tracked in [questions_log.md](../questions_log.md), questions 19 to 26: where leads go, the WhatsApp number, who replies and how fast, the privacy notice, the music offer, group bookings, whether every first visit should see the journey, and which analytics tool to use.

## Sources

- Quiz funnels and conversion: [Fyrebox](https://www.fyrebox.com/blog/quizzes-convert-better-than-forms), [ConvertFlow quiz funnel benchmark, September 2026](https://www.convertflow.com/benchmark-reports/lead-generation-quiz-funnel-benchmark-september-2026), [HelloTars](https://hellotars.com/ai-agents/quiz-ai-agent-for-lead-generation), [OrbitForms](https://orbitforms.ai/blog/how-to-create-quiz-funnels), [LeadGen Economy](https://www.leadgen-economy.com/blog/lead-generation-landing-page-funnels-guide/)
- Travel and hospitality examples: [involve.me](https://www.involve.me/blog/why-travel-agencies-should-use-quizzes-for-lead-generation-examples-templates), [Interact podcast with White Eagle Resort](https://www.tryinteract.com/podcast/?p=1343), [Club Med and Riddle case study](https://www.casestudies.com/company/riddle/case-study/club-med-boosts-opt-ins-to-83-with-riddle)
- Consent under the DPDP Act 2023: [Clifford Chance briefing (PDF)](https://financialmarketstoolkit.cliffordchance.com/content/dam/cliffordchance/briefings/2023/08/digital-personal-data-protection-act-indias-new-data-protection-framework.pdf), [King Stubb & Kasiva on consent](https://ksandk.com/data-protection-and-data-privacy/dpdp-act-consent-rules/), [King Stubb & Kasiva on websites](https://ksandk.com/data-protection-and-data-privacy/dpdp-act-website-compliance/), [Rainmaker](https://rainmaker.co.in/?p=19349), [DomainIndia](https://domainindia.com/support/kb/dpdpa-compliance-indian-websites-data-protection-act-2023)
