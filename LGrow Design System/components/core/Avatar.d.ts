import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Photo URL. When absent, initials render on a flat colour. */
  src?: string;
  /** 1–2 uppercase letters, e.g. "AB". */
  initials?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl" | number;
  /** Background colour for the initials variant. */
  color?: string;
  /** Fallback content when there is no src or initials (e.g. a person Icon). */
  children?: React.ReactNode;
  /** Page-coloured ring + blue glow (profile header treatment). */
  ring?: boolean;
}

export declare function Avatar(props: AvatarProps): JSX.Element;
