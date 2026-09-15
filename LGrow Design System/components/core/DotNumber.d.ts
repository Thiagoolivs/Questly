import * as React from "react";

/**
 * Dot-matrix metric readout set in Doto — LGrow's signature numeric treatment.
 */
export interface DotNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: React.ReactNode;
  size?: "sm" | "md" | "lg" | "hero" | string;
  /** Trailing unit, rendered small, uppercase and tertiary: MIN, SEC, %, HRS. */
  unit?: string;
  color?: string;
}

export declare function DotNumber(props: DotNumberProps): JSX.Element;
