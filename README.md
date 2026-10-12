# hotel-web-design

Website for **Shivaya Prakriti: An Ananda Kedar Experience**, a Himalayan wellness retreat, boutique stay and café.

## What is here

| Path | What it is |
|---|---|
| [master.md](./master.md) | Everything the founder has said so far, condensed, plus the design decisions |
| [questions_log.md](./questions_log.md) | Open questions, and where answers are recorded |
| [references/](./references/) | Style references, links, images and the [brand guidelines](./references/brand-guidelines.md) |
| [site/](./site/) | The website: a static one-page site in the Fireside Dusk direction |

## Website (v2, Fireside Dusk)

Plain HTML, CSS and a little JavaScript. No build step and no dependencies. Fonts load from Google Fonts.

```
site/
  index.html
  assets/
    css/styles.css      design tokens and all styles
    js/main.js          mobile menu and enquiry form
    img/photos/         placeholder photography and CREDITS.md
    img/favicon.svg
```

**Run it locally**

```
python3 -m http.server 8000 -d site
```

Then open http://localhost:8000.

**Style:** Fireside Dusk, for Delhi weekenders and international guests. The direction, palette and type are in [master.md](./master.md). The earlier Brutalism guidelines in [references/brand-guidelines.md](./references/brand-guidelines.md) are on hold, and a Fireside Dusk version is still to write.

## Before launch

- Resolve every placeholder chip. Search the code for `class="tbc"`; each one is a fact the founder still has to confirm (location, rooms, prices, café opening, contact details).
- Replace all placeholder photography with real photos of the property. The current ones are free stock images credited in [site/assets/img/photos/CREDITS.md](./site/assets/img/photos/CREDITS.md), and none shows the place.
- Resolve the travel guidance for Delhi and international guests (marked TBC on the page).
- Have a native Hindi speaker review every Devanagari phrase.
- Connect the enquiry form. Set `ENQUIRY_ENDPOINT` in `site/assets/js/main.js` once the founder decides how enquiries should arrive. Until then the form validates and sends nothing.
- Decide the logo or wordmark and the tone of voice, then write brand guidelines v2.
