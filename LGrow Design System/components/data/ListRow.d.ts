import * as React from "react";

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: string;
  title: React.ReactNode;
  /** Right-aligned secondary text. */
  meta?: React.ReactNode;
  /** Right-aligned count, e.g. 216 progress photos. */
  count?: number | string;
  /** Destructive styling (Log Out). */
  danger?: boolean;
}

export declare function ListRow(props: ListRowProps): JSX.Element;
