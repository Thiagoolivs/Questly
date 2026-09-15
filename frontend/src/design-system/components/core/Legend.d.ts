import * as React from "react";

export interface LegendItem { label: string; color: string }

export interface LegendProps extends React.HTMLAttributes<HTMLDivElement> {
  items: LegendItem[];
}

export declare function Legend(props: LegendProps): JSX.Element;
