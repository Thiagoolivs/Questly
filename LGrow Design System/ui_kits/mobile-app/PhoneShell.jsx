const { Icon, TabBar } = window.LGrowDesignSystem_af8774;

function StatusBar({ light }) {
  const c = light ? "var(--text-on-light)" : "var(--text-primary)";
  return (
    <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", flex: "none", position: "relative", zIndex: 3 }}>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600, color: c }}>9:41</span>
      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Icon name="signal" size={14} color={c} /><Icon name="wifi" size={14} color={c} /><Icon name="battery-full" size={18} color={c} />
      </span>
    </div>
  );
}

function PhoneShell({ children, tab, onTab, showTabs = true, scroll = true, background = "var(--surface-page)" }) {
  return (
    <div style={{ width: 390, height: 844, borderRadius: 46, background, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-sheet)", border: "1px solid rgba(255,255,255,.10)" }}>
      <StatusBar />
      <div style={{ flex: 1, minHeight: 0, overflowY: scroll ? "auto" : "hidden", overflowX: "hidden", position: "relative", scrollbarWidth: "none" }}>
        {children}
        {showTabs ? <div style={{ height: 96 }} /> : null}
      </div>
      {showTabs ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, display: "flex", justifyContent: "center", zIndex: 5 }}>
          <TabBar active={tab} onChange={onTab} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 8, width: 134, height: 5, borderRadius: 3, background: "rgba(255,255,255,.85)", zIndex: 6 }} />
    </div>
  );
}

function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 10px" }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-ui)", fontSize: "var(--fs-title-3)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-title)" }}>{children}</h2>
      {action ? <button onClick={onAction} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Icon name="chevron-right" size={18} color="var(--text-secondary)" /></button> : null}
    </div>
  );
}

const Screen = ({ children, pad = "var(--gutter-screen)" }) => (
  <div style={{ padding: "0 " + pad }}>{children}</div>
);

Object.assign(window, { PhoneShell, StatusBar, SectionTitle, Screen });
