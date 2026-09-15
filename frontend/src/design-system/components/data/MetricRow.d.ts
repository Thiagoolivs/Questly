import * as React from "react";

/**
 * Value-over-label health metric row: icon tile, bold value, uppercase micro label, chevron.
 * @startingPoint section="Data" subtitle="Metric rows, list rows, dials and stacked bars" viewport="700x300"
 */
export interface MetricRowProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lucide icon name for the leading tile. */
  icon?: string;
  value: React.ReactNode;
  /** Uppercase micro caption, e.g. "WEIGHT (LBS)". */
  label: React.ReactNode;
  /** Small coloured delta next to the value, e.g. "▲10". */
  delta?: React.ReactNode;
  deltaTone?: "success" | "danger";
  /** Override the value colour for status metrics (e.g. High stress in red). */
  valueColor?: string;
  chevron?: boolean;
}

export declare function MetricRow(props: MetricRowProps): JSX.Element;
