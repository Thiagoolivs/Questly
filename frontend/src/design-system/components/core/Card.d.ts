import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  /** bloom paints the signature blue cone wash inside the card. */
  tone?: "card" | "raised" | "glass" | "accent" | "bloom" | "light";
  /** Any radius token. Default --radius-xl (20px). */
  radius?: string;
  /** Inner padding. Default --pad-card (14px). */
  pad?: string;
  /** Adds the soft Blue Glow drop light. */
  glow?: boolean;
}

export declare function Card(props: CardProps): JSX.Element;
