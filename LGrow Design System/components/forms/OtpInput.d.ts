import * as React from "react";

export interface OtpInputProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of cells. LGrow uses 6. */
  length?: number;
  /** Digits entered so far; empty cells render a "-". */
  value?: string;
  onChange?: (value: string) => void;
}

export declare function OtpInput(props: OtpInputProps): JSX.Element;
