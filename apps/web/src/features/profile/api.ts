import { apiFetch } from "../../lib/api/client";

export async function completeInitialProfileAPI(displayName: string): Promise<void> {
  await apiFetch<void>("/profile/complete", {
    method: "POST",
    body: JSON.stringify({ display_name: displayName }),
  });
}
