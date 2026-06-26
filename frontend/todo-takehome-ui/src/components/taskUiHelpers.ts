import { ApiClientError } from '../api/client';

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const firstValidationMessage = error.errors ? Object.values(error.errors).flat()[0] : null;
    return firstValidationMessage ?? error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function getFieldErrors(errors: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [toCamelCase(field), messages[0] ?? 'Invalid value.']),
  );
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}

function toCamelCase(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}
