import * as React from "react";

export interface SelectOption { label?: string; value?: string }

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  /** Strings or {label,value} objects. */
  options: Array<SelectOption | string>;
  /** Fixed width, e.g. 84 for the dial-code picker. */
  width?: number | string;
}

export declare function Select(props: SelectProps): JSX.Element;
