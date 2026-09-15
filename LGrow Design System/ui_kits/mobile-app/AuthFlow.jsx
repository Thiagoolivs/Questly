const { Button, Input, Select, OtpInput, Badge, IconButton, Icon, ProgressDial } = window.LGrowDesignSystem_af8774;

function OnboardingScreen({ onNext }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "url(../../assets/img/athlete-dumbbell.png) center/cover" }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--scrim-bottom)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 56, padding: "0 var(--gutter-screen)", textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)", marginBottom: 6 }}>Personal Fitness Coach</div>
        <h1 style={{ margin: "0 0 10px", fontSize: 28, fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-display)", lineHeight: "var(--lh-snug)" }}>Every Day Is Better<br />Than Yesterday</h1>
        <p style={{ margin: "0 0 20px", fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)" }}>Push Yourself Harder to Become Better</p>
        <div onClick={onNext} style={{ display: "flex", alignItems: "center", background: "var(--surface-glass)", border: "1px solid rgba(255,255,255,.18)", backdropFilter: "var(--blur-glass)", borderRadius: "var(--radius-md)", padding: 4, cursor: "pointer" }}>
          <span style={{ width: 44, height: 40, borderRadius: 8, background: "var(--surface-inverse)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="chevrons-right" size={18} color="var(--text-on-light)" />
          </span>
          <span style={{ flex: 1, textAlign: "center", fontSize: "var(--fs-body)", fontWeight: "var(--fw-medium)" }}>Workout Now</span>
          <span style={{ width: 44, height: 40, borderRadius: 8, background: "rgba(255,255,255,.16)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="chevrons-right" size={18} />
          </span>
        </div>
      </div>
    </div>
  );
}

const SOCIALS = [["Google", "chrome"], ["Facebook", "facebook"], ["Apple", "apple"]];

function LoginScreen({ onNext }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--bg-cone-down)", opacity: .9 }} />
      <div style={{ position: "absolute", inset: 0, background: "var(--bg-cone-up)", opacity: .9 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, padding: "0 var(--gutter-screen)", textAlign: "center" }}>
        <Badge>Join with us</Badge>
        <h1 style={{ margin: "12px 0 6px", fontSize: "var(--fs-display)", fontWeight: "var(--fw-semibold)", letterSpacing: "var(--ls-display)", lineHeight: "var(--lh-snug)" }}>Welcome to<br />Our Zone</h1>
        <p style={{ margin: "0 0 22px", fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)" }}>Push Yourself Harder to Become Better</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <Select width={86} defaultValue="+32" options={["+32", "+1", "+84"]} />
          <Input placeholder="Enter your phone number" style={{ flex: 1 }} />
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>Login Now</Button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <span style={{ flex: 1, height: 1, background: "var(--line-hairline)" }} />
          <span style={{ fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-medium)" }}>Or With</span>
          <span style={{ flex: 1, height: 1, background: "var(--line-hairline)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 34 }}>
          {SOCIALS.map(([label, icon]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ width: 42, height: 42, borderRadius: "var(--radius-pill)", background: "var(--surface-inverse)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={icon} size={20} color="var(--text-on-light)" />
              </span>
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"]];

function OtpScreen({ onNext, onClose }) {
  const [code, setCode] = React.useState("860");
  const press = (d) => setCode((c) => (c + d).slice(0, 6));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--bg-cone-down)", opacity: .75 }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(12,12,12,.72)" }} />
      <div style={{ position: "absolute", inset: 0, padding: "0 var(--gutter-screen)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8 }}><IconButton icon="x" onClick={onClose} /></div>
        <div style={{ textAlign: "center", marginTop: 6 }}>
          <Badge>OTP Check</Badge>
          <h1 style={{ margin: "12px 0 8px", fontSize: "var(--fs-title-1)", fontWeight: "var(--fw-semibold)" }}>Check Your Phone Number</h1>
          <p style={{ margin: "0 0 18px", fontSize: "var(--fs-caption)", color: "var(--text-secondary)", lineHeight: "var(--lh-normal)" }}>
            Please enter the 6-digit verification code that was sent to (+964) 123 456 789 to reset your password.<br />The code is valid for 30 minutes.
          </p>
          <OtpInput value={code} />
          <div style={{ margin: "18px 0 12px", fontSize: "var(--fs-body-sm)", color: "var(--text-tertiary)" }}>Resend Code (60s)</div>
          <Button variant="primary" size="lg" fullWidth onClick={onNext}>Confirm</Button>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 20 }}>
            {KEYS.map(([d, sub]) => (
              <button key={d} onClick={() => press(d)} style={{ height: 42, borderRadius: "var(--radius-sm)", background: "var(--surface-input)", border: "none", color: "var(--text-primary)", cursor: "pointer", fontFamily: "var(--font-ui)" }}>
                <div style={{ fontSize: 19, fontWeight: 500, lineHeight: 1 }}>{d}</div>
                <div style={{ fontSize: 8, letterSpacing: ".1em", color: "var(--text-tertiary)" }}>{sub}</div>
              </button>
            ))}
            <span />
            <button onClick={() => press("0")} style={{ height: 42, borderRadius: "var(--radius-sm)", background: "var(--surface-input)", border: "none", color: "var(--text-primary)", fontSize: 19, cursor: "pointer", fontFamily: "var(--font-ui)" }}>0</button>
            <button onClick={() => setCode((c) => c.slice(0, -1))} style={{ height: 42, borderRadius: "var(--radius-sm)", background: "transparent", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="delete" size={20} color="var(--text-secondary)" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BasicInfoScreen({ onNext }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 260, background: "var(--bg-cone-up)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: "var(--surface-input)" }}>
        <div style={{ width: "42%", height: "100%", background: "var(--blue-glow)" }} />
      </div>
      <div style={{ position: "relative", padding: "34px var(--gutter-screen) 0", textAlign: "center" }}>
        <Badge>Basic Information</Badge>
        <h1 style={{ margin: "12px 0 20px", fontSize: "var(--fs-title-1)", fontWeight: "var(--fw-semibold)", lineHeight: "var(--lh-snug)" }}>We need a few details from you.</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
          <Input label="Full name" required placeholder="e.g, Ahmad Bergson" />
          <Input label="Email" placeholder="Enter your email" />
          <Input label="Date of Birth" required placeholder="Select date" icon="calendar" />
          <div style={{ display: "flex", gap: 12 }}>
            <Input label="Height" required placeholder="0.00" unit="cm" style={{ flex: 1 }} />
            <Input label="Weight" required placeholder="0.00" unit="kg" style={{ flex: 1 }} />
          </div>
          <Button variant="primary" size="lg" fullWidth onClick={onNext} style={{ marginTop: 6 }}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}

function ConnectDeviceScreen({ onNext }) {
  const [sel, setSel] = React.useState("watch");
  return (
    <div style={{ position: "absolute", inset: 0, padding: "10px var(--gutter-screen)" }}>
      <div style={{ background: "var(--surface-page)", borderRadius: "var(--radius-2xl)", border: "var(--border-card)", padding: "18px 16px", textAlign: "center" }}>
        <Badge>Connect Device</Badge>
        <h1 style={{ margin: "12px 0 8px", fontSize: "var(--fs-title-1)", fontWeight: "var(--fw-regular)" }}>Connected for Control</h1>
        <p style={{ margin: "0 0 18px", fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)", lineHeight: "var(--lh-normal)" }}>
          Select your device to connect with us.<br />Your data will then be synchronized and kept as accurate and up to date as possible.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          {[["watch", "Watch", "watch"], ["ring", "Ring", "circle"]].map(([id, label, icon]) => (
            <div key={id} onClick={() => setSel(id)} style={{ flex: 1, height: 176, borderRadius: "var(--radius-lg)", background: "var(--surface-raised)", border: sel === id ? "1px solid var(--blue-glow)" : "var(--border-card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, cursor: "pointer" }}>
              <Icon name={icon} size={54} color="var(--text-secondary)" />
              <Badge caps>{label}</Badge>
            </div>
          ))}
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={onNext} style={{ marginTop: 16 }}>Confirm</Button>
      </div>
      <div style={{ marginTop: 18, background: "var(--surface-page)", border: "var(--border-card)", borderRadius: "var(--radius-2xl)", padding: 20, textAlign: "center" }}>
        <h2 style={{ margin: "0 0 14px", fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-regular)" }}>Connecting...</h2>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <ProgressDial size={150} thickness={5} value={62} sweep={320}><Icon name="watch" size={64} color="var(--text-secondary)" /></ProgressDial>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: "var(--fs-caption)", color: "var(--text-secondary)" }}>Connecting to your device.<br />Please make sure Bluetooth is enabled on your phone.</p>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingScreen, LoginScreen, OtpScreen, BasicInfoScreen, ConnectDeviceScreen });
