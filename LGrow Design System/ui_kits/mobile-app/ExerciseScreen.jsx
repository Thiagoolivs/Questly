const { Card, Badge, Button, IconButton, ScreenHeader, ProgressDial, DotNumber, Icon } = window.LGrowDesignSystem_af8774;

function ExerciseScreen({ onBack }) {
  const [running, setRunning] = React.useState(true);
  const [sec, setSec] = React.useState(22.5);
  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec((s) => (s <= 0.5 ? 30 : +(s - 0.5).toFixed(1))), 500);
    return () => clearInterval(t);
  }, [running]);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "url(../../assets/img/battle-rope.png) center/cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "var(--scrim-top)" }} />
      <div style={{ position: "relative", padding: "0 var(--gutter-screen)" }}>
        <ScreenHeader title="Battle Rope Exercise" onBack={onBack} right={<IconButton icon="activity" tone="glass" />} />
      </div>
      <Card tone="glass" radius="var(--radius-2xl)" pad="var(--pad-card-lg)" style={{ position: "absolute", left: 16, right: 16, bottom: 26, textAlign: "center" }}>
        <div style={{ fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-secondary)" }}>Time count</div>
        <div style={{ fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-semibold)", margin: "2px 0 6px" }}>3 min 20 sec</div>
        <Badge>Round 2</Badge>
        <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 4px" }}>
          <ProgressDial size={172} thickness={10} value={(30 - sec) / 30 * 100} sweep={300}>
            <DotNumber value={sec.toFixed(1)} size="lg" unit="sec" />
          </ProgressDial>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--fs-caption)", color: "var(--text-secondary)", margin: "4px 0 14px" }}>
          <span>Round 1</span>
          <span style={{ flex: 1, display: "flex", gap: 2 }}>
            {Array.from({ length: 22 }).map((_, i) => <span key={i} style={{ flex: 1, height: 9, borderRadius: 1, background: i < 13 ? "var(--blue-glow)" : "rgba(255,255,255,.14)" }} />)}
          </span>
          <span>Round 5</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" style={{ flex: 1 }} onClick={onBack}>Complete</Button>
          <Button variant="secondary" style={{ flex: 1 }} iconLeft={running ? "pause" : "play"} onClick={() => setRunning(!running)}>{running ? "Pause" : "Resume"}</Button>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { ExerciseScreen });
