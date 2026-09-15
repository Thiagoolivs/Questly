import * as React from "react";

export interface ScreenHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Show the circular back button. Default true. */
  back?: boolean;
  onBack?: () => void;
  /** Trailing slot — usually one or two IconButtons. */
  right?: React.ReactNode;
}

export declare function ScreenHeader(props: ScreenHeaderProps): JSX.Element;
