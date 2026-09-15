One-line: range and view switcher — capsule form inside cards, underline form for screen-level tabs.

```jsx
<SegmentedControl options={["Today","Weekly"]} value={range} onChange={setRange} />
<SegmentedControl variant="underline" options={["Overview","Metrics","Achievements"]} />
```

- Time ranges read Daily / Weekly / Monthly / Yearly, or Today / 7D / 30D on compact cards.
