import { NextResponse } from 'next/server';
import { ApiErrorCode, ApiResponse } from '@/types/api';

export function ok<T>(data: T, meta?: { page?: number; limit?: number; total?: number }, status = 200) {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return NextResponse.json(body, { status });
}

export function badRequest(code: ApiErrorCode, message: string, details?: unknown) {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status: 400 });
}

export function unauthorized(message = 'Authentication required') {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  };
  return NextResponse.json(body, { status: 401 });
}

export function forbidden(message = 'You are not authorized to perform this action') {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message,
    },
  };
  return NextResponse.json(body, { status: 403 });
}

export function notFound(message = 'Resource not found') {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message,
    },
  };
  return NextResponse.json(body, { status: 404 });
}

export function conflict(code: ApiErrorCode, message: string, details?: unknown) {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status: 409 });
}

export function internalError(message = 'An unexpected server error occurred', details?: unknown) {
  const body: ApiResponse<never> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      ...(details ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status: 500 });
}
