# LGrow — Design System

LGrow is a mobile fitness and health app: personal fitness goal management, health
tracking, and a direct connection with a "Master" (personal coach). The strapline
used throughout the source material is **"Your data. Your goals. Your growth."**

> "LGrow is an application that helps users build and maintain a healthy lifestyle
> through personal fitness goal management, health tracking, and direct connection
> with a Master."

The product is iOS-first (the source shows iPhone artboards at 390×844 with an
Android badge on the store card, so treat Android as a port of the same design).
There is no marketing website, dashboard, or slide template in the source material —
**the mobile app is the only product surface**, so this system ships one UI kit.

## Sources given

- 16 case-study images, uploaded to this project at
  `uploads/LGrow-Fitness-App-01.png` … `uploads/LGrow-Fitness-App-16.png`.
  These are flattened presentation boards (logo/type/colour specs, login flow,
  home, coaching, sleep, steps, profile, chat, AI food scanner, device pairing).
- Brief note from the requester: *"App fitness health, clean, agradável, visualmente
  atrativo, estético e com as melhores práticas de ui/ux, voltado para mobile."*
- No Figma file, repository, font binaries, or icon assets were provided.

**Open question for the requester:** the company field said **Questly** while every
asset in the upload is branded **LGrow**. This system is built as LGrow. Tell us if
Questly is the real brand and we will re-label (colour, type and layout would carry
over unchanged).

### Recreation caveat
Everything here was read from flattened case-study images — no code or Figma layer
data was available. Colour hexes, font names and copy are verbatim from the boards;
exact paddings, line-heights and radii were measured off the renders and are close
approximations, not extracted values. Values worth confirming against the source
file: card radii (20/24px), the login button radius (10px), and the tab bar height.

---

## Content fundamentals

**Voice.** Second person, present tense, encouraging but never shouty. The app talks
like a coach who has seen your data: *"Ready to workout?"*, *"You're never on this
journey alone"*, *"Every Day Is Better Than Yesterday"*, *"Push Yourself Harder to
Become Better"*, *"Dream Longer, Live Stronger"*.

**Casing.** Screen titles and section headers are sentence case
(*"Discover New Exercises"*, *"Today Exercises"*). Marketing headlines use title case
(*"Better Than Yesterday"*, *"Welcome to Our Zone"*). Metric labels, dates and
eyebrows are ALL CAPS with wide tracking (*WEDNESDAY / MAY 13, 2026*, *STREAK DAYS*,
*WEIGHT (LBS)*, *DAILY ASLEEP AVERAGE*). Case-study body paragraphs are set entirely
in caps — that is a presentation convention, not an in-app one.

**Person.** "You" and "your" in the interface; "users" only in case-study prose.
Never "we" except in onboarding invitations (*"We need a few details from you."*,
*"Welcome to Our Zone"*, *"Join with us"*).

**Explanations use analogy, not jargon.** The sleep card reads: *"Your body and mind
need time to recover, just like charging your phone. With 5h32m, you're running on
low battery. Try giving yourself 7–9 hours tonight — more dreams, better mood,
stronger you tomorrow!"* No clinical framing, no scolding.

**Emoji.** Yes, sparingly, and only inside conversational or celebratory copy:
*"💪 You Beat Your Limit! 🎉🎉"*, *"You didn't sleep well last night. 😴"*, a profile
bio with *"🌱"* and *"💪✨"*. Never as an icon, a bullet, or a status indicator.

**Numbers carry the message.** Headline numbers are set in a dot-matrix face and
given a tiny uppercase unit: `32 MIN`, `93.2%`, `22.5 Sec`, `8` streak days,
`8,125` steps. Deltas are signed and coloured: `2.3% ↗` green, `10.1% ↘` red.

**Placeholders are examples, not instructions:** *"e.g, Ahmad Bergson"*, *"0.00"*,
*"Enter your phone number"*, *"Add a message"*. Note the source's own typos
(*"Cadio"*, *"Couching"*) — corrected in this system's copy.

---

## Visual foundations

**Ground.** Pure black (#000000) pages with #121212 cards. This is a dark-only
product; there is no light theme in the source.

**One brand colour.** Blue Glow `#4B45F4` does every accent job: route lines,
progress arcs, focus borders, selected calendar cells, active pills, the app icon.
Everything else is neutral. White is the *action* colour — primary buttons, active
tabs and selected chips invert to full white with black text.

**The cone of light.** The signature motif is a spotlight cone of violet-blue blooming
in from the top or bottom edge of a screen or card (`--bg-cone-up`, `--bg-cone-down`,
`--bg-card-bloom`). It appears behind the login screen, inside the Daily Process card,
behind chat threads, and between case-study panels. Use it once per screen, at most.

**Type.** Inter for everything readable; **Doto** (dot-matrix) for numerals only.
Titles are 20–30px semibold with slightly negative tracking; body is 15px; labels
12px; eyebrows 10–11px uppercase at 0.08em. Line-height stays tight (1.08–1.22) on
headlines and 1.45 on paragraphs.

**Corner radii.** 10px buttons and OTP cells, 12px inputs, 16px inner cards and media
thumbs, 20px standard cards, 24px hero cards and sheets, 34px case-study panels,
full pill for chips, badges, avatars and tab-bar buttons.

**Cards.** #121212 fill, 1px `rgba(255,255,255,.08)` hairline, 20px radius, 14px
padding — and *no shadow*. Separation comes from hairlines, not elevation. Shadows
exist only for things that genuinely float: the tab bar, sheets, popovers.

**Transparency and blur.** Reserved for chrome over content: the floating tab bar,
buttons on photography, glass sheets (`#292929` at 72% + `blur(18px)`). Content
cards are opaque.

**Photography.** Cool, high-contrast gym imagery — hard rim light, desaturated
skin, black backgrounds, occasional blue spill. Food photography is the exception:
warm and saturated. All photos carry a bottom protection gradient
(`--scrim-bottom`) when text sits over them; text lives in the bottom third.

**Layout.** 16px screen gutters, 10px gaps between sibling cards, a 1.28:1 two-column
card grid on the home screen. The tab bar floats 22px above the bottom edge, inset by
the gutter, and never spans edge-to-edge. Status bar is always visible; detail screens
use a centred title with a circular back button.

**Motion.** Fast and flat: 90ms press, 160ms state, 240ms transitions, 420ms sheets
and arc fills. Easing is `cubic-bezier(.16,1,.3,1)` for sheets and dials, the standard
material curve for everything else. Press feedback is a 0.97 scale — no bounce, no
spring, no rotation. There are no hover states: this is a touch product. The only
ambient animation is a slow breathing glow on the blue cone (2.4s).

**Borders vs glows.** A focused input gets a 1px Blue Glow border, never a ring.
Avatars and paired devices get a glow ring (`--glow-ring`). Data arcs get round caps.

---

## Iconography

No icon assets shipped with the source (flattened images only), so the system uses
**[Lucide](https://lucide.dev) static SVGs from CDN** via the `Icon` component,
rendered as a CSS mask so glyphs inherit `color`. **This is a substitution** — Lucide's
thin, rounded, single-weight line style is the closest match to the icons drawn in the
boards. If you have the real icon set, drop it into `assets/icons/` and repoint
`components/core/Icon.jsx`.

Rules observed in the source: icons are always monochrome line glyphs at 16/20/24px,
white or silver, never filled and never two-tone. Tab-bar icons sit inside 44px
circles with no labels. Unicode arrows (`↗ ↘ ›`) are used inline in metric deltas and
"more" affordances. Emoji never stand in for icons.

Brand assets in `assets/`:
- `logomark-white.png` — the LGrow mark, extracted from the logo board (board 03).
- `app-icon.png` — the blue squircle app icon, extracted from board 05.
- `img/` — photography and body-scan renders cropped from the boards for kit use.
There is no wordmark lockup in the source; render "LGrow" in Inter semibold beside
the mark when one is needed.

---

## Index

| Path | What it is |
| --- | --- |
| `styles.css` | The one file consumers link — `@import`s every token file |
| `tokens/` | `fonts` `colors` `typography` `spacing` `radius` `effects` `motion` |
| `components/` | React primitives, grouped by concern (below) |
| `ui_kits/mobile-app/` | Interactive 13-screen recreation of the LGrow app |
| `guidelines/` | 20 foundation specimen cards (colour, type, spacing, brand) |
| `templates/app-screen/` | Blank 390×844 LGrow screen scaffold to start new work from |
| `assets/` | Logomark, app icon, extracted photography |
| `thumbnail.html` | Homepage tile |
| `SKILL.md` | Agent-Skill entry point |

### Components

`components/core/` — **Button**, **IconButton**, **Card**, **Badge**, **Chip**,
**Avatar**, **Icon**, **DotNumber**, **Legend**
`components/forms/` — **Input**, **Select**, **SearchField**, **OtpInput**
`components/navigation/` — **TabBar**, **SegmentedControl**, **ScreenHeader**
`components/data/` — **MetricRow**, **ListRow**, **ProgressDial**, **StackedBar**

Every component has a sibling `.d.ts` (props) and `.prompt.md` (what/when + example).

**Intentional additions.** The source defines screens, not a component library, so the
inventory above was derived from repeated on-screen patterns. Two entries are helpers
rather than observed components: **Icon** (a wrapper for the substituted glyph set)
and **DotNumber** (encapsulates the Doto numeral + unit pairing that appears on nearly
every screen). Components a design system "usually" ships but LGrow's screens never
show — Toast, Tooltip, Dialog, Switch, Checkbox, Radio, Accordion — are deliberately
absent.

### UI kit screens

Onboarding · Login · OTP check · Basic information · Connect device · Home ·
Exercise timer · Coaching (exercises + nutrition) · AI food scanner · Chats ·
Chat thread · Profile · Sleep tracking. See `ui_kits/mobile-app/README.md`.

## Fonts

Inter and Doto are both on Google Fonts and are loaded from there in
`tokens/fonts.css`. **No font binaries were supplied**, so nothing is self-hosted —
if LGrow licenses specific weights or a modified cut, send the files and we will
add `@font-face` rules and ship them.
