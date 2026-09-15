const { Card, Badge, SegmentedControl, IconButton, ScreenHeader, ProgressDial, DotNumber, Legend, Icon } = window.LGrowDesignSystem_af8774;

const STAGES = [
  { label: "REM", color: "var(--sleep-rem)" },
  { label: "Deep", color: "var(--sleep-deep)" },
  { label: "Core", color: "var(--sleep-core)" },
  { label: "Awake", color: "var(--sleep-awake)" },
  { label: "In bed", color: "var(--sleep-inbed)" },
  { label: "Asleep", color: "var(--sleep-asleep)" },
];

function MonthChart() {
  const bars = React.useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const seed = (i * 37) % 11;
    return [3 + seed % 4, 2 + (seed * 2) % 5, 2 + (seed * 3) % 4, 1 + seed % 3];
  }), []);
  return (
    <Card radius="var(--radius-lg)" pad="var(--pad-card)">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-tertiary)" }}>Month chart</div>
          <div style={{ fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>September</div>
        </div>
        <div style={{ maxWidth: 176 }}><Legend items={STAGES} /></div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 9, color: "var(--text-tertiary)", height: 104 }}>
          <span>9h</span><span>6h</span><span>3h</span><span>0</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, height: 104 }}>
          {bars.map((stack, i) => (
            <span key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 1 }}>
              {stack.map((h, j) => <span key={j} style={{ height: h * 4, borderRadius: 2, background: STAGES[j].color }} />)}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-tertiary)", marginTop: 6, paddingLeft: 26 }}>
        {[1, 5, 10, 15, 20, 25, 30].map((d) => <span key={d}>{d}</span>)}
      </div>
    </Card>
  );
}

function SleepScreen({ onBack }) {
  const [range, setRange] = React.useState("Monthly");
  return (
    <Screen>
      <ScreenHeader title="Sleep" onBack={onBack} right={<IconButton icon="info" />} />
      <div style={{ margin: "6px 0 14px" }}>
        <SegmentedControl variant="underline" options={["Daily", "Weekly", "Monthly", "Yearly"]} value={range} onChange={setRange} style={{ justifyContent: "space-between" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10 }}>
        <Icon name="chevron-left" size={14} color="var(--text-secondary)" />
        <Badge>Sep 1 - Sep 30</Badge>
        <Icon name="chevron-right" size={14} color="var(--text-secondary)" />
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <ProgressDial size={196} thickness={14} value={38} sweep={220} color="var(--sleep-asleep)">
          <DotNumber value="38" size="lg" color="var(--sleep-rem)" />
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>Monthly Average Score</div>
        </ProgressDial>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "var(--fs-caption)", color: "var(--text-secondary)", margin: "2px 0 14px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="moon" size={12} />11:16 PM</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="sun" size={12} />6:48 AM</span>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 26, fontWeight: "var(--fw-semibold)" }}>6 <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>HRS</span> 32 <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>MIN</span></div>
        <div style={{ fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-tertiary)", marginTop: 2 }}>Daily asleep average ›</div>
        <h2 style={{ margin: "14px 0 6px", fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>Dream Longer, Live Stronger</h2>
        <p style={{ margin: "0 0 16px", fontSize: "var(--fs-caption)", color: "var(--text-secondary)", lineHeight: "var(--lh-normal)" }}>
          Your body and mind need time to recover, just like charging your phone. With 5h32m, you're running on low battery. Try giving yourself 7–9 hours tonight — more dreams, better mood, stronger you tomorrow!
        </p>
      </div>
      <MonthChart />
      <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "12px 0" }}>
        <SegmentedControl options={["Sleep duration", "Sleep time"]} />
      </div>
      <h2 style={{ margin: "6px 0 10px", fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>Added Data For The Month</h2>
      <Card radius="var(--radius-lg)">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-tertiary)" }}>Avg asleep</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 6px" }}>
              <span style={{ fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>8h 30min</span>
              <Badge>10:30 PM - 7:15 AM</Badge>
            </div>
            <div style={{ display: "flex", gap: 6 }}><Badge>Dec 11 - Dec 17</Badge><Badge>From APPLE HEALTH</Badge></div>
          </div>
          <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
        </div>
        <div style={{ height: 1, background: "var(--line-hairline)", margin: "12px 0" }} />
        <button style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: "var(--fs-body-sm)", cursor: "pointer", padding: 0 }}>
          <Icon name="plus" size={14} color="var(--blue-300)" />Add Data
        </button>
      </Card>
    </Screen>
  );
}

Object.assign(window, { SleepScreen });
