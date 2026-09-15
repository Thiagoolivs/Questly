import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  tone?: "neutral" | "outline" | "accent" | "success" | "danger" | "light";
  /** Uppercase + wide tracking — the case-study eyebrow treatment. */
  caps?: boolean;
}

export declare function Badge(props: BadgeProps): JSX.Element;
