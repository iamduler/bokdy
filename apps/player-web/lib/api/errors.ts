import catalog from "@bokdy/config/error-codes.json";

export type EnvelopeErrorCode = (typeof catalog.envelope)[number];
export type DetailErrorCode = (typeof catalog.details)[number];
export type ErrorCode = EnvelopeErrorCode | DetailErrorCode;

const known = new Set<string>([...catalog.envelope, ...catalog.details]);

export type ErrorDetail = { field: string; code: string; message: string };

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ErrorDetail[];

  constructor(code: string, message: string, status: number, details: ErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ErrorEnvelope = {
  code?: string;
  message?: string;
  details?: ErrorDetail[];
};

export function apiErrorFromBody(json: unknown, status: number): ApiError {
  const body = (json ?? {}) as ErrorEnvelope;
  return new ApiError(body.code ?? "INTERNAL", body.message ?? "", status, body.details ?? []);
}

export async function readApiError(res: Response): Promise<ApiError> {
  const json = await res.json().catch(() => ({}));
  return apiErrorFromBody(json, res.status);
}

export function errorMessageKey(err: ApiError): ErrorCode {
  const key = err.details[0]?.code || err.code || "INTERNAL";
  return known.has(key) ? (key as ErrorCode) : "INTERNAL";
}
