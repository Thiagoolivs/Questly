One-line: the app's primary navigation — a floating glass capsule of four round icon buttons (Home, Coaching, Chats, Profile).

```jsx
<TabBar active="home" onChange={setTab} />
```

- Floats above content with 16px side margins, never pinned edge-to-edge.
- Only the active tab is white; icons are never accompanied by labels.
