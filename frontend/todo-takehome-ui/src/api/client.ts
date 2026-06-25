import type { ApiError, AuthRequest, AuthResponse } from '../types/auth';
import type { CompleteTaskRequest, TaskRequest, TodoTask } from '../types/tasks';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7043';

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly errors?: Record<string, string[]>;

  public constructor(status: number, apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = apiError.errors;
  }
}

async function request<TResponse>(path: string, options: RequestInit = {}): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new ApiClientError(response.status, await parseError(response));
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

async function parseError(response: Response): Promise<ApiError> {
  const fallback = { message: 'Request failed.' };

  try {
    const body = (await response.json()) as unknown;

    if (isValidationProblem(body)) {
      return {
        message: body.title ?? fallback.message,
        errors: body.errors,
      };
    }

    if (isMessageError(body)) {
      return { message: body.message };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function isValidationProblem(value: unknown): value is { title?: string; errors: Record<string, string[]> } {
  return typeof value === 'object' && value !== null && 'errors' in value;
}

function isMessageError(value: unknown): value is { message: string } {
  return typeof value === 'object' && value !== null && 'message' in value && typeof value.message === 'string';
}

export function register(requestBody: AuthRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

export function login(requestBody: AuthRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

export function logout(): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' });
}

export function getCurrentUser(): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/me');
}

export function listTasks(): Promise<TodoTask[]> {
  return request<TodoTask[]>('/api/tasks');
}

export function createTask(requestBody: TaskRequest): Promise<TodoTask> {
  return request<TodoTask>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

export function updateTask(id: number, requestBody: TaskRequest): Promise<TodoTask> {
  return request<TodoTask>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(requestBody),
  });
}

export function deleteTask(id: number): Promise<void> {
  return request<void>(`/api/tasks/${id}`, { method: 'DELETE' });
}

export function completeTask(id: number, requestBody: CompleteTaskRequest): Promise<TodoTask> {
  return request<TodoTask>(`/api/tasks/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(requestBody),
  });
}
