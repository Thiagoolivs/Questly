import * as React from "react";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  /** Selected chip inverts to full white. */
  selected?: boolean;
}

export declare function Chip(props: ChipProps): JSX.Element;
