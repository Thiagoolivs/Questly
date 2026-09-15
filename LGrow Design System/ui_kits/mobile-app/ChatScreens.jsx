const { Card, Avatar, Badge, SearchField, IconButton, Icon } = window.LGrowDesignSystem_af8774;

const CHATS = [
  { name: "Adam Brown", initials: "AB", color: "var(--blue-glow)", time: "Now", status: ["phone", "Voice call • In call", "var(--success)"] },
  { name: "Skylar Aminoff", initials: "", color: "var(--surface-input)", time: "Now", status: ["video", "Video call • In call", "var(--success)"] },
  { name: "Madelyn Septimus", initials: "MS", color: "var(--data-steps)", time: "09:38", status: ["check-check", "Please let me know your ideas so I can better", "var(--blue-300)"] },
  { name: "Lincoln Bator", initials: "LB", color: "var(--success)", time: "09:38", status: ["check-check", "Please let me know your ideas so I can better", "var(--blue-300)"] },
  { name: "Miracle George", initials: "MG", color: "var(--data-nutrition)", time: "Yesterday", status: ["check-check", "Please let me know your ideas so I can better", "var(--blue-300)"], dot: true },
  { name: "Davis Rosser", initials: "DR", color: "var(--success)", time: "09:18", status: ["check", "I already shared with them and waiting thier feedback will back to you today", "var(--text-tertiary)"] },
  { name: "Gustavo Siphron", initials: "GS", color: "var(--data-calories)", time: "09:12", status: [null, "typing...", "var(--text-tertiary)"] },
  { name: "Wilson Levin", initials: "WL", color: "var(--data-nutrition)", time: "08:20", status: ["mic", "Voice message • 34s", "var(--text-tertiary)"], unread: 1 },
];

function ChatsScreen({ onOpenThread }) {
  return (
    <Screen>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 2 }}>
        <h1 style={{ margin: 0, fontSize: "var(--fs-title-2)", fontWeight: "var(--fw-semibold)" }}>Chats</h1>
        <div style={{ display: "flex", gap: 8 }}><IconButton icon="plus" /><IconButton icon="ellipsis" /></div>
      </div>
      <div style={{ margin: "12px 0 4px" }}><SearchField /></div>
      <div>
        {CHATS.map((c) => (
          <div key={c.name} onClick={onOpenThread} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--line-hairline)", cursor: "pointer" }}>
            {c.initials ? <Avatar initials={c.initials} color={c.color} /> : <Avatar color="var(--surface-input)"><Icon name="user" size={16} /></Avatar>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-semibold)" }}>{c.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--fs-caption)", color: c.status[2], lineHeight: 1.35 }}>
                {c.status[0] ? <Icon name={c.status[0]} size={11} color={c.status[2]} /> : null}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{c.status[1]}</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flex: "none" }}>
              <div style={{ fontSize: 10, color: c.unread ? "var(--data-nutrition)" : "var(--text-tertiary)" }}>{c.time}</div>
              {c.unread ? <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: 9, background: "var(--blue-glow)", fontSize: 9, marginTop: 4 }}>{c.unread}</span> : null}
              {c.dot ? <span style={{ display: "block", width: 6, height: 6, borderRadius: 4, background: "var(--blue-300)", marginLeft: "auto", marginTop: 5 }} /> : null}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function ChatThreadScreen({ onBack }) {
  const [msgs, setMsgs] = React.useState([
    { me: false, text: "Have you run enough kilometers today? 🙋", time: "20:10" },
    { me: true, text: "I've run enough for today. I've completed my goal for the day. See you tomorrow!", time: "20:10" },
  ]);
  const [draft, setDraft] = React.useState("");
  const send = () => { if (!draft.trim()) return; setMsgs((m) => [...m, { me: true, text: draft, time: "20:12" }]); setDraft(""); };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 420, background: "var(--bg-cone-up)", opacity: .8 }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "4px var(--gutter-screen) 10px", borderBottom: "1px solid var(--line-hairline)" }}>
        <IconButton icon="chevron-left" onClick={onBack} />
        <Avatar initials="AB" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "var(--fs-body-sm)", fontWeight: "var(--fw-semibold)" }}>Adam Brown</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Last seen: yesterday at 16:40</div>
        </div>
        <IconButton icon="video" /><IconButton icon="phone" />
      </div>
      <div style={{ position: "relative", flex: 1, minHeight: 0, overflowY: "auto", padding: "12px var(--gutter-screen)" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}><Badge>Today</Badge></div>
        <Card radius="var(--radius-lg)" pad="12px" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--text-secondary)", lineHeight: "var(--lh-normal)" }}>
            <Icon name="lock" size={12} color="var(--text-secondary)" />
            <span>Messages, media, voice notes, calls, polls and reactions in this chat are end-to-end encrypted. Only the participants can read, listen to, or share them.</span>
          </div>
        </Card>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.me ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 6, marginBottom: 10 }}>
            {!m.me ? <Avatar initials="AB" size={22} /> : null}
            <div style={{ maxWidth: 232, padding: "9px 12px", borderRadius: m.me ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.me ? "var(--blue-100)" : "var(--surface-input)", color: m.me ? "var(--text-on-light)" : "var(--text-primary)", fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)" }}>
              {m.text}
              <div style={{ textAlign: "right", fontSize: 9, opacity: .6, marginTop: 3 }}>{m.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "10px var(--gutter-screen) 30px" }}>
        <IconButton icon="circle-plus" tone="bare" size={32} />
        <IconButton icon="image" tone="bare" size={32} />
        <span style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 12px", borderRadius: "var(--radius-pill)", background: "var(--surface-input)" }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Add a message" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-ui)", fontSize: "var(--fs-body-sm)", color: "var(--text-primary)" }} />
          <Icon name="smile" size={16} color="var(--text-tertiary)" />
        </span>
        <IconButton icon="mic" size={34} onClick={send} />
      </div>
    </div>
  );
}

Object.assign(window, { ChatsScreen, ChatThreadScreen });
