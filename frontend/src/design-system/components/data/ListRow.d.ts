import * as React from "react";

export interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: string;
  title: React.ReactNode;
  /** Secondary line under the title. */
  subtitle?: React.ReactNode;
  /** Right-aligned secondary text. */
  meta?: React.ReactNode;
  /** Right-aligned count, e.g. 216 progress photos. */
  count?: number | string;
  /** Control rendered at the end of the row (checkbox, switch, button). */
  trailing?: React.ReactNode;
  /** Force the chevron on/off. Defaults to on for clickable rows without `trailing`. */
  chevron?: boolean;
  /** Destructive styling (Log Out). */
  danger?: boolean;
  /** Dims and strikes through the title — used for items already done. */
  muted?: boolean;
  /** Hairline under the row. Default true. */
  divider?: boolean;
}

export declare function ListRow(props: ListRowProps): JSX.Element;
