const { Card, Button, IconButton, ScreenHeader, Badge } = window.LGrowDesignSystem_af8774;

function ScanScreen({ onBack }) {
  const [done, setDone] = React.useState(false);
  return (
    <Screen>
      <ScreenHeader back title="" onBack={onBack} right={<IconButton icon="zap" />} />
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <h1 style={{ margin: 0, fontSize: "var(--fs-title-1)", fontWeight: "var(--fw-regular)" }}>Scan Your Dish</h1>
        <p style={{ margin: "4px 0 16px", fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)" }}>Calculate the calories in a dish.</p>
      </div>
      <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", height: 286, background: "url(../../assets/img/dish-noodles.png) center/cover" }}>
        {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h]) => (
          <span key={v+h} style={{ position: "absolute", [v]: 10, [h]: 10, width: 26, height: 26, [v === "top" ? "borderTop" : "borderBottom"]: "2px dashed var(--full-white)", [h === "left" ? "borderLeft" : "borderRight"]: "2px dashed var(--full-white)" }} />
        ))}
      </div>
      <p style={{ margin: "14px 0 16px", textAlign: "center", fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)", lineHeight: "var(--lh-normal)" }}>
        Scan the dish from directly above,<br />approximately 30 cm above the dish, for the most accurate results.
      </p>
      {done ? (
        <Card radius="var(--radius-lg)" pad="var(--pad-card-lg)" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-semibold)", marginBottom: 6 }}>Ingredients:</div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: "var(--fs-caption)", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                <li>100g Brown Rice</li><li>1 head of broccoli</li><li>5 peeled shrimp</li><li>10g red bell peppers</li><li>1/2 carrot</li>
              </ul>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)" }}>814 calories</div>
              <Badge>Calories in Your Meal</Badge>
            </div>
          </div>
          <Button variant="primary" fullWidth style={{ marginTop: 14 }} onClick={onBack}>Confirm</Button>
        </Card>
      ) : (
        <Button variant="primary" size="lg" fullWidth onClick={() => setDone(true)}>Scan</Button>
      )}
    </Screen>
  );
}

Object.assign(window, { ScanScreen });
