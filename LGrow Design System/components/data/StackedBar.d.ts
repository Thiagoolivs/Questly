import * as React from "react";

export interface BarSegment { value: number; color: string; label?: string }

export interface StackedBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ordered segments; widths are proportional to value. */
  segments: BarSegment[];
  height?: number;
  /** Fine vertical hatching inside each segment (the Daily Process treatment). */
  ticks?: boolean;
}

export declare function StackedBar(props: StackedBarProps): JSX.Element;
