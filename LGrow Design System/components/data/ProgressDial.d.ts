import * as React from "react";

export interface ProgressDialProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  /** Centre readout — set in Doto. */
  label?: React.ReactNode;
  /** Small caption under the readout. */
  sublabel?: React.ReactNode;
  size?: number;
  thickness?: number;
  color?: string;
  track?: string;
  /** Total sweep in degrees: 300 for the workout timer, 220 for the sleep gauge. */
  sweep?: number;
  children?: React.ReactNode;
}

export declare function ProgressDial(props: ProgressDialProps): JSX.Element;
