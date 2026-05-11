export interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export interface ApiError {
  code: string;
  message: string;
  issues?: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface SuccessEnvelope<T> {
  data: T;
}
