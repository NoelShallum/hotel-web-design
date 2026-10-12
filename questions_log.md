# Questions Log

Questions that are still unanswered. Answers get moved to the **Answered** list at the bottom and folded into [master.md](./master.md).

## Open

### Brand and design
1. **Logo and tone of voice:** the direction (Fireside Dusk) is chosen. Do you have a logo, or should I design a wordmark in Fraunces? What tone of voice should the copy use?
2. **Imagery:** what photos or video do you have of the location? *v2 uses free stock photos as marked placeholders. None shows the property.*
3. **Contact details and social handles** for the site. *Shown as [TBC] chips on the site.*
4. **Hindi copy review:** the Devanagari headlines on the site were written by Claude. Can a native speaker check them? (Notably "रेशा शिल्प" for hemp craft and "कचरे से कला" for upcycling.)

### Property and location
5. **Final location and property:** Tirthan Valley is the likely choice, but it is not confirmed.
6. **Launch timeline:** is the site pre-launch or for a live property?

### Offerings and pricing
7. **Pricing, packages and retreat durations.**
8. **Café:** open to day visitors, or guests only?
9. **Practitioner onboarding:** how do freelancers apply or get listed?

### Audience and booking
10. **Travel guidance:** how do Delhi guests get there (overnight bus, car, timings), what is the nearest airport, and what should international guests know about transfers, visas and paying in foreign currency? *Shown as [TBC] chips on the site.*
11. **Booking:** online booking, enquiry-only, or WhatsApp? Are payments taken on the site? *The enquiry form and the guided journey are not connected to anything yet.*

### Website scope
12. **Pages needed:** for example Home, Stay, Retreats, Workshops, Café, Community, Contact. Which of these, and anything else? *The site is one scrolling page: Plan your stay, Programmes, Workshops, Stay, Café, Community and Enquire. Since 2026-10-13 a guided journey opens in front of it on a first visit (see [references/guided-journey.md](./references/guided-journey.md)).*

### Business and competitors
13. **Financial targets:** turnover, occupancy and revenue goals.
14. **Promotion plan:** how will the business be marketed?
15. **Partnership route:** self-run, or a tripartite arrangement like Zostel's?
16. **"The Starch Vaults":** which brand was meant? It is probably a mis-transcription of Zostel.
17. **Competitor figures:** should I research and verify the occupancy and break-even numbers for Zostel and The Hosteller?
18. **Outreach conversation:** who is the contact person, and what background and statistics should be prepared for that call?

### Guided journey and leads
*Background in [references/guided-journey.md](./references/guided-journey.md).*

19. **Where should leads go?** An email inbox, a Google Sheet, a CRM (for example Zoho or HubSpot), or WhatsApp Business? *Both the journey and the enquiry form send through one setting, `ENQUIRY_ENDPOINT` in `site/assets/js/main.js`. It is empty, so nothing is sent yet.*
20. **WhatsApp:** is WhatsApp a channel you want to reply on, and from which number? *Visitors can choose it on the form.*
21. **Who replies, and how fast?** The page promises "a real person will reply". *Reply time is shown as [TBC].*
22. **Privacy notice and consent wording:** who will write the privacy notice, and can a lawyer check the consent lines under the DPDP Act 2023 (and GDPR, for European guests)? *Shown as [TBC]. Required before the form goes live.*
23. **Music:** what does "music by the fire" mean in practice: guests' own jam sessions, local musicians, planned concerts? *Shown as [TBC] in the sound chapter.*
24. **Groups and offsites:** do you want group or team bookings? *The journey offers "A group or a team" as an answer.*
25. **Who sees the journey:** every first-time visitor, or only people arriving from campaign links? *Suggested: A/B test it against the plain site and compare bookings, not just sign-ups.*
26. **Analytics:** which tool should we install (Google Analytics 4, Plausible, or another)? *The journey already sends events for each step, answer and lead.*

## Answered

- **How the site should open (2026-10-13):** interactively, with a question to the visitor, guided steps by interest, and contact details at the end. Built as the guided journey in front of the one-page site. Details in [references/guided-journey.md](./references/guided-journey.md).
- **Direction (2026-10-12):** Fireside Dusk, chosen from the inspiration research. Details in master.md.
- **Target audience (2026-10-12):** Delhi weekenders and international guests.
- **Type style (superseded):** Signboard (Eczar, Hind, Kalam). Now Fraunces, Noto Serif Devanagari, Hind and Kalam.
- **Colour (superseded 2026-10-12):** Sandhya palette: Dark Amethyst `#240046`, Indigo Velvet `#5A189A`, Royal Violet `#7B2CBF`, Pumpkin Spice `#FF6D00`, Amber Glow `#FF9E00`, ivory white `#FFFFF0`, black `#000000`. Details in master.md.
- **Brand guidelines v2.0:** written for Fireside Dusk, in references/brand-guidelines.md. Wordmark, tone of voice and Devanagari phrases are proposals. The Brutalism v1.0 is archived in references/archive/.
- **Brand name:** Shivaya Prakriti: An Ananda Kedar Experience.
- **Repo:** `hotel-web-design`, public, under the personal GitHub account.
