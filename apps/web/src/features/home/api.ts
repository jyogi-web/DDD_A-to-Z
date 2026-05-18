import { apiFetch } from "../../lib/api/client";

export interface HomeCPData {
  total_cp: number;
  today_cp: number;
}

export async function fetchHomeCP(): Promise<HomeCPData> {
  return apiFetch<HomeCPData>("/home");
}
