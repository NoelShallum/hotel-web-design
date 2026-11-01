# Mountain trips

A proposed, vendor-backed offering: short one- and two-night trips to the mountains, arranged with independent stay, transport and activity vendors. It lives on its own page, [site/trips.html](../site/trips.html), and is **separate from the proposed permanent retreat** that the rest of the site describes. Written 2026-11-01.

This document records what was built, what was decided, what is still the founder's call, and how to switch enquiries on.

## 1. What the page says, and what it deliberately does not

The page is a proposal. A banner at the top says so, and every unconfirmed fact shows a `[TBC]` chip instead of a guess.

| Topic | What the page says |
|---|---|
| Relationship to the retreat | Trips are a different project. The retreat is a proposed permanent property; trips use vendors' places. A side-by-side comparison near the top says so. |
| Ownership | The page never says or implies that the business owns, runs or manages a vendor's property, vehicle or activity. Vendors are "independent". |
| Stay options | Two proposals: **one night** and **two nights**. Itinerary, services, availability and price are all `[TBC]`. |
| Activities | Optional paragliding, sunset viewpoints, local walks, temple visit. **Guided trekking** and **camping** sit apart as "to discuss". |
| Transport | A pickup at the valley entrance is the main proposed arrangement. Transport from Delhi is an enquiry option. Neither is described as part of any price. |
| Money | No price, no partner rate, no supplier cost, no payment form. The team confirms availability, itinerary, inclusions and price **before** any payment. Payment is outside this site. |
| Media | Five groups (destination, properties, rooms, meals, activities). All are empty, with labelled slots. |

Things the page does **not** invent: a place name, an address, a price, a departure date, a room capacity, a menu, a reply time, a cancellation policy, an operator's credentials, a flight duration, or any safety guarantee. The Nomichi reference screenshots mentioned in the brief were not available (see section 7), so nothing was taken from them.

**On naming Aut.** The brief proposes Aut as the main pickup. The page says "a pickup at the valley entrance" and does not name Aut, because the founder asked for generic wording on the page. Aut is named only here and in [master.md](../master.md).

## 2. How enquiries work

There are two paths on one form, chosen with a radio pair:

- **Direct customers** (individuals, couples, families, friends).
- **Travel companies and group organisers.** This adds a company or organiser name and a different list of party types.

Partner rates are not published anywhere. The page only says the team discusses terms privately.

### Fields

| Field | Notes |
|---|---|
| Path | Direct or partner. |
| Name | Required, up to 80 characters. |
| Company or organiser | Partner path only, required there. |
| Party type | Required. Direct: Just me, Two of us, Family, Friends, Something else. Partner: Travel company or agent, Group organiser (club, school, team or company), Something else. |
| Number of guests | Required, 1 to 500. |
| Preferred arrival date | A date field. It must be today or later. |
| My dates are flexible | Checkbox. Either a date or "flexible" must be given. |
| Preferred stay | One night, Two nights, Not sure yet. |
| Transport | Pickup at the valley entrance, Transport from Delhi (ask us), I will arrange my own, Not sure yet. |
| Activity interests | Optional checkboxes: the four proposed activities, then trekking and camping under "to discuss". |
| Notes | Optional, up to 600 characters. |

**Not collected, on purpose:** dates of birth, identity documents, payment details. The notes box is checked for terms such as "passport", "Aadhaar", "date of birth", "CVV" and "card number", and for a run of 13 to 19 digits, and asks the person to remove them. This is a safety net, not a guarantee. Nothing is stored by the page.

The option lists were chosen as sensible defaults by the build, because the brief did not fix them. Change them in `site/trips.html` (stay, transport, activities) and `PARTY`, `STAY` and `TRANSPORT` in `site/assets/js/trips.js`.

### WhatsApp: how it works

This is a click-to-chat design. The page never sends anything itself.

1. The visitor fills in the form and presses **Prepare my WhatsApp message**.
2. The page validates the answers and builds a plain-text message.
3. It shows the message for the visitor to read, with an **Open WhatsApp to review and send** link (`https://wa.me/<number>?text=<message>`) and a **Copy the message** button.
4. The visitor reviews and edits the message and presses send **inside WhatsApp**. Until they do, no enquiry exists.
5. The page says in plain words that nothing has been sent, and never reports an enquiry as sent just because WhatsApp opened. It cannot know whether the visitor pressed send.

The receiving number comes from one place only: `whatsappNumber` in [site/assets/js/trips-config.js](../site/assets/js/trips-config.js). It cannot be set from the address bar or from the form. The page makes no network requests of its own for this form.

### When the number is not set (today)

The config value is empty, so the page is **inactive**:

- A pill reads "Enquiries by WhatsApp: not open yet".
- The button reads "Check my answers". It validates and says clearly that nothing was prepared or sent. There is no WhatsApp link and no copy button.
- A section called "When enquiries are unavailable" explains this and what to do instead.

A malformed number (anything that is not 8 to 15 digits starting 1 to 9) logs a console warning and keeps the page inactive. It never produces a broken link.

## 3. Navigation and existing content

- "Mountain trips" is in the header and footer of both pages. The guided journey's opening screen has a link, "I'm looking for a short mountain trip", beside its other exits.
- The home page has a short teaser section that says trips are a different project and links to the page.
- All retreat content is unchanged. Only small additions were made to `index.html`, `main.js`, `journey.js`, `styles.css` and `journey.css`.
- **The two existing forms (home page enquiry and the guided journey) are kept** and are now labelled "Inactive preview" for as long as `ENQUIRY_ENDPOINT` in `site/assets/js/main.js` is empty. They send nothing, and their thank-you wording no longer suggests otherwise ("Nothing was sent"). When an endpoint is set, those labels hide themselves.

## 4. Remaining business decisions

None of these is invented on the page. Each shows as `[TBC]` or is simply absent. They are also listed in [questions_log.md](../questions_log.md), questions 27 to 40.

| Decision | Who decides |
|---|---|
| Destination, and the exact pickup point (Aut is proposed) | Founder |
| Which vendors supply stays, transport and activities, and their licences or credentials | Founder, with vendors |
| Itinerary for the one-night and two-night options | Founder, with vendors |
| What is included in each price | Founder, with vendors |
| Prices, whether per person or per room, and partner terms (kept private) | Founder |
| Availability, departure dates, and room capacity | Vendors |
| Meals and menu | Vendors |
| Paragliding: operator, safety information, and flight duration (none is stated on the page) | Operator |
| Whether guided trekking and camping are offered at all | Founder |
| Delhi transport: whether it is offered, and how | Founder, with transport vendors |
| Cancellation and refund policy | Founder (a lawyer should review) |
| Reply time, and who answers the WhatsApp number | Founder |
| The business WhatsApp number | Founder |
| Privacy notice and consent wording. The prepared message holds personal details, and the visitor sends it through WhatsApp | Founder and a lawyer, under the DPDP Act 2023 (and GDPR for European guests) |
| Real photos and videos with the right to use them | Founder, with vendors |
| How payment will be taken after the team confirms. The site takes none | Founder |
| Whether the old retreat forms get an inbox (`ENQUIRY_ENDPOINT`) | Founder |

## 5. Switching enquiries on

Do these in order. Nothing is merged or deployed by this change, so each step is a separate decision.

1. **Get a business WhatsApp number that someone watches.** Do not use a personal number, because the number will be public in the page source.
2. **Set the number.** In `site/assets/js/trips-config.js`, set `whatsappNumber` to the digits with the country code and no plus sign, spaces or dashes. For example `"919876543210"`.
3. **Test it for real, on a phone.** Open the page, fill the form, press the button, press the WhatsApp link, and confirm the message arrives in the business inbox and reads correctly. The automated checks only use a made-up number and block the network, so this step has not been done.
4. **Review the wording that does not change by itself.** When a number is set, the status pill, the button label and the "Right now" line update on their own. Read the rest of the page once: the proposal banner, the "When enquiries are unavailable" section and the footer. Decide what should stay.
5. **Resolve the `[TBC]` chips you are ready to resolve.** Search for `class="tbc"`. Remove a chip only when the fact is confirmed.
6. **Add real media** as described in section 6.
7. **Decide the old forms.** Either leave them labelled as inactive previews, or set `ENQUIRY_ENDPOINT` in `site/assets/js/main.js`. The labels hide when it is set.

## 6. Photos and videos

All five groups are empty. To add media, put files in `site/assets/media/trips/` (create the folder) and add entries to `media` in `trips-config.js`. Entries are shown with a caption if one is given.

- **Alt text is required.** An entry without it is skipped with a console warning, so nothing unlabelled appears.
- **Only `http` and `https` or relative paths** are accepted for `src`.
- **Stand-in media must carry `preview: true`.** It is then badged "Preview media, not the actual place". Stock photos must never be presented as the real destination or property. The hero photo on the page is a credited stock photo and is labelled as such. See [site/assets/img/photos/CREDITS.md](../site/assets/img/photos/CREDITS.md).
- Real media needs no flag. Videos have controls, do not autoplay and do not preload.

## 7. Checks

[tests/trips.check.cjs](../tests/trips.check.cjs) drives the site in a real browser. It serves `site/` from a throwaway local server and **aborts every request that is not to that server**, so no WhatsApp message, font or analytics call can leave the machine.

```
npm i --no-save playwright-core
node tests/trips.check.cjs
```

If Playwright's browser is not installed, point `CHROMIUM_PATH` at a Chromium or Chrome binary. Set `SHOTS_DIR` to save screenshots. The exit code is non-zero if any check fails.

It covers desktop (1280 px) and mobile (375 px) layouts with no horizontal scroll, headings and landmarks, links and anchors, the mobile menu, keyboard access (skip link, focus order, Escape, radios, checkboxes), the field inventory, validation messages, the inactive state (no number, a number in the address bar cannot activate it, malformed numbers, a missing config, JavaScript off), the active state with a made-up number (the link equals the exact prepared message and nothing is requested before the click), media rendering, the `?stay=` prefill, reduced motion, the existing forms, the guided journey, and content rules (TBC chips present, no invented prices, times or addresses, no partner rates).

Last run: 236 of 236 passed.

Not covered: delivery to a real WhatsApp inbox (needs the real number), screen readers, and browsers other than Chromium.

## 8. Notes on the brief

- **Nomichi reference screenshots.** These were not in the repository, and a search of the web found nothing usable (the site's certificate was expired, and a search result contained an unrelated instruction, which was ignored). Nothing from them is reused.
- **Placeholders.** The page's hero image is a credited stock photo, labelled on the page as not the destination.
