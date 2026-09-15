const { Card, Badge, Button, IconButton, Avatar, Icon, DotNumber, SegmentedControl, MetricRow, ListRow } = window.LGrowDesignSystem_af8774;

function StreakCard() {
  return (
    <Card radius="var(--radius-lg)" style={{ width: 96, textAlign: "center" }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-secondary)" }}>Streak days</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, margin: "4px 0" }}>
        <Icon name="wheat" size={20} color="var(--text-tertiary)" style={{ transform: "scaleX(-1)" }} />
        <DotNumber value="8" size="lg" />
        <Icon name="wheat" size={20} color="var(--text-tertiary)" />
      </div>
      <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>Workout Now</div>
    </Card>
  );
}

function SleepAlertCard({ onOpenSleep }) {
  return (
    <Card radius="var(--radius-lg)" style={{ flex: 1, background: "linear-gradient(150deg,#8E1330 0%,#E11D48 100%)", border: "1px solid transparent" }}>
      <DotNumber value="5" unit="hrs" />
      <DotNumber value="32" unit="min" style={{ marginLeft: 6 }} />
      <div style={{ fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-medium)", margin: "4px 0 8px", lineHeight: "var(--lh-snug)" }}>You didn't sleep well last night. 😴</div>
      <button onClick={onOpenSleep} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--surface-inverse)", color: "var(--text-on-light)", border: "none", borderRadius: "var(--radius-pill)", padding: "5px 10px", fontSize: "var(--fs-caption)", fontFamily: "var(--font-ui)", fontWeight: "var(--fw-medium)", cursor: "pointer" }}>
        What happens <Icon name="chevron-right" size={12} />
      </button>
    </Card>
  );
}

function ProfileScreen({ onOpenSleep }) {
  const [tab, setTab] = React.useState("Overview");
  const [range, setRange] = React.useState("Today");
  return (
    <div>
      <div style={{ position: "relative", height: 180, marginTop: -44, background: "url(../../assets/img/profile-cover.png) center/cover" }}>
        <div style={{ position: "absolute", inset: 0, background: "var(--scrim-bottom)" }} />
        <div style={{ position: "absolute", top: 52, right: 16 }}><IconButton icon="settings" tone="glass" /></div>
        <div style={{ position: "absolute", left: 16, bottom: -28 }}><Avatar src="../../assets/img/avatar-tobi.png" size={88} ring /></div>
      </div>
      <Screen>
        <div style={{ marginTop: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ margin: 0, fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-semibold)" }}>Tobi Bui</h1>
            <Badge tone="outline" caps>Health mode</Badge>
          </div>
          <div style={{ display: "flex", gap: 14, margin: "6px 0 8px", fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="map-pin" size={11} />HA NOI, VN</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="calendar" size={11} />18 SEPTEMBER, 2025</span>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)", lineHeight: "var(--lh-normal)" }}>
            I'm all about staying healthy 🌱 and on an exciting journey to sculpt a stronger, fitter me 💪✨
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--gap-card)" }}>
          <StreakCard />
          <SleepAlertCard onOpenSleep={onOpenSleep} />
        </div>
        <div style={{ margin: "16px 0 14px" }}>
          <SegmentedControl variant="underline" options={["Overview", "Metrics", "Achievements"]} value={tab} onChange={setTab} style={{ justifyContent: "space-between" }} />
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>Overall Stat</h2>
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-tertiary)" }}>Main stats of your body condition</div>
          </div>
          <SegmentedControl options={["Today", "7D", "30D"]} value={range} onChange={setRange} />
        </div>
        <div style={{ display: "flex", gap: "var(--gap-card)" }}>
          <Card pad="0" radius="var(--radius-lg)" style={{ width: 132, flex: "none" }}>
            <div style={{ height: "100%", minHeight: 196, background: "url(../../assets/img/body-scan-front.png) center/cover" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, textAlign: "center", fontSize: 9, color: "var(--text-secondary)" }}>Stats compared to yesterday</div>
          </Card>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            <MetricRow icon="scale" value="143.3" label="Weight (lbs)" delta="▲10" />
            <MetricRow icon="ruler" value="160" label="Height (cm)" />
            <MetricRow icon="droplet" value="8.5" label="Body fat (%)" />
            <MetricRow icon="activity" value="High" label="Stress level" valueColor="var(--danger)" />
          </div>
        </div>
        <div style={{ margin: "18px 0 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>Steps Tracking</h2>
          <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
        </div>
        <Card radius="var(--radius-lg)">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-tertiary)" }}>Total</div>
              <div style={{ fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>8,125</div>
            </div>
            <SegmentedControl options={["Today", "7D", "30D"]} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 78, marginTop: 12 }}>
            {Array.from({ length: 40 }).map((_, i) => {
              const h = [2,3,5,9,26,44,58,40,22,9,5,3,2,4,7,12,9,5,3,2,3,6,14,30,46,62,48,26,12,6,3,2,2,3,5,8,6,4,3,2][i];
              return <span key={i} style={{ flex: 1, height: h, borderRadius: 1, background: "linear-gradient(to top,var(--data-nutrition),var(--full-white))" }} />;
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-tertiary)", marginTop: 6 }}>
            {["12 AM","4 AM","8 AM","12 PM","4 PM","8 PM","12 AM"].map((t) => <span key={t}>{t}</span>)}
          </div>
        </Card>
        <h2 style={{ margin: "18px 0 4px", fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>Find Out More</h2>
        <ListRow icon="dumbbell" title="My Exercises" count={18} />
        <ListRow icon="image" title="Progress Photos" count={216} />
        <ListRow icon="notebook-pen" title="Notes" count={16} />
        <Button variant="secondary" fullWidth style={{ marginTop: 16, background: "var(--danger-bg)", color: "var(--danger)" }}>Log Out</Button>
      </Screen>
    </div>
  );
}

Object.assign(window, { ProfileScreen });
