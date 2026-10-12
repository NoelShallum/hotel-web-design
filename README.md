# hotel-web-design

Website for **Shivaya Prakriti: An Ananda Kedar Experience**, a Himalayan wellness retreat, boutique stay and café.

## What is here

| Path | What it is |
|---|---|
| [master.md](./master.md) | Everything the founder has said so far, condensed, plus the design decisions |
| [questions_log.md](./questions_log.md) | Open questions, and where answers are recorded |
| [references/](./references/) | Style references, links, images and the [brand guidelines](./references/brand-guidelines.md) |
| [site/](./site/) | Website v1: a static one-page site |

## Website v1

Plain HTML, CSS and a little JavaScript. No build step and no dependencies. Fonts load from Google Fonts.

```
site/
  index.html
  assets/
    css/styles.css      design tokens and all styles
    js/main.js          mobile menu and enquiry form
    img/                placeholder images and favicon
```

**Run it locally**

```
python3 -m http.server 8000 -d site
```

Then open http://localhost:8000.

**Style:** Indian Brutalism in the Sandhya palette with the Signboard type system. The rules are in [references/brand-guidelines.md](./references/brand-guidelines.md).

## Before launch

- Resolve every placeholder chip. Search the code for `class="tbc"`; each one is a fact the founder still has to confirm (location, rooms, prices, café opening, contact details).
- Replace the two campfire images with real photography. The current ones are crops of an AI-generated mood reference.
- Have a native Hindi speaker review every Devanagari phrase.
- Connect the enquiry form. Set `ENQUIRY_ENDPOINT` in `site/assets/js/main.js` once the founder decides how enquiries should arrive. Until then the form validates and sends nothing.
- Decide the logo or wordmark and the tone of voice, then update the brand guidelines.
