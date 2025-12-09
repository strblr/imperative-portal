import type { ReactElement } from "react";

export function elementKey(element: ReactElement) {
  return element.key ?? (element.props as { key?: any }).key;
}
