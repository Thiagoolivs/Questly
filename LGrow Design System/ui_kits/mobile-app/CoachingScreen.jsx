const { Card, Badge, Chip, SegmentedControl, IconButton, Icon, DotNumber } = window.LGrowDesignSystem_af8774;

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = ["6 AM","10 AM","2 PM","6 PM","10 PM"];
const HEAT = [
  [1,2,0,2,2,0,0],
  [0,1,0,0,1,0,0],
  [0,1,0,1,2,0,0],
  [0,0,0,0,2,0,0],
  [1,0,1,0,0,0,2],
];
const HEAT_BG = ["var(--surface-input)","var(--blue-300)","var(--blue-glow)"];

function ActivityCalendar() {
  return (
    <Card tone="bloom" radius="var(--radius-2xl)" pad="var(--pad-card-lg)">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconButton icon="calendar" size={34} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-secondary)" }}>Wednesday</div>
            <div style={{ fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-semibold)" }}>May 13, 2026</div>
          </div>
        </div>
        <IconButton icon="plus" size={34} />
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "34px repeat(7,1fr)", gap: 4, alignItems: "center" }}>
            <span />
            {DAYS.map((d) => <span key={d} style={{ fontSize: 9, color: "var(--text-secondary)", textAlign: "center" }}>{d}</span>)}
            {HEAT.map((row, r) => (
              <React.Fragment key={r}>
                <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>{HOURS[r]}</span>
                {row.map((v, c) => <span key={c} style={{ height: 16, borderRadius: 3, background: HEAT_BG[v] }} />)}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={{ width: 92, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>Today</div>
            <div style={{ fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>6h 15m</div>
            <Badge tone="success">2.3% ↗</Badge>
          </div>
          <div>
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>This week</div>
            <div style={{ fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>34h 12m</div>
            <Badge tone="danger">10.1% ↘</Badge>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        {[["0–49%", HEAT_BG[0]], ["50–79%", HEAT_BG[1]], ["80–100%", HEAT_BG[2]]].map(([l, c]) => (
          <span key={l} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 20, borderRadius: 4, background: "rgba(255,255,255,.06)", fontSize: 9, color: "var(--text-primary)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
          </span>
        ))}
      </div>
    </Card>
  );
}

const EXERCISES = [
  ["Push-Ups", "20 Times x5", "../../assets/img/exercise-thumb-2.png"],
  ["Battle Rope", "3 min x5 rounds", "../../assets/img/battle-rope.png"],
  ["Dumbbell Curl", "12 Times x4", "../../assets/img/exercise-thumb-1.png"],
];

const MEALS = ["Breakfast", "Brunch", "Lunch", "Dinner", "Snack"];

function CoachingScreen({ onOpenExercise, onScan }) {
  const [tab, setTab] = React.useState("Exercises");
  const [meal, setMeal] = React.useState("Breakfast");
  return (
    <div>
      <div style={{ position: "relative", height: 132, background: "url(../../assets/img/battle-rope.png) center/cover", marginTop: -44 }}>
        <div style={{ position: "absolute", inset: 0, background: "var(--scrim-bottom)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 12, textAlign: "center" }}>
          <div style={{ fontSize: "var(--fs-micro)", textTransform: "uppercase", letterSpacing: "var(--ls-caps)", color: "var(--text-secondary)" }}>Couching</div>
          <div style={{ fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-semibold)" }}>Better Than Yesterday</div>
        </div>
      </div>
      <Screen>
        <div style={{ display: "flex", gap: 8, margin: "12px 0 14px" }}>
          {["Exercises", "Nutrition"].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, height: 34, borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-medium)", background: tab === t ? "var(--surface-inverse)" : "var(--surface-input)", color: tab === t ? "var(--text-on-light)" : "var(--text-secondary)" }}>{t}</button>
          ))}
        </div>
        {tab === "Exercises" ? (
          <React.Fragment>
            <ActivityCalendar />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0 10px" }}>
              <h2 style={{ margin: 0, fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>Today Exercises</h2>
              <Badge tone="light">[2/10]</Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-card)" }}>
              {EXERCISES.map(([title, meta, img]) => (
                <Card key={title} pad="0" radius="var(--radius-lg)" onClick={onOpenExercise} style={{ cursor: "pointer", display: "flex", alignItems: "stretch" }}>
                  <div style={{ flex: 1, padding: "14px 14px" }}>
                    <div style={{ fontSize: "var(--fs-body)", fontWeight: "var(--fw-semibold)" }}>{title}</div>
                    <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)", marginTop: 2 }}>{meta}</div>
                  </div>
                  <div style={{ width: 118, background: "url(" + img + ") center/cover" }} />
                </Card>
              ))}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Card tone="bloom" radius="var(--radius-2xl)" pad="var(--pad-card-lg)">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>What did you eat today?</div>
                <div style={{ fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-semibold)", margin: "2px 0 10px" }}>200 calories</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <IconButton icon="clock" size={34} />
                <span style={{ flex: 1, display: "flex", gap: 2 }}>
                  {Array.from({ length: 26 }).map((_, i) => <span key={i} style={{ flex: 1, height: 10, borderRadius: 1, background: i < 9 ? "var(--blue-glow)" : "rgba(255,255,255,.14)" }} />)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "var(--fs-body-sm)" }}><Icon name="cookie" size={16} />Mango Smoothie</span>
                <button onClick={onScan} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface-pill)", border: "none", borderRadius: "var(--radius-pill)", padding: "6px 12px", color: "var(--text-primary)", fontFamily: "var(--font-ui)", fontSize: "var(--fs-caption)", cursor: "pointer" }}>
                  <Icon name="scan" size={14} />Scan Your Dish
                </button>
              </div>
            </Card>
            <h2 style={{ margin: "18px 0 10px", fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>Today Recommends</h2>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
              {MEALS.map((m) => <Chip key={m} selected={meal === m} onClick={() => setMeal(m)}>{m}</Chip>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap-card)" }}>
              {[["Shrimp & Broccoli", "412 kcal"], ["Salmon Bowl", "530 kcal"]].map(([t, k]) => (
                <Card key={t} pad="0" radius="var(--radius-lg)">
                  <div style={{ height: 104, background: "url(../../assets/img/dish-noodles.png) center/cover" }} />
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-semibold)" }}>{t}</div>
                    <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>{k}</div>
                  </div>
                </Card>
              ))}
            </div>
          </React.Fragment>
        )}
      </Screen>
    </div>
  );
}

Object.assign(window, { CoachingScreen });
