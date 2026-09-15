const { Card, Badge, Chip, Avatar, IconButton, Icon, DotNumber, SegmentedControl, StackedBar, Legend } = window.LGrowDesignSystem_af8774;

const CATS = ["Gym", "Cadio", "Yoga", "Pilates", "Swim"];

function RouteCard() {
  return (
    <Card pad="0" radius="var(--radius-xl)" style={{ height: 172, background: "var(--surface-card)" }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--surface-card-alt)" }}>
        <svg viewBox="0 0 220 172" width="100%" height="100%">
          <g stroke="rgba(255,255,255,.07)" strokeWidth="1">
            {[18, 46, 74, 102, 130, 158].map((y) => <line key={y} x1="0" y1={y} x2="220" y2={y} />)}
            {[22, 58, 94, 130, 166, 202].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="172" />)}
          </g>
          <path d="M26 24 L26 66 L84 66 L84 104 L132 104 L132 140 L186 140" fill="none" stroke="var(--blue-glow)" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="26" cy="24" r="4" fill="var(--full-white)" />
          <circle cx="186" cy="140" r="5" fill="none" stroke="var(--full-white)" strokeWidth="2" />
        </svg>
      </div>
      <div style={{ position: "absolute", top: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface-inverse)", color: "var(--text-on-light)", borderRadius: "var(--radius-pill)", padding: "5px 10px", fontSize: "var(--fs-caption)", fontWeight: "var(--fw-medium)" }}>
        <span style={{ width: 7, height: 7, borderRadius: 9, background: "var(--blue-glow)" }} />Starting Point
      </div>
      <div style={{ position: "absolute", left: 96, top: 74 }}>
        <Avatar src="../../assets/img/avatar-tobi.png" size={34} ring />
      </div>
    </Card>
  );
}

function EtaCard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-card)" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <DotNumber value="32" unit="min" />
          <IconButton icon="info" size={22} tone="dark" />
        </div>
        <div style={{ marginTop: 6, fontSize: "var(--fs-body)", fontWeight: "var(--fw-medium)" }}>10:30 ETA · 3 Miles</div>
      </Card>
      <Card tone="bloom" style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-medium)", lineHeight: "var(--lh-snug)" }}>💪 You Beat<br />Your Limit! 🎉🎉</div>
      </Card>
    </div>
  );
}

function DailyProcessCard() {
  const [range, setRange] = React.useState("Today");
  const today = range === "Today";
  return (
    <Card tone="bloom" pad="var(--pad-card-lg)" radius="var(--radius-2xl)">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)" }}>
          <Icon name="loader-circle" size={16} />Daily Process
        </span>
        <SegmentedControl options={["Today", "Weekly"]} value={range} onChange={setRange} />
      </div>
      <div style={{ textAlign: "center", margin: "10px 0 6px" }}>
        <DotNumber value={today ? "93.2" : "81.4"} size="hero" unit="%" />
      </div>
      <StackedBar height={84} segments={[
        { value: today ? 26 : 30, color: "var(--data-calories)" },
        { value: 24, color: "var(--data-nutrition)" },
        { value: today ? 22 : 16, color: "var(--data-exercises)" },
        { value: 26, color: "var(--data-steps)" },
      ]} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-caption)", color: "var(--text-secondary)", margin: "6px 0 10px" }}><span>0</span><span>100%</span></div>
      <Legend items={[
        { label: "Calories Burned", color: "var(--data-calories)" },
        { label: "Nutrition", color: "var(--data-nutrition)" },
        { label: "Exercises", color: "var(--data-exercises)" },
        { label: "Steps", color: "var(--data-steps)" },
      ]} />
    </Card>
  );
}

function HomeScreen({ onOpenExercise }) {
  const [cat, setCat] = React.useState("Gym");
  return (
    <Screen>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 4 }}>
        <div>
          <div style={{ fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-tertiary)" }}>Wednesday / May 13, 2026</div>
          <h1 style={{ margin: "2px 0 0", fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-title)" }}>Ready to workout?</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconButton icon="bell" size={38} />
          <Avatar src="../../assets/img/avatar-tobi.png" size={38} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.28fr 1fr", gap: "var(--gap-card)", margin: "14px 0 var(--gap-card)" }}>
        <RouteCard />
        <EtaCard />
      </div>
      <DailyProcessCard />
      <div style={{ marginTop: 18 }}>
        <SectionTitle action onAction={onOpenExercise}>Discover New Exercises</SectionTitle>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
          {CATS.map((c) => <Chip key={c} selected={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-card)" }}>
          {[["../../assets/img/exercise-thumb-1.png", "Battle Rope", "12 min · Full body"], ["../../assets/img/exercise-thumb-2.png", "Dumbbell Curl", "8 min · Arms"]].map(([src, title, meta]) => (
            <Card key={title} pad="0" radius="var(--radius-lg)" onClick={onOpenExercise} style={{ cursor: "pointer" }}>
              <div style={{ height: 118, background: "url(" + src + ") center/cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "var(--scrim-bottom)" }} />
              <div style={{ position: "absolute", left: 10, right: 10, bottom: 9 }}>
                <div style={{ fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-semibold)" }}>{title}</div>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>{meta}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { HomeScreen });
