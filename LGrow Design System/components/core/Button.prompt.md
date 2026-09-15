One-line: the primary action control — use `variant="primary"` (full white) for the main CTA on any dark screen.

```jsx
<Button variant="primary" size="lg" fullWidth>Confirm</Button>
<Button variant="accent" size="sm" pill>GET</Button>
<Button variant="secondary" iconLeft="pause">Pause</Button>
```

- Screen-bottom CTAs are always `fullWidth` + `size="lg"` with `--radius-sm` (10px), not pills.
- `glass` is reserved for buttons sitting on photography or the blue cone background.
- Press feedback is a 0.97 scale; there is no hover lift (touch-first product).
