# hotel-web-design

Website for **Shivaya Prakriti: An Ananda Kedar Experience**, a Himalayan wellness retreat, boutique stay and café.

## What is here

| Path | What it is |
|---|---|
| [master.md](./master.md) | Everything the founder has said so far, condensed, plus the design decisions |
| [questions_log.md](./questions_log.md) | Open questions, and where answers are recorded |
| [references/](./references/) | Style references, links, images and the [brand guidelines](./references/brand-guidelines.md) |
| [site/](./site/) | The website: a static one-page site in the Fireside Dusk direction, plus a separate mountain trips page |
| [tests/](./tests/) | Browser checks for the mountain trips page and the parts of the site it touches |

## Website (v2, Fireside Dusk)

Plain HTML, CSS and a little JavaScript. No build step and no dependencies. Fonts load from Google Fonts.

```
site/
  index.html            the retreat, one scrolling page
  trips.html            mountain trips: a separate, vendor-backed offering
  assets/
    css/styles.css      design tokens and all styles
    css/journey.css     the guided journey
    css/trips.css       styles that only the trips page needs
    js/main.js          mobile menu, enquiry form, and the shared send (window.SP)
    js/journey.js       the guided journey: steps, scenes, sound, plan and lead form
    js/trips.js         the trips enquiry form: validation, the WhatsApp message, media
    js/trips-config.js  the one file that switches trip enquiries on, and lists trip media
    img/photos/         placeholder photography and CREDITS.md
    img/thumbs/         small copies for the journey's cards
    video/              placeholder fire loop, wide and tall
    img/favicon.svg
```

**Guided journey.** A full-screen, question-led journey opens in front of the page on a first visit and ends in a lead form. Reasoning, flow, consent and events are in [references/guided-journey.md](./references/guided-journey.md). Useful links: `?journey=1` (always show it), `?journey=0` (never), `?path=stay|sound|yoga|food|craft|host` (straight into one chapter, for campaigns). It never stores names or contact details in the browser.

**Mountain trips.** [site/trips.html](./site/trips.html) is a proposal for one- and two-night trips arranged with independent vendors. It is kept apart from the proposed permanent retreat, and it states nothing the business has not decided: unknowns show as `[TBC]`. Its enquiry form prepares a WhatsApp message that the visitor reviews and sends themselves. **Enquiries are not open yet**: the receiving number in `site/assets/js/trips-config.js` is empty, so the form only checks answers and says nothing was sent. What was built, the form fields, the remaining business decisions and the steps to switch enquiries on are in [references/mountain-trips.md](./references/mountain-trips.md).

**Run it locally**

```
python3 -m http.server 8000 -d site
```

Then open http://localhost:8000.

**Check it**

```
npm i --no-save playwright-core
node tests/trips.check.cjs
```

The checks open the site in a real browser (set `CHROMIUM_PATH` if Playwright has no browser of its own) and block every request that leaves the local server, so no WhatsApp message or other external call can be made. Details in [references/mountain-trips.md](./references/mountain-trips.md), section 7.

**Style:** Fireside Dusk, for Delhi weekenders and international guests. The rules are in [references/brand-guidelines.md](./references/brand-guidelines.md) (v2.0). The earlier Brutalism guidelines are archived in [references/archive/](./references/archive/).

## Before launch

- Resolve every placeholder chip. Search the code for `class="tbc"`; each one is a fact the founder still has to confirm (location, rooms, prices, café opening, contact details).
- Replace all placeholder photography with real photos of the property. The current ones are free stock images credited in [site/assets/img/photos/CREDITS.md](./site/assets/img/photos/CREDITS.md), and none shows the place.
- Resolve the travel guidance for Delhi and international guests (marked TBC on the page).
- Have a native Hindi speaker review every Devanagari phrase.
- Connect the enquiry form. Set `ENQUIRY_ENDPOINT` in `site/assets/js/main.js` once the founder decides how enquiries should arrive. Until then the form validates and sends nothing, and the retreat forms are labelled as inactive previews.
- Mountain trips: settle the business decisions listed in [references/mountain-trips.md](./references/mountain-trips.md) (section 4), then follow its steps (section 5) to switch on WhatsApp enquiries. That means supplying the business number, testing a real message on a phone, and replacing the empty media slots with real, correctly labelled photos and video.
- Decide the logo or wordmark and the tone of voice, and update the brand guidelines if they change.
- Run the photo shoot from the shot list in the brand guidelines (section 7.4), and replace the placeholder photos.
