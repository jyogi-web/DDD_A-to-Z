export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`API error: ${status}`);
    this.status = status;
    this.body = body;
  }
}

/**
 * API へのリクエストを行うユーティリティ関数
 * NOTE: 将来的にgRPCに移行する際にこの関数を置き換えるため薄いラッパを使用している
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init ?? {};
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(initHeaders instanceof Headers
        ? Object.fromEntries(initHeaders.entries())
        : (initHeaders ?? {})),
    },
    ...restInit,
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => null));
  }
  if (res.status === 204) return undefined as T;
  return res.json().catch((e) => {
    throw new ApiError(res.status, e);
  });
}
