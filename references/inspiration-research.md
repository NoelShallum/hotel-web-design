# Inspiration research: Indian wellness, Himalayan stays, trek and craft brands

Date: 2026-10-12. Written after the founder set aside the Indian Brutalism direction.

**Outcome (same day):** the founder chose **B. Fireside Dusk**, for **Delhi weekenders and international guests**. The mock is built in `site/`. The rest of this document is the research behind that choice.

## How this was done, and its limits

- Opened about 30 live sites in a headless browser, took screenshots, and read each site's fonts, colours and navigation from the page itself. I looked at screenshots for most of them. For The Hosteller I only have the page data.
- Searched for design-press coverage. It was thin: no "best designed" lists for Indian hospitality, and few case studies. Where a source only repeats agency marketing, it is not counted as evidence.
- Sampled colours from public-domain Pahari paintings in the Met's Open Access collection (CC0): objects 72545, 64535, 37955, 74668, 37947, 37945.
- Not loaded or blocked: Ama Stays, Ecosphere Spiti, Sujan, Trek The Himalayas, and Shakti Himalaya (its Squarespace site has expired). Hero videos did not play on Ladakh Sarai and Aman, so I saw their frames, not their motion.
- Screenshots are kept out of the repo (the repo is public and they are other people's work). Open the live links below to see them.

## What the sites look like

| Site | Family | Type | Colour | Worth noting |
|---|---|---|---|---|
| [Ananda in the Himalayas](https://www.anandaspa.com) | Luxury spa | Cormorant Garamond + Montserrat | Cream #F5F3EF, bronze text | Palace at dusk under a dark overlay, booking panel on the right |
| [Atmantan](https://www.atmantan.com) | Luxury spa | Philosopher, Playfair, Sofia Pro | Black, gold #C7AE6E, teal band | Award laurels, festive-offer popup. Navigation by health condition |
| [Six Senses Vana](https://www.sixsenses.com/en/resorts/vana) | Luxury spa | Canto Roman + Avenir Next | Black, plum | A near-empty black screen with a centred serif name (I saw it before the video hero played) |
| [Shreyas Retreat](https://www.shreyasretreat.com) | Wellness | Jazmin + Palanquin | Cream #FAF5ED, sage #92946D | Gentlest of the group. Booking bar over the hero |
| [Neemrana](https://www.neemranahotels.com), [CGH Earth](https://www.cghearth.com) | Heritage hotels | Droid Sans; ITC Kabel + Caslon | Dark brown and bronze | Booking bar, crest logos, promotional popups |
| [Ladakh Sarai Trails](https://www.ladakhsarai.com) | Himalayan stay | Instrument Serif + Inter | Black and white, olive #64793A, cream #EDECE1 | Condensed serif name on a full-screen video. Very restrained |
| [Banjara Camps](https://www.banjaracamps.com) | Himalayan lodges | Source Sans Pro | White, green, yellow | Dated. One big lodge photo, search box, plain nav |
| [Indiahikes](https://indiahikes.com) | Trek brand | Franklin Gothic + Lora | Yellow nav, cream | Information first: a one-page Trek Index to download, a section on what safety means to them, 100+ trekker letters |
| [Zostel](https://www.zostel.com), [The Hosteller](https://www.thehosteller.com) | Hostels | Rubik + Kalam; Poppins | Red-orange; black and #FFE700 | Playful. Zostel uses a handwriting face for its tagline and a scalloped hero edge |
| [Raw Mango](https://www.rawmango.com) | Craft label | D-DIN | Deep green #084D2D | Tiny Devanagari wordmark (रॉ मैंगो) in the header. Hero is a model against real painted murals |
| [Nicobar](https://www.nicobar.com) | Craft / home | Euclid Flex + New Paris Text | Ink violet, dark teal, gold | Painterly backdrops, thin gold frames with small botanical glyphs |
| [Anokhi](https://www.anokhi.com) | Block-print label | Open Sans | Terracotta #B24C3D | Wordmark in hand-cut block-print letters. Artisan photo, uncropped and unpolished |
| [Okhai](https://www.okhai.org) | Craft label | Lusitana + Avenir | Saffron banner, watercolour sky | Hand-drawn icons for women empowerment, heirloom crafts, circular fashion |
| [Ahilya Fort](https://www.ahilyafort.com) | Heritage hotel | A heavy display serif + Enriqueta | Crimson, gold, cream | Ornamental separators in the nav, antique brass figures cut out on white |
| [Tribes India](https://www.tribesindia.com) | Government craft | Nanum Gothic | Brown, cream | Hero is a collage of woven textile tiles |
| [Aman](https://www.aman.com/resorts/amanbagh), [Kamalaya](https://www.kamalaya.com), [Isha](https://isha.sadhguru.org) | Reference only | Lyon; Brandon Grotesque; Fedra Serif | Neutral; maroon and gold; taupe | Aman is whisper-quiet. Kamalaya is a Thai lotus and gold lockup |

## Patterns

1. **The spa-luxury default.** Dark photo overlay, thin serif, gold, booking bar, promotional popup. Ananda, Atmantan, Neemrana, CGH Earth and Six Senses all look alike. A small, craft-and-community place has nothing to gain by joining them.
2. **Craft brands own one Indian source and let it speak.** Raw Mango uses real murals. Anokhi uses block-print lettering. Okhai uses hand-drawn icons. Nicobar uses painterly backdrops and tiny botanical ornaments. They reference the art through photography, lettering and small marks. None of them imitates it with heavy UI effects.
3. **Information builds trust.** Indiahikes wins on usefulness: a trek index, a plain statement of what safety means to them, real trekker letters. This suits a stay that offers programmes and asks people to book.
4. **Restraint reads as premium, but needs great photography.** Six Senses, Aman and Ladakh Sarai show almost nothing. That works only with excellent images. The v1 placeholder crops would not carry it.
5. **Devanagari is nearly absent from the interface.** Raw Mango's tiny wordmark is the only confident use among these sites. Atmantan has a little on the page. Pairing Devanagari with English is a real chance to stand apart.
6. **Handwriting appears as seasoning.** Zostel uses Kalam for a tagline, Ananda a script for "Buy the Book". It reads as a warm human note when used once or twice.

## Himachal's own visual vocabulary

- **Pahari painting (Kangra, Guler, Chamba).** The paintings I looked at use large flat fields of colour on cream paper, thin ruled borders, tiny detail inside. Sources describe Kangra as softer (greens, blues, pinks, saffron) and Guler and Chamba as stronger blue, red and yellow. Approximate colours sampled from the Met images: cream paper #EEE6D7, vermilion #D0594E, mustard #D39347, ochre #A57D3E, brick #954937, sage #949E7C, sky #91B7C7, ink slate #384443.
- **Kath-Kuni architecture.** Alternating courses of wood and stone, heavy carved doors and balconies. The earlier stripe motif came from this. The texture is in the stonework and timber grain more than in any fixed colour. Sources I found do not name Tirthan-specific motifs or paint colours, so any claim of local accuracy needs a site visit.
- **Textiles.** Kullu shawls use geometric borders (diamonds, triangles) on grey, brown or off-white. Kinnauri shawls use white, black, grey and brown grounds with red, orange, pink, blue, green and yellow patterning. Chamba rumal is fine silk embroidery with lotus, peacock, deer and fish motifs.
- **Folk painting from elsewhere.** Gond and Madhubani are bold and dense but belong to Madhya Pradesh and Bihar. Using them for a Himachal place would be borrowed, not local.

## Devanagari rules to carry forward

From the [Alphabettes guide](https://www.alphabettes.org/devanagari-typography-101-a-guide-for-typesetting-with-latin/):
- Same point size as sentence-case Latin. With all-caps Latin, make the Devanagari larger and shift its baseline, or the pair looks heavy.
- More leading for Devanagari than for Latin, set by hand.
- Match stroke contrast and weight across the two scripts. Avoid decorative serifs in Devanagari.
- Left-aligned, ragged-right for long text. No hyphenation. Tracking can break the headline line, so use it sparingly.
- Never fake an italic.

Fonts that the research confirmed pair both scripts: Hind (Devanagari about 94% of Latin cap height), Rozha One (display, very high contrast), Karma and Sumana (serif, built for screen), Rhodium Libre (small sizes). Check availability on Google Fonts before choosing.

## Directions to discuss

**A. Pahari Page.** Cream paper ground, flat colour blocks in vermilion, mustard, sage and sky, thin double-rule borders like a miniature's frame. A warm serif with matched Devanagari. Illustrated hero of the stay, the fire and the pines. Strongest sense of place. Needs an illustrator and care to avoid folk-art cliché.

**B. Fireside Dusk.** Built from the founder's campfire photo: forest-black green, ember orange, smoke, warm cream, film grain. Photography-led and moody. Feels right for sound healing in the evening. Closest to the spa default unless the photography is very good.

**C. Craft Table.** Clay terracotta, unbleached hemp, charcoal, pine. Hand-drawn icons, a block-print or hand-cut wordmark, Kalam notes, close-ups of hands working. Matches the workshops, community and café side, and is the least like a spa. Relies on real workshop photos.

**D. Quiet Hall.** White space, one serif, almost no ornament. Silence as the sound-healing brand. Premium and calm, but generic, and only works with excellent photography.

**E. Sandhya, softened.** Keep the purple and ember palette (sandhya means twilight) but replace the outlines and hard shadows with twilight gradients and soft edges. The cheapest change from where we are. Keep only if the palette was not the problem.

**Lean:** C as the base, borrowing A's Pahari palette and ruled borders for frames, and B's dark dusk panels for the evening, sound and fire moments. It stays calm, owns Himachal and the craft, and doesn't resemble the luxury-spa sites.

## Questions for the founder

1. What felt wrong about Brutalism: too loud for wellness, the colours, the type, or the heaviness?
2. Which of the sites above do you personally like, and which do you not?
3. Who is the main visitor: Delhi and Mumbai weekenders, international guests, long-stay workers, or local families?
4. Is real photography coming, and of what (rooms, workshops, food, people)?
5. Is a commissioned illustration or a hand-lettered wordmark in budget?
