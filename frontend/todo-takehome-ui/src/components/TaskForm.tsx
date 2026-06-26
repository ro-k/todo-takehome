import { useState } from 'react';
import type { FormEvent } from 'react';
import { ApiClientError } from '../api/client';
import type { TaskRequest, TodoTask } from '../types/tasks';
import { getErrorMessage, getFieldErrors } from './taskUiHelpers';

const TASK_TITLE_MAX_LENGTH = 200;
const TASK_DESCRIPTION_MAX_LENGTH = 2000;
const TASK_TITLE_LIMIT_REACHED_MESSAGE = 'Title limit reached: 200 characters.';
const TASK_DESCRIPTION_LIMIT_REACHED_MESSAGE = 'Description limit reached: 2000 characters.';

type TaskFormProps = {
  initialTask: TodoTask | null;
  onCancel?: () => void;
  onSubmit: (request: TaskRequest) => Promise<void>;
};

export function TaskForm({ initialTask, onCancel, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(initialTask?.description ?? '');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) {
      setFieldErrors({ title: 'Title is required.' });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit({
        title: trimmedTitle,
        description: trimmedDescription || null,
        dueDate: dueDate || null,
      });

      if (!initialTask) {
        setTitle('');
        setDescription('');
        setDueDate('');
      }
    } catch (requestError) {
      if (requestError instanceof ApiClientError && requestError.errors) {
        setFieldErrors(getFieldErrors(requestError.errors));
        return;
      }

      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const titleLimitReached = title.length === TASK_TITLE_MAX_LENGTH;
  const descriptionLimitReached = description.length === TASK_DESCRIPTION_MAX_LENGTH;

  return (
    <form className="panel task-form" onSubmit={handleSubmit}>
      <h2>{initialTask ? 'Edit task' : 'Create task'}</h2>

      <label>
        Title
        <input
          aria-describedby={fieldErrors.title ? 'task-title-error' : titleLimitReached ? 'task-title-limit' : undefined}
          aria-invalid={Boolean(fieldErrors.title)}
          disabled={isSubmitting}
          maxLength={TASK_TITLE_MAX_LENGTH}
          onChange={(event) => {
            setTitle(event.target.value);
            setFieldErrors((currentErrors) => ({ ...currentErrors, title: '' }));
          }}
          required
          value={title}
        />
      </label>
      {fieldErrors.title ? (
        <p className="field-error" id="task-title-error">
          {fieldErrors.title}
        </p>
      ) : null}
      {!fieldErrors.title && titleLimitReached ? (
        <p className="field-note" id="task-title-limit">
          {TASK_TITLE_LIMIT_REACHED_MESSAGE}
        </p>
      ) : null}

      <label>
        Description
        <textarea
          aria-describedby={
            fieldErrors.description
              ? 'task-description-error'
              : descriptionLimitReached
                ? 'task-description-limit'
                : undefined
          }
          aria-invalid={Boolean(fieldErrors.description)}
          disabled={isSubmitting}
          maxLength={TASK_DESCRIPTION_MAX_LENGTH}
          onChange={(event) => {
            setDescription(event.target.value);
            setFieldErrors((currentErrors) => ({ ...currentErrors, description: '' }));
          }}
          rows={4}
          value={description}
        />
      </label>
      {fieldErrors.description ? (
        <p className="field-error" id="task-description-error">
          {fieldErrors.description}
        </p>
      ) : null}
      {!fieldErrors.description && descriptionLimitReached ? (
        <p className="field-note" id="task-description-limit">
          {TASK_DESCRIPTION_LIMIT_REACHED_MESSAGE}
        </p>
      ) : null}

      <label>
        Due date
        <input
          disabled={isSubmitting}
          onChange={(event) => setDueDate(event.target.value)}
          type="date"
          value={dueDate}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Saving...' : initialTask ? 'Save changes' : 'Create task'}
        </button>
        {onCancel ? (
          <button className="secondary-button" disabled={isSubmitting} onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
