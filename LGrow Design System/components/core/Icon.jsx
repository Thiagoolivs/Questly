import React from "react";

const BASE = "https://unpkg.com/lucide-static@0.454.0/icons/";

/* Lucide (static SVG, CDN) stands in for LGrow's icon set — the source case
   study shipped no icon files. Rendered as a CSS mask so glyphs inherit colour. */
export function Icon({ name, size = 20, color = "currentColor", style, ...rest }) {
  const url = BASE + name + ".svg";
  return (
    <span
      aria-hidden="true"
      {...rest}
      style={{
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
        ...style,
      }}
    />
  );
}
