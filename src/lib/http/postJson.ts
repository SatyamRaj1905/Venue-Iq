export const DEFAULT_POST_JSON_TIMEOUT_MS = 14_000;

export type PostJsonFailure =
  | Readonly<{ ok: false; kind: "http-error"; status: number }>
  | Readonly<{ ok: false; kind: "invalid-response" }>
  | Readonly<{ ok: false; kind: "timeout" }>
  | Readonly<{ ok: false; kind: "network-error" }>;

export type PostJsonResult<T> = Readonly<{ ok: true; data: T }> | PostJsonFailure;

export interface RuntimeSchema<T> {
  safeParse(value: unknown): Readonly<{ success: true; data: T }> | Readonly<{ success: false }>;
}

export type RuntimeSchemaSource<T> = RuntimeSchema<T> | (() => Promise<RuntimeSchema<T>>);

interface PostJsonOptions<T> {
  readonly url: string;
  readonly body: unknown;
  /** A lazy source keeps validation libraries out of the initial browser bundle. */
  readonly responseSchema: RuntimeSchemaSource<T>;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  /** Injectable to keep transport behavior independently testable. */
  readonly fetcher?: typeof fetch;
}

async function validateResponse<T>(
  source: RuntimeSchemaSource<T>,
  payload: unknown,
): Promise<PostJsonResult<T>> {
  try {
    const schema = typeof source === "function" ? await source() : source;
    const validation = schema.safeParse(payload);
    return validation.success
      ? { ok: true, data: validation.data }
      : { ok: false, kind: "invalid-response" };
  } catch {
    return { ok: false, kind: "invalid-response" };
  }
}

/**
 * Posts JSON through one bounded, runtime-validated browser API boundary.
 * Error details deliberately stay internal so callers render stable safe copy.
 */
export async function postJson<T>(options: PostJsonOptions<T>): Promise<PostJsonResult<T>> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_POST_JSON_TIMEOUT_MS;
  let timedOut = false;

  const abortFromCaller = (): void => controller.abort();
  if (options.signal?.aborted === true) {
    controller.abort();
  } else {
    options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    let response: Response;
    try {
      response = await (options.fetcher ?? globalThis.fetch)(options.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options.body),
        signal: controller.signal,
      });
    } catch {
      return timedOut ? { ok: false, kind: "timeout" } : { ok: false, kind: "network-error" };
    }

    if (!response.ok) {
      return { ok: false, kind: "http-error", status: response.status };
    }

    let payload: unknown;
    try {
      payload = (await response.json()) as unknown;
    } catch {
      return timedOut ? { ok: false, kind: "timeout" } : { ok: false, kind: "invalid-response" };
    }

    return validateResponse(options.responseSchema, payload);
  } finally {
    globalThis.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}
