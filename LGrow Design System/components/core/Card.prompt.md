One-line: the app's container surface — #121212 with a 1px white-8% hairline, 20px radius.

```jsx
<Card><MetricRow icon="footprints" value="8,125" label="STEPS" /></Card>
<Card tone="bloom" pad="var(--pad-card-lg)">…daily progress…</Card>
```

- Cards never carry drop shadows on-canvas; separation comes from the hairline border.
- `tone="bloom"` is the hero data card treatment (Daily Process, "You Beat Your Limit!").
