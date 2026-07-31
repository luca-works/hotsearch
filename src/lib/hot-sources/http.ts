const DEFAULT_TIMEOUT_MS = 8_000;

export type SourceRequestOptions = Omit<RequestInit, 'signal'> & {
  timeoutMs?: number;
};

export class SourceRequestError extends Error {
  readonly status?: number;

  constructor(
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = 'SourceRequestError';
    this.status = status;
  }
}

export const requestJson = async <T>(
  url: string,
  options: SourceRequestOptions = {},
): Promise<T> => {
  const response = await request(url, options);

  try {
    return await response.json() as T;
  } catch (error) {
    throw new SourceRequestError(
      `Upstream returned invalid JSON: ${error instanceof Error ? error.message : 'unknown parse error'}`,
    );
  }
};

export const requestText = async (
  url: string,
  options: SourceRequestOptions = {},
): Promise<string> => {
  const response = await request(url, {
    ...options,
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      ...options.headers,
    },
  });
  return response.text();
};

const request = async (
  url: string,
  options: SourceRequestOptions,
) => {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...requestInit } = options;
  const response = await fetch(url, {
    ...requestInit,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'HotSearch/1.0 (+server-side data adapter)',
      ...headers,
    },
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new SourceRequestError(
      `Upstream returned HTTP ${response.status}`,
      response.status,
    );
  }
  return response;
};
