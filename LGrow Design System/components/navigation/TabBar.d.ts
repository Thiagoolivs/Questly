import * as React from "react";

export interface TabItem { id: string; icon: string }

/**
 * Floating four-up tab bar: glass capsule, circular buttons, active tab inverts to white.
 * @startingPoint section="Navigation" subtitle="Tab bar, segmented control, screen header" viewport="700x240"
 */
export interface TabBarProps extends React.HTMLAttributes<HTMLElement> {
  tabs?: TabItem[];
  active?: string;
  onChange?: (id: string) => void;
}

export declare function TabBar(props: TabBarProps): JSX.Element;
