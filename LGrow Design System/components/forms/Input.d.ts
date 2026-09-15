import * as React from "react";

/**
 * Labelled text field — #292929 fill, 12px radius, 44px tall.
 * @startingPoint section="Forms" subtitle="Text fields, select, search, OTP" viewport="700x300"
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Appends a red asterisk to the label. */
  required?: boolean;
  /** Trailing unit text, e.g. "cm" or "kg". */
  unit?: string;
  /** Trailing Lucide icon, e.g. "calendar". */
  icon?: string;
}

export declare function Input(props: InputProps): JSX.Element;
