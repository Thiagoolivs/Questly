import * as React from "react";

/**
 * LGrow's action button: white-on-black primary, Blue Glow accent, dark secondary.
 * @startingPoint section="Core" subtitle="Buttons, icon buttons, badges and chips" viewport="700x260"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  /** primary = full white (the app's default CTA). accent = Blue Glow. */
  variant?: "primary" | "accent" | "secondary" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  /** Stretch to the container width — how every screen-bottom CTA is used. */
  fullWidth?: boolean;
  /** Force a fully rounded capsule (used for small in-list actions like "GET"). */
  pill?: boolean;
  /** Lucide icon name rendered before the label. */
  iconLeft?: string;
  /** Lucide icon name rendered after the label. */
  iconRight?: string;
  disabled?: boolean;
}

export declare function Button(props: ButtonProps): JSX.Element;
