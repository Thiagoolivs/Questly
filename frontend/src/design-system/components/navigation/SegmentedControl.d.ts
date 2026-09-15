import * as React from "react";

export interface SegmentOption { label?: string; value?: string }

export interface SegmentedControlProps extends React.HTMLAttributes<HTMLDivElement> {
  options: Array<SegmentOption | string>;
  value?: string;
  onChange?: (value: string) => void;
  /** pill = capsule inside cards (Today/Weekly). underline = screen-level tabs (Overview/Metrics). */
  variant?: "pill" | "underline";
}

export declare function SegmentedControl(props: SegmentedControlProps): JSX.Element;
