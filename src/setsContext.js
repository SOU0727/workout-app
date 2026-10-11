import { createContext, useContext } from "react";

// 全セット(completedAt の古い順)をアプリ全体で1つだけ購読して共有する。
// 各セットには date(Date) と key("YYYY-MM-DD") を付けてある。
export const SetsContext = createContext({ sets: [], loading: true, error: false });

export function useSets() {
  return useContext(SetsContext);
}
