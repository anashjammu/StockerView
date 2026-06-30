export type ApiResponseStatus = "live" | "delayed" | "cached" | "partial" | "unavailable" | "error";

export type ApiResponse<T> = {
  data: T;
  source: string;
  status: ApiResponseStatus;
  delay: string;
  updatedAt: string;
  error?: string;
};

type SuccessOptions = {
  source?: string;
  status?: Exclude<ApiResponseStatus, "error">;
  delay?: string;
  updatedAt?: string;
};

type ErrorOptions<T> = {
  source?: string;
  delay?: string;
  updatedAt?: string;
  data?: T;
};

export function successResponse<T>(data: T, options: SuccessOptions = {}): ApiResponse<T> {
  return {
    data,
    source: options.source ?? "Unavailable",
    status: options.status ?? "unavailable",
    delay: options.delay ?? "N/A",
    updatedAt: options.updatedAt ?? new Date().toISOString()
  };
}

export function errorResponse<T = null>(error: string, options: ErrorOptions<T | null> = {}): ApiResponse<T | null> {
  return {
    data: options.data ?? null,
    source: options.source ?? "Unavailable",
    status: "error",
    delay: options.delay ?? "N/A",
    updatedAt: options.updatedAt ?? new Date().toISOString(),
    error
  };
}
