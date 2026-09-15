/* @ds-bundle: {"format":4,"namespace":"LGrowDesignSystem_af8774","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"DotNumber","sourcePath":"components/core/DotNumber.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Legend","sourcePath":"components/core/Legend.jsx"},{"name":"ListRow","sourcePath":"components/data/ListRow.jsx"},{"name":"MetricRow","sourcePath":"components/data/MetricRow.jsx"},{"name":"ProgressDial","sourcePath":"components/data/ProgressDial.jsx"},{"name":"StackedBar","sourcePath":"components/data/StackedBar.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"OtpInput","sourcePath":"components/forms/OtpInput.jsx"},{"name":"SearchField","sourcePath":"components/forms/SearchField.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"ScreenHeader","sourcePath":"components/navigation/ScreenHeader.jsx"},{"name":"SegmentedControl","sourcePath":"components/navigation/SegmentedControl.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"972ce4dff80b","components/core/Badge.jsx":"fa3e52a29ff3","components/core/Button.jsx":"2ca30e460c6a","components/core/Card.jsx":"bd55b3439cd1","components/core/Chip.jsx":"33b4e7712cd2","components/core/DotNumber.jsx":"43ab51401e5e","components/core/Icon.jsx":"af9092c11eb5","components/core/IconButton.jsx":"035f5aaa3012","components/core/Legend.jsx":"f0553d22fce5","components/data/ListRow.jsx":"ed710a5c429a","components/data/MetricRow.jsx":"6b1d7b22adb6","components/data/ProgressDial.jsx":"428a5c41a52c","components/data/StackedBar.jsx":"5705fe9ccf88","components/forms/Input.jsx":"7b4d3978d243","components/forms/OtpInput.jsx":"a7e36025129a","components/forms/SearchField.jsx":"352895be4e50","components/forms/Select.jsx":"e7f17935727d","components/navigation/ScreenHeader.jsx":"6eea4f73b465","components/navigation/SegmentedControl.jsx":"25801801b59d","components/navigation/TabBar.jsx":"54f6ea034eba","ui_kits/mobile-app/AuthFlow.jsx":"5974a4d30015","ui_kits/mobile-app/ChatScreens.jsx":"8bac51b812e7","ui_kits/mobile-app/CoachingScreen.jsx":"583f1f442ed8","ui_kits/mobile-app/ExerciseScreen.jsx":"85eaa5a9f8a1","ui_kits/mobile-app/HomeScreen.jsx":"9b24b1e02d46","ui_kits/mobile-app/PhoneShell.jsx":"cd638fac8032","ui_kits/mobile-app/ProfileScreen.jsx":"618d60f0161f","ui_kits/mobile-app/ScanScreen.jsx":"d71c2778c380","ui_kits/mobile-app/SleepScreen.jsx":"65137fd97e4c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LGrowDesignSystem_af8774 = window.LGrowDesignSystem_af8774 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 88
};
function Avatar({
  src,
  initials,
  name,
  size = "md",
  color = "var(--blue-glow)",
  ring = false,
  children,
  style,
  ...rest
}) {
  const px = typeof size === "number" ? size : SIZES[size];
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      width: px,
      height: px,
      borderRadius: "var(--radius-pill)",
      flex: "none",
      overflow: "hidden",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: src ? "var(--surface-input)" : color,
      color: "var(--full-white)",
      fontFamily: "var(--font-ui)",
      fontSize: Math.max(10, Math.round(px * 0.36)),
      fontWeight: "var(--fw-semibold)",
      letterSpacing: ".02em",
      border: ring ? "3px solid var(--surface-page)" : undefined,
      boxShadow: ring ? "var(--glow-ring)" : undefined,
      ...style
    }
  }), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name || "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials || children);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    background: "var(--surface-pill)",
    color: "var(--text-primary)",
    border: "1px solid transparent"
  },
  outline: {
    background: "transparent",
    color: "var(--blue-300)",
    border: "1px solid var(--blue-400)"
  },
  accent: {
    background: "var(--blue-glow)",
    color: "var(--text-on-accent)",
    border: "1px solid transparent"
  },
  success: {
    background: "var(--success-bg)",
    color: "var(--success)",
    border: "1px solid transparent"
  },
  danger: {
    background: "var(--danger-bg)",
    color: "var(--danger)",
    border: "1px solid transparent"
  },
  light: {
    background: "var(--surface-inverse)",
    color: "var(--text-on-light)",
    border: "1px solid transparent"
  }
};
function Badge({
  children,
  tone = "neutral",
  caps = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({}, rest, {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      height: 22,
      padding: "0 9px",
      borderRadius: "var(--radius-pill)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-medium)",
      textTransform: caps ? "uppercase" : "none",
      letterSpacing: caps ? "var(--ls-caps)" : "var(--ls-body)",
      whiteSpace: "nowrap",
      ...TONES[tone],
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  card: {
    background: "var(--surface-card)",
    border: "var(--border-card)"
  },
  raised: {
    background: "var(--surface-raised)",
    border: "var(--border-card)"
  },
  glass: {
    background: "var(--surface-glass)",
    border: "1px solid rgba(255,255,255,.12)",
    backdropFilter: "var(--blur-glass)"
  },
  accent: {
    background: "var(--blue-glow)",
    border: "1px solid transparent"
  },
  bloom: {
    background: "var(--surface-card)",
    border: "var(--border-card)"
  },
  light: {
    background: "var(--surface-inverse)",
    border: "1px solid transparent",
    color: "var(--text-on-light)"
  }
};
function Card({
  children,
  tone = "card",
  radius = "var(--radius-xl)",
  pad = "var(--pad-card)",
  glow = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({}, rest, {
    style: {
      position: "relative",
      borderRadius: radius,
      padding: pad,
      overflow: "hidden",
      color: "var(--text-primary)",
      boxShadow: glow ? "var(--glow-soft)" : undefined,
      ...TONES[tone],
      ...style
    }
  }), tone === "bloom" ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--bg-card-bloom)",
      pointerEvents: "none"
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: "100%"
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Chip({
  children,
  selected = false,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: onClick
  }, rest, {
    style: {
      height: 28,
      padding: "0 12px",
      borderRadius: "var(--radius-pill)",
      cursor: "pointer",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-medium)",
      whiteSpace: "nowrap",
      flex: "none",
      background: selected ? "var(--surface-inverse)" : "var(--surface-chip)",
      color: selected ? "var(--text-on-light)" : "var(--text-secondary)",
      border: selected ? "1px solid transparent" : "1px solid var(--line-hairline)",
      transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard)",
      WebkitTapHighlightColor: "transparent",
      ...style
    }
  }), children);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/DotNumber.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function DotNumber({
  value,
  size = "md",
  unit,
  color = "var(--text-primary)",
  style,
  ...rest
}) {
  const fs = {
    sm: "var(--fs-num-sm)",
    md: "var(--fs-num-md)",
    lg: "var(--fs-num-lg)",
    hero: "var(--fs-num-hero)"
  }[size] || size;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "baseline",
      gap: "var(--space-3)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-numeric)",
      fontWeight: "var(--fw-numeric)",
      fontSize: fs,
      lineHeight: "var(--lh-tight)",
      color,
      letterSpacing: ".02em"
    }
  }, value), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-numeric)",
      fontWeight: "var(--fw-numeric)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-tertiary)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)"
    }
  }, unit) : null);
}
Object.assign(__ds_scope, { DotNumber });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/DotNumber.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const BASE = "https://unpkg.com/lucide-static@0.454.0/icons/";

/* Lucide (static SVG, CDN) stands in for LGrow's icon set — the source case
   study shipped no icon files. Rendered as a CSS mask so glyphs inherit colour. */
function Icon({
  name,
  size = 20,
  color = "currentColor",
  style,
  ...rest
}) {
  const url = BASE + name + ".svg";
  return /*#__PURE__*/React.createElement("span", _extends({
    "aria-hidden": "true"
  }, rest, {
    style: {
      display: "inline-block",
      width: size,
      height: size,
      flex: "none",
      background: color,
      WebkitMaskImage: "url(" + url + ")",
      maskImage: "url(" + url + ")",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
      ...style
    }
  }));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SURFACES = {
  primary: {
    background: "var(--surface-inverse)",
    color: "var(--text-on-light)",
    border: "1px solid transparent"
  },
  accent: {
    background: "var(--blue-glow)",
    color: "var(--text-on-accent)",
    border: "1px solid transparent"
  },
  secondary: {
    background: "var(--surface-input)",
    color: "var(--text-primary)",
    border: "1px solid transparent"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-primary)",
    border: "var(--border-strong)"
  },
  glass: {
    background: "var(--surface-pill)",
    color: "var(--text-primary)",
    border: "1px solid rgba(255,255,255,.14)",
    backdropFilter: "var(--blur-glass)"
  }
};
const SIZES = {
  sm: {
    height: "var(--control-h-sm)",
    padding: "0 14px",
    fontSize: "var(--fs-body-sm)",
    borderRadius: "var(--radius-pill)"
  },
  md: {
    height: "var(--control-h)",
    padding: "0 18px",
    fontSize: "var(--fs-body)",
    borderRadius: "var(--radius-sm)"
  },
  lg: {
    height: "var(--control-h-lg)",
    padding: "0 22px",
    fontSize: "var(--fs-body)",
    borderRadius: "var(--radius-sm)"
  }
};
function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  pill = false,
  iconLeft,
  iconRight,
  disabled = false,
  style,
  onClick,
  ...rest
}) {
  const [down, setDown] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onClick: onClick,
    onPointerDown: () => setDown(true),
    onPointerUp: () => setDown(false),
    onPointerLeave: () => setDown(false)
  }, rest, {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--space-4)",
      fontFamily: "var(--font-ui)",
      fontWeight: "var(--fw-medium)",
      letterSpacing: "var(--ls-body)",
      cursor: disabled ? "default" : "pointer",
      width: fullWidth ? "100%" : undefined,
      opacity: disabled ? 0.4 : 1,
      transform: down && !disabled ? "scale(var(--press-scale))" : "scale(1)",
      transition: "transform var(--dur-instant) var(--ease-standard), opacity var(--dur-fast) var(--ease-standard)",
      WebkitTapHighlightColor: "transparent",
      ...SIZES[size],
      ...SURFACES[variant],
      borderRadius: pill ? "var(--radius-pill)" : SIZES[size].borderRadius,
      ...style
    }
  }), iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: size === "sm" ? 14 : 18
  }) : null, children, iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: size === "sm" ? 14 : 18
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  dark: {
    background: "var(--surface-input)",
    color: "var(--text-primary)",
    border: "1px solid transparent"
  },
  glass: {
    background: "rgba(120,120,123,.28)",
    color: "var(--text-primary)",
    border: "1px solid rgba(255,255,255,.12)",
    backdropFilter: "var(--blur-glass)"
  },
  light: {
    background: "var(--surface-inverse)",
    color: "var(--text-on-light)",
    border: "1px solid transparent"
  },
  accent: {
    background: "var(--blue-glow)",
    color: "var(--text-on-accent)",
    border: "1px solid transparent"
  },
  bare: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent"
  }
};
function IconButton({
  icon,
  size = 36,
  tone = "dark",
  label,
  style,
  ...rest
}) {
  const [down, setDown] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label || icon,
    onPointerDown: () => setDown(true),
    onPointerUp: () => setDown(false),
    onPointerLeave: () => setDown(false)
  }, rest, {
    style: {
      width: size,
      height: size,
      borderRadius: "var(--radius-pill)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flex: "none",
      transform: down ? "scale(var(--press-scale))" : "scale(1)",
      transition: "transform var(--dur-instant) var(--ease-standard)",
      WebkitTapHighlightColor: "transparent",
      ...TONES[tone],
      ...style
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: Math.round(size * 0.45)
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Legend.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Legend({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "var(--space-5)",
      ...style
    }
  }, rest), items.map(it => /*#__PURE__*/React.createElement("span", {
    key: it.label,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-3)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-caption)",
      color: "var(--text-primary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 2,
      background: it.color,
      flex: "none"
    }
  }), it.label)));
}
Object.assign(__ds_scope, { Legend });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Legend.jsx", error: String((e && e.message) || e) }); }

// components/data/ListRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ListRow({
  icon,
  title,
  meta,
  count,
  danger = false,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick
  }, rest, {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-5)",
      padding: "12px 0",
      borderBottom: "1px solid var(--line-hairline)",
      cursor: onClick ? "pointer" : "default",
      ...style
    }
  }), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16,
    color: danger ? "var(--danger)" : "var(--text-secondary)"
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body)",
      color: danger ? "var(--danger)" : "var(--text-primary)"
    }
  }, title), meta ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-tertiary)"
    }
  }, meta) : null, count != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-tertiary)"
    }
  }, count) : null, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 15,
    color: "var(--text-tertiary)"
  }));
}
Object.assign(__ds_scope, { ListRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ListRow.jsx", error: String((e && e.message) || e) }); }

// components/data/MetricRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function MetricRow({
  icon,
  value,
  label,
  delta,
  deltaTone = "success",
  valueColor = "var(--text-primary)",
  chevron = true,
  onClick,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick
  }, rest, {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-5)",
      padding: "10px 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-card-alt)",
      border: "var(--border-card)",
      cursor: onClick ? "pointer" : "default",
      ...style
    }
  }), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: "var(--radius-xs)",
      background: "var(--surface-input)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    color: "var(--text-primary)"
  })) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)",
      color: valueColor
    }
  }, value), delta ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-medium)",
      color: deltaTone === "success" ? "var(--success)" : "var(--danger)"
    }
  }, delta) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-tertiary)"
    }
  }, label)), chevron ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 16,
    color: "var(--text-tertiary)"
  }) : null);
}
Object.assign(__ds_scope, { MetricRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/MetricRow.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressDial.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgressDial({
  value = 0,
  max = 100,
  label,
  sublabel,
  size = 168,
  thickness = 10,
  color = "var(--blue-glow)",
  track = "rgba(255,255,255,.10)",
  sweep = 300,
  style,
  children,
  ...rest
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const arc = sweep / 360 * c;
  const pct = Math.max(0, Math.min(1, value / max));
  const rot = 90 + (360 - sweep) / 2;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      width: size,
      height: size,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    style: {
      transform: "rotate(" + rot + "deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: track,
    strokeWidth: thickness,
    strokeLinecap: "round",
    strokeDasharray: arc + " " + c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: size / 2,
    cy: size / 2,
    r: r,
    fill: "none",
    stroke: color,
    strokeWidth: thickness,
    strokeLinecap: "round",
    strokeDasharray: arc * pct + " " + c,
    style: {
      transition: "stroke-dasharray var(--dur-slow) var(--ease-out)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2
    }
  }, children, label ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-numeric)",
      fontWeight: "var(--fw-numeric)",
      fontSize: "var(--fs-num-lg)",
      color: "var(--text-primary)"
    }
  }, label) : null, sublabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, sublabel) : null));
}
Object.assign(__ds_scope, { ProgressDial });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressDial.jsx", error: String((e && e.message) || e) }); }

// components/data/StackedBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StackedBar({
  segments = [],
  height = 96,
  ticks = true,
  style,
  ...rest
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 3,
      height
    }
  }, segments.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: s.value / total,
      height: "100%",
      borderRadius: "var(--radius-xs)",
      background: s.color,
      backgroundImage: ticks ? "repeating-linear-gradient(90deg,rgba(0,0,0,.22) 0 1px,transparent 1px 5px)" : undefined
    }
  }))));
}
Object.assign(__ds_scope, { StackedBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StackedBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  required = false,
  placeholder,
  value,
  onChange,
  unit,
  icon,
  type = "text",
  disabled = false,
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginBottom: "var(--space-3)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-primary)"
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-required)"
    }
  }, " *") : null) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      height: "var(--control-h)",
      padding: "0 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-input)",
      border: focus ? "1px solid var(--blue-glow)" : "var(--border-input)",
      opacity: disabled ? 0.5 : 1,
      transition: "border-color var(--dur-fast) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body)",
      color: "var(--text-primary)",
      ...inputStyle
    }
  })), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-tertiary)"
    }
  }, unit) : null, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    color: "var(--text-secondary)"
  }) : null));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/OtpInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function OtpInput({
  length = 6,
  value = "",
  onChange,
  style,
  ...rest
}) {
  const cells = Array.from({
    length
  }, (_, i) => value[i]);
  const focusIndex = Math.min(value.length, length - 1);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      gap: "var(--space-4)",
      ...style
    }
  }, rest), cells.map((ch, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: 46,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-sm)",
      background: "var(--surface-input)",
      border: i === focusIndex ? "1px solid var(--blue-glow)" : "1px solid transparent",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-medium)",
      color: ch ? "var(--text-primary)" : "var(--text-tertiary)"
    }
  }, ch || "-")));
}
Object.assign(__ds_scope, { OtpInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/OtpInput.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SearchField({
  placeholder = "Search",
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      height: 38,
      padding: "0 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-chip)",
      border: "var(--border-input)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    value: value,
    onChange: onChange,
    placeholder: placeholder
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body)",
      color: "var(--text-primary)"
    }
  })), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 16,
    color: "var(--text-tertiary)"
  }));
}
Object.assign(__ds_scope, { SearchField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchField.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  value,
  options = [],
  onChange,
  width,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      width,
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginBottom: "var(--space-3)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-label)",
      fontWeight: "var(--fw-medium)",
      color: "var(--text-primary)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      height: "var(--control-h)",
      padding: "0 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--surface-input)",
      border: "var(--border-input)"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    onChange: onChange
  }, rest, {
    style: {
      appearance: "none",
      WebkitAppearance: "none",
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body)",
      color: "var(--text-primary)",
      paddingRight: 18
    }
  }), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value ?? o,
    value: o.value ?? o,
    style: {
      color: "#000"
    }
  }, o.label ?? o))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    color: "var(--text-secondary)",
    style: {
      position: "absolute",
      right: 12,
      pointerEvents: "none"
    }
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/ScreenHeader.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ScreenHeader({
  title,
  subtitle,
  back = true,
  onBack,
  right,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-5)",
      minHeight: 44,
      ...style
    }
  }, rest), back ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "chevron-left",
    label: "Back",
    onClick: onBack
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--text-primary)",
      letterSpacing: "var(--ls-title)"
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-caption)",
      color: "var(--text-tertiary)"
    }
  }, subtitle) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      minWidth: 36
    }
  }, right));
}
Object.assign(__ds_scope, { ScreenHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/ScreenHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SegmentedControl.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SegmentedControl({
  options = [],
  value,
  onChange,
  variant = "pill",
  style,
  ...rest
}) {
  const current = value ?? (options[0] && (options[0].value ?? options[0]));
  if (variant === "underline") {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: "flex",
        gap: "var(--space-8)",
        borderBottom: "1px solid var(--line-hairline)",
        ...style
      }
    }, rest), options.map(o => {
      const v = o.value ?? o,
        lbl = o.label ?? o,
        on = v === current;
      return /*#__PURE__*/React.createElement("button", {
        key: v,
        type: "button",
        onClick: () => onChange && onChange(v),
        style: {
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 0 10px",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--fs-body)",
          fontWeight: on ? "var(--fw-semibold)" : "var(--fw-regular)",
          color: on ? "var(--text-primary)" : "var(--text-tertiary)",
          borderBottom: on ? "2px solid var(--full-white)" : "2px solid transparent",
          marginBottom: -1
        }
      }, lbl);
    }));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      padding: 3,
      borderRadius: "var(--radius-pill)",
      background: "var(--surface-chip)",
      border: "var(--border-input)",
      ...style
    }
  }, rest), options.map(o => {
    const v = o.value ?? o,
      lbl = o.label ?? o,
      on = v === current;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      type: "button",
      onClick: () => onChange && onChange(v),
      style: {
        height: 26,
        padding: "0 12px",
        borderRadius: "var(--radius-pill)",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--fs-label)",
        fontWeight: "var(--fw-medium)",
        background: on ? "var(--surface-inverse)" : "transparent",
        color: on ? "var(--text-on-light)" : "var(--text-secondary)",
        transition: "background var(--dur-fast) var(--ease-standard)",
        WebkitTapHighlightColor: "transparent"
      }
    }, lbl);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const DEFAULT_TABS = [{
  id: "home",
  icon: "house"
}, {
  id: "coaching",
  icon: "dumbbell"
}, {
  id: "chats",
  icon: "message-square"
}, {
  id: "profile",
  icon: "user"
}];
function TabBar({
  tabs = DEFAULT_TABS,
  active,
  onChange,
  style,
  ...rest
}) {
  const current = active || tabs[0].id;
  return /*#__PURE__*/React.createElement("nav", _extends({}, rest, {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-4)",
      padding: 6,
      borderRadius: "var(--radius-pill)",
      background: "var(--surface-glass)",
      border: "1px solid rgba(255,255,255,.10)",
      backdropFilter: "var(--blur-glass)",
      boxShadow: "var(--shadow-tabbar)",
      ...style
    }
  }), tabs.map(t => {
    const on = t.id === current;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      "aria-label": t.id,
      onClick: () => onChange && onChange(t.id),
      style: {
        width: 44,
        height: 44,
        borderRadius: "var(--radius-pill)",
        border: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: on ? "var(--surface-inverse)" : "var(--surface-input)",
        transition: "background var(--dur-fast) var(--ease-standard)",
        WebkitTapHighlightColor: "transparent"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.icon,
      size: 20,
      color: on ? "var(--text-on-light)" : "var(--text-primary)"
    }));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/AuthFlow.jsx
try { (() => {
const {
  Button,
  Input,
  Select,
  OtpInput,
  Badge,
  IconButton,
  Icon,
  ProgressDial
} = window.LGrowDesignSystem_af8774;
function OnboardingScreen({
  onNext
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "url(../../assets/img/athlete-dumbbell.png) center/cover"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--scrim-bottom)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 56,
      padding: "0 var(--gutter-screen)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)",
      marginBottom: 6
    }
  }, "Personal Fitness Coach"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "0 0 10px",
      fontSize: 28,
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "var(--ls-display)",
      lineHeight: "var(--lh-snug)"
    }
  }, "Every Day Is Better", /*#__PURE__*/React.createElement("br", null), "Than Yesterday"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 20px",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)"
    }
  }, "Push Yourself Harder to Become Better"), /*#__PURE__*/React.createElement("div", {
    onClick: onNext,
    style: {
      display: "flex",
      alignItems: "center",
      background: "var(--surface-glass)",
      border: "1px solid rgba(255,255,255,.18)",
      backdropFilter: "var(--blur-glass)",
      borderRadius: "var(--radius-md)",
      padding: 4,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 40,
      borderRadius: 8,
      background: "var(--surface-inverse)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-right",
    size: 18,
    color: "var(--text-on-light)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      textAlign: "center",
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-medium)"
    }
  }, "Workout Now"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 40,
      borderRadius: 8,
      background: "rgba(255,255,255,.16)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-right",
    size: 18
  })))));
}
const SOCIALS = [["Google", "chrome"], ["Facebook", "facebook"], ["Apple", "apple"]];
function LoginScreen({
  onNext
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--bg-cone-down)",
      opacity: .9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--bg-cone-up)",
      opacity: .9
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 150,
      padding: "0 var(--gutter-screen)",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Badge, null, "Join with us"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "12px 0 6px",
      fontSize: "var(--fs-display)",
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "var(--ls-display)",
      lineHeight: "var(--lh-snug)"
    }
  }, "Welcome to", /*#__PURE__*/React.createElement("br", null), "Our Zone"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 22px",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)"
    }
  }, "Push Yourself Harder to Become Better"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Select, {
    width: 86,
    defaultValue: "+32",
    options: ["+32", "+1", "+84"]
  }), /*#__PURE__*/React.createElement(Input, {
    placeholder: "Enter your phone number",
    style: {
      flex: 1
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onNext
  }, "Login Now"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      margin: "18px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--line-hairline)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-medium)"
    }
  }, "Or With"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--line-hairline)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 34
    }
  }, SOCIALS.map(([label, icon]) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 42,
      height: 42,
      borderRadius: "var(--radius-pill)",
      background: "var(--surface-inverse)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 20,
    color: "var(--text-on-light)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, label))))));
}
const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"]];
function OtpScreen({
  onNext,
  onClose
}) {
  const [code, setCode] = React.useState("860");
  const press = d => setCode(c => (c + d).slice(0, 6));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--bg-cone-down)",
      opacity: .75
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "rgba(12,12,12,.72)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      padding: "0 var(--gutter-screen)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "x",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, null, "OTP Check"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "12px 0 8px",
      fontSize: "var(--fs-title-1)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Check Your Phone Number"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 18px",
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)",
      lineHeight: "var(--lh-normal)"
    }
  }, "Please enter the 6-digit verification code that was sent to (+964) 123 456 789 to reset your password.", /*#__PURE__*/React.createElement("br", null), "The code is valid for 30 minutes."), /*#__PURE__*/React.createElement(OtpInput, {
    value: code
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "18px 0 12px",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-tertiary)"
    }
  }, "Resend Code (60s)"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onNext
  }, "Confirm"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 8,
      marginTop: 20
    }
  }, KEYS.map(([d, sub]) => /*#__PURE__*/React.createElement("button", {
    key: d,
    onClick: () => press(d),
    style: {
      height: 42,
      borderRadius: "var(--radius-sm)",
      background: "var(--surface-input)",
      border: "none",
      color: "var(--text-primary)",
      cursor: "pointer",
      fontFamily: "var(--font-ui)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 500,
      lineHeight: 1
    }
  }, d), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 8,
      letterSpacing: ".1em",
      color: "var(--text-tertiary)"
    }
  }, sub))), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("button", {
    onClick: () => press("0"),
    style: {
      height: 42,
      borderRadius: "var(--radius-sm)",
      background: "var(--surface-input)",
      border: "none",
      color: "var(--text-primary)",
      fontSize: 19,
      cursor: "pointer",
      fontFamily: "var(--font-ui)"
    }
  }, "0"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCode(c => c.slice(0, -1)),
    style: {
      height: 42,
      borderRadius: "var(--radius-sm)",
      background: "transparent",
      border: "none",
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "delete",
    size: 20,
    color: "var(--text-secondary)"
  }))))));
}
function BasicInfoScreen({
  onNext
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 260,
      background: "var(--bg-cone-up)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 3,
      background: "var(--surface-input)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "42%",
      height: "100%",
      background: "var(--blue-glow)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "34px var(--gutter-screen) 0",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Badge, null, "Basic Information"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "12px 0 20px",
      fontSize: "var(--fs-title-1)",
      fontWeight: "var(--fw-semibold)",
      lineHeight: "var(--lh-snug)"
    }
  }, "We need a few details from you."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Full name",
    required: true,
    placeholder: "e.g, Ahmad Bergson"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    placeholder: "Enter your email"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Date of Birth",
    required: true,
    placeholder: "Select date",
    icon: "calendar"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Height",
    required: true,
    placeholder: "0.00",
    unit: "cm",
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Weight",
    required: true,
    placeholder: "0.00",
    unit: "kg",
    style: {
      flex: 1
    }
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onNext,
    style: {
      marginTop: 6
    }
  }, "Confirm"))));
}
function ConnectDeviceScreen({
  onNext
}) {
  const [sel, setSel] = React.useState("watch");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      padding: "10px var(--gutter-screen)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-page)",
      borderRadius: "var(--radius-2xl)",
      border: "var(--border-card)",
      padding: "18px 16px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Badge, null, "Connect Device"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "12px 0 8px",
      fontSize: "var(--fs-title-1)",
      fontWeight: "var(--fw-regular)"
    }
  }, "Connected for Control"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 18px",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)",
      lineHeight: "var(--lh-normal)"
    }
  }, "Select your device to connect with us.", /*#__PURE__*/React.createElement("br", null), "Your data will then be synchronized and kept as accurate and up to date as possible."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, [["watch", "Watch", "watch"], ["ring", "Ring", "circle"]].map(([id, label, icon]) => /*#__PURE__*/React.createElement("div", {
    key: id,
    onClick: () => setSel(id),
    style: {
      flex: 1,
      height: 176,
      borderRadius: "var(--radius-lg)",
      background: "var(--surface-raised)",
      border: sel === id ? "1px solid var(--blue-glow)" : "var(--border-card)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 54,
    color: "var(--text-secondary)"
  }), /*#__PURE__*/React.createElement(Badge, {
    caps: true
  }, label)))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: onNext,
    style: {
      marginTop: 16
    }
  }, "Confirm")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      background: "var(--surface-page)",
      border: "var(--border-card)",
      borderRadius: "var(--radius-2xl)",
      padding: 20,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 0 14px",
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-regular)"
    }
  }, "Connecting..."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(ProgressDial, {
    size: 150,
    thickness: 5,
    value: 62,
    sweep: 320
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "watch",
    size: 64,
    color: "var(--text-secondary)"
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "14px 0 0",
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, "Connecting to your device.", /*#__PURE__*/React.createElement("br", null), "Please make sure Bluetooth is enabled on your phone.")));
}
Object.assign(window, {
  OnboardingScreen,
  LoginScreen,
  OtpScreen,
  BasicInfoScreen,
  ConnectDeviceScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/AuthFlow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/ChatScreens.jsx
try { (() => {
const {
  Card,
  Avatar,
  Badge,
  SearchField,
  IconButton,
  Icon
} = window.LGrowDesignSystem_af8774;
const CHATS = [{
  name: "Adam Brown",
  initials: "AB",
  color: "var(--blue-glow)",
  time: "Now",
  status: ["phone", "Voice call • In call", "var(--success)"]
}, {
  name: "Skylar Aminoff",
  initials: "",
  color: "var(--surface-input)",
  time: "Now",
  status: ["video", "Video call • In call", "var(--success)"]
}, {
  name: "Madelyn Septimus",
  initials: "MS",
  color: "var(--data-steps)",
  time: "09:38",
  status: ["check-check", "Please let me know your ideas so I can better", "var(--blue-300)"]
}, {
  name: "Lincoln Bator",
  initials: "LB",
  color: "var(--success)",
  time: "09:38",
  status: ["check-check", "Please let me know your ideas so I can better", "var(--blue-300)"]
}, {
  name: "Miracle George",
  initials: "MG",
  color: "var(--data-nutrition)",
  time: "Yesterday",
  status: ["check-check", "Please let me know your ideas so I can better", "var(--blue-300)"],
  dot: true
}, {
  name: "Davis Rosser",
  initials: "DR",
  color: "var(--success)",
  time: "09:18",
  status: ["check", "I already shared with them and waiting thier feedback will back to you today", "var(--text-tertiary)"]
}, {
  name: "Gustavo Siphron",
  initials: "GS",
  color: "var(--data-calories)",
  time: "09:12",
  status: [null, "typing...", "var(--text-tertiary)"]
}, {
  name: "Wilson Levin",
  initials: "WL",
  color: "var(--data-nutrition)",
  time: "08:20",
  status: ["mic", "Voice message • 34s", "var(--text-tertiary)"],
  unread: 1
}];
function ChatsScreen({
  onOpenThread
}) {
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 2
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Chats"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "plus"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "ellipsis"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "12px 0 4px"
    }
  }, /*#__PURE__*/React.createElement(SearchField, null)), /*#__PURE__*/React.createElement("div", null, CHATS.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.name,
    onClick: onOpenThread,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "11px 0",
      borderBottom: "1px solid var(--line-hairline)",
      cursor: "pointer"
    }
  }, c.initials ? /*#__PURE__*/React.createElement(Avatar, {
    initials: c.initials,
    color: c.color
  }) : /*#__PURE__*/React.createElement(Avatar, {
    color: "var(--surface-input)"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-semibold)"
    }
  }, c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5,
      fontSize: "var(--fs-caption)",
      color: c.status[2],
      lineHeight: 1.35
    }
  }, c.status[0] ? /*#__PURE__*/React.createElement(Icon, {
    name: c.status[0],
    size: 11,
    color: c.status[2]
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical"
    }
  }, c.status[1]))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: c.unread ? "var(--data-nutrition)" : "var(--text-tertiary)"
    }
  }, c.time), c.unread ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 16,
      height: 16,
      borderRadius: 9,
      background: "var(--blue-glow)",
      fontSize: 9,
      marginTop: 4
    }
  }, c.unread) : null, c.dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: 6,
      height: 6,
      borderRadius: 4,
      background: "var(--blue-300)",
      marginLeft: "auto",
      marginTop: 5
    }
  }) : null)))));
}
function ChatThreadScreen({
  onBack
}) {
  const [msgs, setMsgs] = React.useState([{
    me: false,
    text: "Have you run enough kilometers today? 🙋",
    time: "20:10"
  }, {
    me: true,
    text: "I've run enough for today. I've completed my goal for the day. See you tomorrow!",
    time: "20:10"
  }]);
  const [draft, setDraft] = React.useState("");
  const send = () => {
    if (!draft.trim()) return;
    setMsgs(m => [...m, {
      me: true,
      text: draft,
      time: "20:12"
    }]);
    setDraft("");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 420,
      background: "var(--bg-cone-up)",
      opacity: .8
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "4px var(--gutter-screen) 10px",
      borderBottom: "1px solid var(--line-hairline)"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "chevron-left",
    onClick: onBack
  }), /*#__PURE__*/React.createElement(Avatar, {
    initials: "AB"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Adam Brown"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "var(--text-tertiary)"
    }
  }, "Last seen: yesterday at 16:40")), /*#__PURE__*/React.createElement(IconButton, {
    icon: "video"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "phone"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "12px var(--gutter-screen)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Badge, null, "Today")), /*#__PURE__*/React.createElement(Card, {
    radius: "var(--radius-lg)",
    pad: "12px",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      fontSize: 10,
      color: "var(--text-secondary)",
      lineHeight: "var(--lh-normal)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 12,
    color: "var(--text-secondary)"
  }), /*#__PURE__*/React.createElement("span", null, "Messages, media, voice notes, calls, polls and reactions in this chat are end-to-end encrypted. Only the participants can read, listen to, or share them."))), msgs.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      justifyContent: m.me ? "flex-end" : "flex-start",
      alignItems: "flex-end",
      gap: 6,
      marginBottom: 10
    }
  }, !m.me ? /*#__PURE__*/React.createElement(Avatar, {
    initials: "AB",
    size: 22
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 232,
      padding: "9px 12px",
      borderRadius: m.me ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
      background: m.me ? "var(--blue-100)" : "var(--surface-input)",
      color: m.me ? "var(--text-on-light)" : "var(--text-primary)",
      fontSize: "var(--fs-body-sm)",
      lineHeight: "var(--lh-normal)"
    }
  }, m.text, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      fontSize: 9,
      opacity: .6,
      marginTop: 3
    }
  }, m.time))))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px var(--gutter-screen) 30px"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "circle-plus",
    tone: "bare",
    size: 32
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "image",
    tone: "bare",
    size: 32
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 38,
      padding: "0 12px",
      borderRadius: "var(--radius-pill)",
      background: "var(--surface-input)"
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => e.key === "Enter" && send(),
    placeholder: "Add a message",
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-primary)"
    }
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "smile",
    size: 16,
    color: "var(--text-tertiary)"
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: "mic",
    size: 34,
    onClick: send
  })));
}
Object.assign(window, {
  ChatsScreen,
  ChatThreadScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/ChatScreens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/CoachingScreen.jsx
try { (() => {
const {
  Card,
  Badge,
  Chip,
  SegmentedControl,
  IconButton,
  Icon,
  DotNumber
} = window.LGrowDesignSystem_af8774;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = ["6 AM", "10 AM", "2 PM", "6 PM", "10 PM"];
const HEAT = [[1, 2, 0, 2, 2, 0, 0], [0, 1, 0, 0, 1, 0, 0], [0, 1, 0, 1, 2, 0, 0], [0, 0, 0, 0, 2, 0, 0], [1, 0, 1, 0, 0, 0, 2]];
const HEAT_BG = ["var(--surface-input)", "var(--blue-300)", "var(--blue-glow)"];
function ActivityCalendar() {
  return /*#__PURE__*/React.createElement(Card, {
    tone: "bloom",
    radius: "var(--radius-2xl)",
    pad: "var(--pad-card-lg)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "calendar",
    size: 34
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-secondary)"
    }
  }, "Wednesday"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "May 13, 2026"))), /*#__PURE__*/React.createElement(IconButton, {
    icon: "plus",
    size: 34
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "34px repeat(7,1fr)",
      gap: 4,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", null), DAYS.map(d => /*#__PURE__*/React.createElement("span", {
    key: d,
    style: {
      fontSize: 9,
      color: "var(--text-secondary)",
      textAlign: "center"
    }
  }, d)), HEAT.map((row, r) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: r
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: "var(--text-secondary)"
    }
  }, HOURS[r]), row.map((v, c) => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      height: 16,
      borderRadius: 3,
      background: HEAT_BG[v]
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 92,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, "Today"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "6h 15m"), /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "2.3% \u2197")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, "This week"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "34h 12m"), /*#__PURE__*/React.createElement(Badge, {
    tone: "danger"
  }, "10.1% \u2198")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 12
    }
  }, [["0–49%", HEAT_BG[0]], ["50–79%", HEAT_BG[1]], ["80–100%", HEAT_BG[2]]].map(([l, c]) => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      flex: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 20,
      borderRadius: 4,
      background: "rgba(255,255,255,.06)",
      fontSize: 9,
      color: "var(--text-primary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: c
    }
  }), l))));
}
const EXERCISES = [["Push-Ups", "20 Times x5", "../../assets/img/exercise-thumb-2.png"], ["Battle Rope", "3 min x5 rounds", "../../assets/img/battle-rope.png"], ["Dumbbell Curl", "12 Times x4", "../../assets/img/exercise-thumb-1.png"]];
const MEALS = ["Breakfast", "Brunch", "Lunch", "Dinner", "Snack"];
function CoachingScreen({
  onOpenExercise,
  onScan
}) {
  const [tab, setTab] = React.useState("Exercises");
  const [meal, setMeal] = React.useState("Breakfast");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 132,
      background: "url(../../assets/img/battle-rope.png) center/cover",
      marginTop: -44
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--scrim-bottom)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 12,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-secondary)"
    }
  }, "Couching"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Better Than Yesterday"))), /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      margin: "12px 0 14px"
    }
  }, ["Exercises", "Nutrition"].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: () => setTab(t),
    style: {
      flex: 1,
      height: 34,
      borderRadius: "var(--radius-sm)",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-medium)",
      background: tab === t ? "var(--surface-inverse)" : "var(--surface-input)",
      color: tab === t ? "var(--text-on-light)" : "var(--text-secondary)"
    }
  }, t))), tab === "Exercises" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ActivityCalendar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      margin: "18px 0 10px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Today Exercises"), /*#__PURE__*/React.createElement(Badge, {
    tone: "light"
  }, "[2/10]")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-card)"
    }
  }, EXERCISES.map(([title, meta, img]) => /*#__PURE__*/React.createElement(Card, {
    key: title,
    pad: "0",
    radius: "var(--radius-lg)",
    onClick: onOpenExercise,
    style: {
      cursor: "pointer",
      display: "flex",
      alignItems: "stretch"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "14px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)",
      marginTop: 2
    }
  }, meta)), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 118,
      background: "url(" + img + ") center/cover"
    }
  }))))) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Card, {
    tone: "bloom",
    radius: "var(--radius-2xl)",
    pad: "var(--pad-card-lg)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, "What did you eat today?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-semibold)",
      margin: "2px 0 10px"
    }
  }, "200 calories")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "clock",
    size: 34
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      display: "flex",
      gap: 2
    }
  }, Array.from({
    length: 26
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: 10,
      borderRadius: 1,
      background: i < 9 ? "var(--blue-glow)" : "rgba(255,255,255,.14)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: "var(--fs-body-sm)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cookie",
    size: 16
  }), "Mango Smoothie"), /*#__PURE__*/React.createElement("button", {
    onClick: onScan,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "var(--surface-pill)",
      border: "none",
      borderRadius: "var(--radius-pill)",
      padding: "6px 12px",
      color: "var(--text-primary)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-caption)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "scan",
    size: 14
  }), "Scan Your Dish"))), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "18px 0 10px",
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Today Recommends"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      paddingBottom: 12
    }
  }, MEALS.map(m => /*#__PURE__*/React.createElement(Chip, {
    key: m,
    selected: meal === m,
    onClick: () => setMeal(m)
  }, m))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--gap-card)"
    }
  }, [["Shrimp & Broccoli", "412 kcal"], ["Salmon Bowl", "530 kcal"]].map(([t, k]) => /*#__PURE__*/React.createElement(Card, {
    key: t,
    pad: "0",
    radius: "var(--radius-lg)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 104,
      background: "url(../../assets/img/dish-noodles.png) center/cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-semibold)"
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, k))))))));
}
Object.assign(window, {
  CoachingScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/CoachingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/ExerciseScreen.jsx
try { (() => {
const {
  Card,
  Badge,
  Button,
  IconButton,
  ScreenHeader,
  ProgressDial,
  DotNumber,
  Icon
} = window.LGrowDesignSystem_af8774;
function ExerciseScreen({
  onBack
}) {
  const [running, setRunning] = React.useState(true);
  const [sec, setSec] = React.useState(22.5);
  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSec(s => s <= 0.5 ? 30 : +(s - 0.5).toFixed(1)), 500);
    return () => clearInterval(t);
  }, [running]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "url(../../assets/img/battle-rope.png) center/cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--scrim-top)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "0 var(--gutter-screen)"
    }
  }, /*#__PURE__*/React.createElement(ScreenHeader, {
    title: "Battle Rope Exercise",
    onBack: onBack,
    right: /*#__PURE__*/React.createElement(IconButton, {
      icon: "activity",
      tone: "glass"
    })
  })), /*#__PURE__*/React.createElement(Card, {
    tone: "glass",
    radius: "var(--radius-2xl)",
    pad: "var(--pad-card-lg)",
    style: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 26,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-secondary)"
    }
  }, "Time count"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-semibold)",
      margin: "2px 0 6px"
    }
  }, "3 min 20 sec"), /*#__PURE__*/React.createElement(Badge, null, "Round 2"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      margin: "10px 0 4px"
    }
  }, /*#__PURE__*/React.createElement(ProgressDial, {
    size: 172,
    thickness: 10,
    value: (30 - sec) / 30 * 100,
    sweep: 300
  }, /*#__PURE__*/React.createElement(DotNumber, {
    value: sec.toFixed(1),
    size: "lg",
    unit: "sec"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)",
      margin: "4px 0 14px"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Round 1"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      display: "flex",
      gap: 2
    }
  }, Array.from({
    length: 22
  }).map((_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: 9,
      borderRadius: 1,
      background: i < 13 ? "var(--blue-glow)" : "rgba(255,255,255,.14)"
    }
  }))), /*#__PURE__*/React.createElement("span", null, "Round 5")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    style: {
      flex: 1
    },
    onClick: onBack
  }, "Complete"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    style: {
      flex: 1
    },
    iconLeft: running ? "pause" : "play",
    onClick: () => setRunning(!running)
  }, running ? "Pause" : "Resume"))));
}
Object.assign(window, {
  ExerciseScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/ExerciseScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/HomeScreen.jsx
try { (() => {
const {
  Card,
  Badge,
  Chip,
  Avatar,
  IconButton,
  Icon,
  DotNumber,
  SegmentedControl,
  StackedBar,
  Legend
} = window.LGrowDesignSystem_af8774;
const CATS = ["Gym", "Cadio", "Yoga", "Pilates", "Swim"];
function RouteCard() {
  return /*#__PURE__*/React.createElement(Card, {
    pad: "0",
    radius: "var(--radius-xl)",
    style: {
      height: 172,
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--surface-card-alt)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 220 172",
    width: "100%",
    height: "100%"
  }, /*#__PURE__*/React.createElement("g", {
    stroke: "rgba(255,255,255,.07)",
    strokeWidth: "1"
  }, [18, 46, 74, 102, 130, 158].map(y => /*#__PURE__*/React.createElement("line", {
    key: y,
    x1: "0",
    y1: y,
    x2: "220",
    y2: y
  })), [22, 58, 94, 130, 166, 202].map(x => /*#__PURE__*/React.createElement("line", {
    key: x,
    x1: x,
    y1: "0",
    x2: x,
    y2: "172"
  }))), /*#__PURE__*/React.createElement("path", {
    d: "M26 24 L26 66 L84 66 L84 104 L132 104 L132 140 L186 140",
    fill: "none",
    stroke: "var(--blue-glow)",
    strokeWidth: "3",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "26",
    cy: "24",
    r: "4",
    fill: "var(--full-white)"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "186",
    cy: "140",
    r: "5",
    fill: "none",
    stroke: "var(--full-white)",
    strokeWidth: "2"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 10,
      left: 10,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "var(--surface-inverse)",
      color: "var(--text-on-light)",
      borderRadius: "var(--radius-pill)",
      padding: "5px 10px",
      fontSize: "var(--fs-caption)",
      fontWeight: "var(--fw-medium)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: 9,
      background: "var(--blue-glow)"
    }
  }), "Starting Point"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 96,
      top: 74
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    src: "../../assets/img/avatar-tobi.png",
    size: 34,
    ring: true
  })));
}
function EtaCard() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--gap-card)"
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(DotNumber, {
    value: "32",
    unit: "min"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "info",
    size: 22,
    tone: "dark"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-medium)"
    }
  }, "10:30 ETA \xB7 3 Miles")), /*#__PURE__*/React.createElement(Card, {
    tone: "bloom",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-medium)",
      lineHeight: "var(--lh-snug)"
    }
  }, "\uD83D\uDCAA You Beat", /*#__PURE__*/React.createElement("br", null), "Your Limit! \uD83C\uDF89\uD83C\uDF89")));
}
function DailyProcessCard() {
  const [range, setRange] = React.useState("Today");
  const today = range === "Today";
  return /*#__PURE__*/React.createElement(Card, {
    tone: "bloom",
    pad: "var(--pad-card-lg)",
    radius: "var(--radius-2xl)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "loader-circle",
    size: 16
  }), "Daily Process"), /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ["Today", "Weekly"],
    value: range,
    onChange: setRange
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      margin: "10px 0 6px"
    }
  }, /*#__PURE__*/React.createElement(DotNumber, {
    value: today ? "93.2" : "81.4",
    size: "hero",
    unit: "%"
  })), /*#__PURE__*/React.createElement(StackedBar, {
    height: 84,
    segments: [{
      value: today ? 26 : 30,
      color: "var(--data-calories)"
    }, {
      value: 24,
      color: "var(--data-nutrition)"
    }, {
      value: today ? 22 : 16,
      color: "var(--data-exercises)"
    }, {
      value: 26,
      color: "var(--data-steps)"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)",
      margin: "6px 0 10px"
    }
  }, /*#__PURE__*/React.createElement("span", null, "0"), /*#__PURE__*/React.createElement("span", null, "100%")), /*#__PURE__*/React.createElement(Legend, {
    items: [{
      label: "Calories Burned",
      color: "var(--data-calories)"
    }, {
      label: "Nutrition",
      color: "var(--data-nutrition)"
    }, {
      label: "Exercises",
      color: "var(--data-exercises)"
    }, {
      label: "Steps",
      color: "var(--data-steps)"
    }]
  }));
}
function HomeScreen({
  onOpenExercise
}) {
  const [cat, setCat] = React.useState("Gym");
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-tertiary)"
    }
  }, "Wednesday / May 13, 2026"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "2px 0 0",
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "var(--ls-title)"
    }
  }, "Ready to workout?")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    size: 38
  }), /*#__PURE__*/React.createElement(Avatar, {
    src: "../../assets/img/avatar-tobi.png",
    size: 38
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.28fr 1fr",
      gap: "var(--gap-card)",
      margin: "14px 0 var(--gap-card)"
    }
  }, /*#__PURE__*/React.createElement(RouteCard, null), /*#__PURE__*/React.createElement(EtaCard, null)), /*#__PURE__*/React.createElement(DailyProcessCard, null), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    action: true,
    onAction: onOpenExercise
  }, "Discover New Exercises"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      paddingBottom: 12
    }
  }, CATS.map(c => /*#__PURE__*/React.createElement(Chip, {
    key: c,
    selected: cat === c,
    onClick: () => setCat(c)
  }, c))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--gap-card)"
    }
  }, [["../../assets/img/exercise-thumb-1.png", "Battle Rope", "12 min · Full body"], ["../../assets/img/exercise-thumb-2.png", "Dumbbell Curl", "8 min · Arms"]].map(([src, title, meta]) => /*#__PURE__*/React.createElement(Card, {
    key: title,
    pad: "0",
    radius: "var(--radius-lg)",
    onClick: onOpenExercise,
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 118,
      background: "url(" + src + ") center/cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--scrim-bottom)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      right: 10,
      bottom: 9
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-semibold)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, meta)))))));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/PhoneShell.jsx
try { (() => {
const {
  Icon,
  TabBar
} = window.LGrowDesignSystem_af8774;
function StatusBar({
  light
}) {
  const c = light ? "var(--text-on-light)" : "var(--text-primary)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 22px",
      flex: "none",
      position: "relative",
      zIndex: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      fontWeight: 600,
      color: c
    }
  }, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "signal",
    size: 14,
    color: c
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "wifi",
    size: 14,
    color: c
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "battery-full",
    size: 18,
    color: c
  })));
}
function PhoneShell({
  children,
  tab,
  onTab,
  showTabs = true,
  scroll = true,
  background = "var(--surface-page)"
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 844,
      borderRadius: 46,
      background,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "var(--shadow-sheet)",
      border: "1px solid rgba(255,255,255,.10)"
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflowY: scroll ? "auto" : "hidden",
      overflowX: "hidden",
      position: "relative",
      scrollbarWidth: "none"
    }
  }, children, showTabs ? /*#__PURE__*/React.createElement("div", {
    style: {
      height: 96
    }
  }) : null), showTabs ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 22,
      display: "flex",
      justifyContent: "center",
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement(TabBar, {
    active: tab,
    onChange: onTab
  })) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      bottom: 8,
      width: 134,
      height: 5,
      borderRadius: 3,
      background: "rgba(255,255,255,.85)",
      zIndex: 6
    }
  }));
}
function SectionTitle({
  children,
  action,
  onAction
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      margin: "0 0 10px"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)",
      letterSpacing: "var(--ls-title)"
    }
  }, children), action ? /*#__PURE__*/React.createElement("button", {
    onClick: onAction,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 18,
    color: "var(--text-secondary)"
  })) : null);
}
const Screen = ({
  children,
  pad = "var(--gutter-screen)"
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    padding: "0 " + pad
  }
}, children);
Object.assign(window, {
  PhoneShell,
  StatusBar,
  SectionTitle,
  Screen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/PhoneShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/ProfileScreen.jsx
try { (() => {
const {
  Card,
  Badge,
  Button,
  IconButton,
  Avatar,
  Icon,
  DotNumber,
  SegmentedControl,
  MetricRow,
  ListRow
} = window.LGrowDesignSystem_af8774;
function StreakCard() {
  return /*#__PURE__*/React.createElement(Card, {
    radius: "var(--radius-lg)",
    style: {
      width: 96,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-secondary)"
    }
  }, "Streak days"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      margin: "4px 0"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "wheat",
    size: 20,
    color: "var(--text-tertiary)",
    style: {
      transform: "scaleX(-1)"
    }
  }), /*#__PURE__*/React.createElement(DotNumber, {
    value: "8",
    size: "lg"
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "wheat",
    size: 20,
    color: "var(--text-tertiary)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, "Workout Now"));
}
function SleepAlertCard({
  onOpenSleep
}) {
  return /*#__PURE__*/React.createElement(Card, {
    radius: "var(--radius-lg)",
    style: {
      flex: 1,
      background: "linear-gradient(150deg,#8E1330 0%,#E11D48 100%)",
      border: "1px solid transparent"
    }
  }, /*#__PURE__*/React.createElement(DotNumber, {
    value: "5",
    unit: "hrs"
  }), /*#__PURE__*/React.createElement(DotNumber, {
    value: "32",
    unit: "min",
    style: {
      marginLeft: 6
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-medium)",
      margin: "4px 0 8px",
      lineHeight: "var(--lh-snug)"
    }
  }, "You didn't sleep well last night. \uD83D\uDE34"), /*#__PURE__*/React.createElement("button", {
    onClick: onOpenSleep,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: "var(--surface-inverse)",
      color: "var(--text-on-light)",
      border: "none",
      borderRadius: "var(--radius-pill)",
      padding: "5px 10px",
      fontSize: "var(--fs-caption)",
      fontFamily: "var(--font-ui)",
      fontWeight: "var(--fw-medium)",
      cursor: "pointer"
    }
  }, "What happens ", /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 12
  })));
}
function ProfileScreen({
  onOpenSleep
}) {
  const [tab, setTab] = React.useState("Overview");
  const [range, setRange] = React.useState("Today");
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 180,
      marginTop: -44,
      background: "url(../../assets/img/profile-cover.png) center/cover"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--scrim-bottom)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 52,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "settings",
    tone: "glass"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 16,
      bottom: -28
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    src: "../../assets/img/avatar-tobi.png",
    size: 88,
    ring: true
  }))), /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 36
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: "var(--fs-title-2)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Tobi Bui"), /*#__PURE__*/React.createElement(Badge, {
    tone: "outline",
    caps: true
  }, "Health mode")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      margin: "6px 0 8px",
      fontSize: "var(--fs-caption)",
      color: "var(--text-tertiary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 11
  }), "HA NOI, VN"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar",
    size: 11
  }), "18 SEPTEMBER, 2025")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 14px",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)",
      lineHeight: "var(--lh-normal)"
    }
  }, "I'm all about staying healthy \uD83C\uDF31 and on an exciting journey to sculpt a stronger, fitter me \uD83D\uDCAA\u2728")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-card)"
    }
  }, /*#__PURE__*/React.createElement(StreakCard, null), /*#__PURE__*/React.createElement(SleepAlertCard, {
    onOpenSleep: onOpenSleep
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "16px 0 14px"
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    variant: "underline",
    options: ["Overview", "Metrics", "Achievements"],
    value: tab,
    onChange: setTab,
    style: {
      justifyContent: "space-between"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Overall Stat"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-tertiary)"
    }
  }, "Main stats of your body condition")), /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ["Today", "7D", "30D"],
    value: range,
    onChange: setRange
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--gap-card)"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    pad: "0",
    radius: "var(--radius-lg)",
    style: {
      width: 132,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      minHeight: 196,
      background: "url(../../assets/img/body-scan-front.png) center/cover"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 8,
      textAlign: "center",
      fontSize: 9,
      color: "var(--text-secondary)"
    }
  }, "Stats compared to yesterday")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(MetricRow, {
    icon: "scale",
    value: "143.3",
    label: "Weight (lbs)",
    delta: "\u25B210"
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "ruler",
    value: "160",
    label: "Height (cm)"
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "droplet",
    value: "8.5",
    label: "Body fat (%)"
  }), /*#__PURE__*/React.createElement(MetricRow, {
    icon: "activity",
    value: "High",
    label: "Stress level",
    valueColor: "var(--danger)"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "18px 0 10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Steps Tracking"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16,
    color: "var(--text-tertiary)"
  })), /*#__PURE__*/React.createElement(Card, {
    radius: "var(--radius-lg)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-tertiary)"
    }
  }, "Total"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "8,125")), /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ["Today", "7D", "30D"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 2,
      height: 78,
      marginTop: 12
    }
  }, Array.from({
    length: 40
  }).map((_, i) => {
    const h = [2, 3, 5, 9, 26, 44, 58, 40, 22, 9, 5, 3, 2, 4, 7, 12, 9, 5, 3, 2, 3, 6, 14, 30, 46, 62, 48, 26, 12, 6, 3, 2, 2, 3, 5, 8, 6, 4, 3, 2][i];
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        flex: 1,
        height: h,
        borderRadius: 1,
        background: "linear-gradient(to top,var(--data-nutrition),var(--full-white))"
      }
    });
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 9,
      color: "var(--text-tertiary)",
      marginTop: 6
    }
  }, ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "12 AM"].map(t => /*#__PURE__*/React.createElement("span", {
    key: t
  }, t)))), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "18px 0 4px",
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Find Out More"), /*#__PURE__*/React.createElement(ListRow, {
    icon: "dumbbell",
    title: "My Exercises",
    count: 18
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "image",
    title: "Progress Photos",
    count: 216
  }), /*#__PURE__*/React.createElement(ListRow, {
    icon: "notebook-pen",
    title: "Notes",
    count: 16
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true,
    style: {
      marginTop: 16,
      background: "var(--danger-bg)",
      color: "var(--danger)"
    }
  }, "Log Out")));
}
Object.assign(window, {
  ProfileScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/ScanScreen.jsx
try { (() => {
const {
  Card,
  Button,
  IconButton,
  ScreenHeader,
  Badge
} = window.LGrowDesignSystem_af8774;
function ScanScreen({
  onBack
}) {
  const [done, setDone] = React.useState(false);
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(ScreenHeader, {
    back: true,
    title: "",
    onBack: onBack,
    right: /*#__PURE__*/React.createElement(IconButton, {
      icon: "zap"
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: "var(--fs-title-1)",
      fontWeight: "var(--fw-regular)"
    }
  }, "Scan Your Dish"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 16px",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)"
    }
  }, "Calculate the calories in a dish.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      height: 286,
      background: "url(../../assets/img/dish-noodles.png) center/cover"
    }
  }, [["top", "left"], ["top", "right"], ["bottom", "left"], ["bottom", "right"]].map(([v, h]) => /*#__PURE__*/React.createElement("span", {
    key: v + h,
    style: {
      position: "absolute",
      [v]: 10,
      [h]: 10,
      width: 26,
      height: 26,
      [v === "top" ? "borderTop" : "borderBottom"]: "2px dashed var(--full-white)",
      [h === "left" ? "borderLeft" : "borderRight"]: "2px dashed var(--full-white)"
    }
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "14px 0 16px",
      textAlign: "center",
      fontSize: "var(--fs-body-sm)",
      color: "var(--text-secondary)",
      lineHeight: "var(--lh-normal)"
    }
  }, "Scan the dish from directly above,", /*#__PURE__*/React.createElement("br", null), "approximately 30 cm above the dish, for the most accurate results."), done ? /*#__PURE__*/React.createElement(Card, {
    radius: "var(--radius-lg)",
    pad: "var(--pad-card-lg)",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-body-sm)",
      fontWeight: "var(--fw-semibold)",
      marginBottom: 6
    }
  }, "Ingredients:"), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 16,
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)",
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("li", null, "100g Brown Rice"), /*#__PURE__*/React.createElement("li", null, "1 head of broccoli"), /*#__PURE__*/React.createElement("li", null, "5 peeled shrimp"), /*#__PURE__*/React.createElement("li", null, "10g red bell peppers"), /*#__PURE__*/React.createElement("li", null, "1/2 carrot"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "814 calories"), /*#__PURE__*/React.createElement(Badge, null, "Calories in Your Meal"))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    style: {
      marginTop: 14
    },
    onClick: onBack
  }, "Confirm")) : /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    onClick: () => setDone(true)
  }, "Scan"));
}
Object.assign(window, {
  ScanScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/ScanScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile-app/SleepScreen.jsx
try { (() => {
const {
  Card,
  Badge,
  SegmentedControl,
  IconButton,
  ScreenHeader,
  ProgressDial,
  DotNumber,
  Legend,
  Icon
} = window.LGrowDesignSystem_af8774;
const STAGES = [{
  label: "REM",
  color: "var(--sleep-rem)"
}, {
  label: "Deep",
  color: "var(--sleep-deep)"
}, {
  label: "Core",
  color: "var(--sleep-core)"
}, {
  label: "Awake",
  color: "var(--sleep-awake)"
}, {
  label: "In bed",
  color: "var(--sleep-inbed)"
}, {
  label: "Asleep",
  color: "var(--sleep-asleep)"
}];
function MonthChart() {
  const bars = React.useMemo(() => Array.from({
    length: 30
  }, (_, i) => {
    const seed = i * 37 % 11;
    return [3 + seed % 4, 2 + seed * 2 % 5, 2 + seed * 3 % 4, 1 + seed % 3];
  }), []);
  return /*#__PURE__*/React.createElement(Card, {
    radius: "var(--radius-lg)",
    pad: "var(--pad-card)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-tertiary)"
    }
  }, "Month chart"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "September")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 176
    }
  }, /*#__PURE__*/React.createElement(Legend, {
    items: STAGES
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      fontSize: 9,
      color: "var(--text-tertiary)",
      height: 104
    }
  }, /*#__PURE__*/React.createElement("span", null, "9h"), /*#__PURE__*/React.createElement("span", null, "6h"), /*#__PURE__*/React.createElement("span", null, "3h"), /*#__PURE__*/React.createElement("span", null, "0")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      alignItems: "flex-end",
      gap: 2,
      height: 104
    }
  }, bars.map((stack, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      gap: 1
    }
  }, stack.map((h, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    style: {
      height: h * 4,
      borderRadius: 2,
      background: STAGES[j].color
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 9,
      color: "var(--text-tertiary)",
      marginTop: 6,
      paddingLeft: 26
    }
  }, [1, 5, 10, 15, 20, 25, 30].map(d => /*#__PURE__*/React.createElement("span", {
    key: d
  }, d))));
}
function SleepScreen({
  onBack
}) {
  const [range, setRange] = React.useState("Monthly");
  return /*#__PURE__*/React.createElement(Screen, null, /*#__PURE__*/React.createElement(ScreenHeader, {
    title: "Sleep",
    onBack: onBack,
    right: /*#__PURE__*/React.createElement(IconButton, {
      icon: "info"
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "6px 0 14px"
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    variant: "underline",
    options: ["Daily", "Weekly", "Monthly", "Yearly"],
    value: range,
    onChange: setRange,
    style: {
      justifyContent: "space-between"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-left",
    size: 14,
    color: "var(--text-secondary)"
  }), /*#__PURE__*/React.createElement(Badge, null, "Sep 1 - Sep 30"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14,
    color: "var(--text-secondary)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(ProgressDial, {
    size: 196,
    thickness: 14,
    value: 38,
    sweep: 220,
    color: "var(--sleep-asleep)"
  }, /*#__PURE__*/React.createElement(DotNumber, {
    value: "38",
    size: "lg",
    color: "var(--sleep-rem)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)"
    }
  }, "Monthly Average Score"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)",
      margin: "2px 0 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "moon",
    size: 12
  }), "11:16 PM"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sun",
    size: 12
  }), "6:48 AM")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: "var(--fw-semibold)"
    }
  }, "6 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, "HRS"), " 32 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, "MIN")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-tertiary)",
      marginTop: 2
    }
  }, "Daily asleep average \u203A"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "14px 0 6px",
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Dream Longer, Live Stronger"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 16px",
      fontSize: "var(--fs-caption)",
      color: "var(--text-secondary)",
      lineHeight: "var(--lh-normal)"
    }
  }, "Your body and mind need time to recover, just like charging your phone. With 5h32m, you're running on low battery. Try giving yourself 7\u20139 hours tonight \u2014 more dreams, better mood, stronger you tomorrow!")), /*#__PURE__*/React.createElement(MonthChart, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 8,
      margin: "12px 0"
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ["Sleep duration", "Sleep time"]
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "6px 0 10px",
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "Added Data For The Month"), /*#__PURE__*/React.createElement(Card, {
    radius: "var(--radius-lg)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-micro)",
      textTransform: "uppercase",
      letterSpacing: "var(--ls-caps)",
      color: "var(--text-tertiary)"
    }
  }, "Avg asleep"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "2px 0 6px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-title-3)",
      fontWeight: "var(--fw-semibold)"
    }
  }, "8h 30min"), /*#__PURE__*/React.createElement(Badge, null, "10:30 PM - 7:15 AM")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, null, "Dec 11 - Dec 17"), /*#__PURE__*/React.createElement(Badge, null, "From APPLE HEALTH"))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16,
    color: "var(--text-tertiary)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--line-hairline)",
      margin: "12px 0"
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "none",
      border: "none",
      color: "var(--text-primary)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--fs-body-sm)",
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14,
    color: "var(--blue-300)"
  }), "Add Data")));
}
Object.assign(window, {
  SleepScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile-app/SleepScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.DotNumber = __ds_scope.DotNumber;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Legend = __ds_scope.Legend;

__ds_ns.ListRow = __ds_scope.ListRow;

__ds_ns.MetricRow = __ds_scope.MetricRow;

__ds_ns.ProgressDial = __ds_scope.ProgressDial;

__ds_ns.StackedBar = __ds_scope.StackedBar;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.OtpInput = __ds_scope.OtpInput;

__ds_ns.SearchField = __ds_scope.SearchField;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.ScreenHeader = __ds_scope.ScreenHeader;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.TabBar = __ds_scope.TabBar;

})();
