import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiClientError, completeTask, createTask, deleteTask, listTasks, updateTask } from '../api/client';
import type { TaskRequest, TodoTask } from '../types/tasks';

const TASK_TITLE_MAX_LENGTH = 200;
const TASK_DESCRIPTION_MAX_LENGTH = 2000;
const TASK_TITLE_LIMIT_REACHED_MESSAGE = 'Title limit reached: 200 characters.';
const TASK_DESCRIPTION_LIMIT_REACHED_MESSAGE = 'Description limit reached: 2000 characters.';

export function TaskBoard() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTaskId, setPendingTaskId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    listTasks()
      .then((loadedTasks) => {
        if (!isMounted) {
          return;
        }

        setTasks(loadedTasks);
        setError(null);
      })
      .catch((requestError) => {
        if (!isMounted) {
          return;
        }

        setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreate(request: TaskRequest) {
    const createdTask = await createTask(request);
    setTasks((currentTasks) => [...currentTasks, createdTask]);
  }

  async function handleUpdate(request: TaskRequest) {
    if (!editingTask) {
      return;
    }

    const updatedTask = await updateTask(editingTask.id, request);
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
    setEditingTask(null);
  }

  async function handleToggleComplete(task: TodoTask) {
    setPendingTaskId(task.id);
    setError(null);

    try {
      const updatedTask = await completeTask(task.id, { isComplete: !task.isComplete });
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) => (currentTask.id === updatedTask.id ? updatedTask : currentTask)),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingTaskId(null);
    }
  }

  async function handleDelete(task: TodoTask) {
    setPendingTaskId(task.id);
    setError(null);

    try {
      await deleteTask(task.id);
      setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));

      if (editingTask?.id === task.id) {
        setEditingTask(null);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingTaskId(null);
    }
  }

  return (
    <section className="task-layout">
      <TaskForm
        key={editingTask?.id ?? 'create'}
        initialTask={editingTask}
        onCancel={editingTask ? () => setEditingTask(null) : undefined}
        onSubmit={editingTask ? handleUpdate : handleCreate}
      />

      <section className="panel task-list-panel">
        <div className="section-heading">
          <div>
            <h2>Tasks</h2>
            <p className="muted">Create, edit, delete, and complete your tasks.</p>
          </div>
          <span className="task-count">{tasks.length}</span>
        </div>

        {isLoading ? <p className="status-message">Loading tasks...</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {!isLoading && !error && tasks.length === 0 ? (
          <p className="empty-state">No tasks yet. Create your first task.</p>
        ) : null}

        <ul className="task-list">
          {tasks.map((task) => {
            const isPending = pendingTaskId === task.id;

            return (
              <li className="task-item" key={task.id}>
                <div className="task-item__content">
                  <label className="complete-toggle">
                    <input
                      checked={task.isComplete}
                      disabled={isPending}
                      onChange={() => void handleToggleComplete(task)}
                      type="checkbox"
                    />
                    <span className={task.isComplete ? 'task-title task-title--complete' : 'task-title'}>
                      {task.title}
                    </span>
                  </label>
                  {task.description ? <p>{task.description}</p> : null}
                  {task.dueDate ? <p className="muted">Due {formatDate(task.dueDate)}</p> : null}
                </div>
                <div className="task-actions">
                  <button
                    className="secondary-button"
                    disabled={isPending}
                    onClick={() => setEditingTask(task)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="danger-button"
                    disabled={isPending}
                    onClick={() => void handleDelete(task)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}

type TaskFormProps = {
  initialTask: TodoTask | null;
  onCancel?: () => void;
  onSubmit: (request: TaskRequest) => Promise<void>;
};

function TaskForm({ initialTask, onCancel, onSubmit }: TaskFormProps) {
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
          aria-describedby={fieldErrors.description ? 'task-description-error' : descriptionLimitReached ? 'task-description-limit' : undefined}
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

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const firstValidationMessage = error.errors ? Object.values(error.errors).flat()[0] : null;
    return firstValidationMessage ?? error.message;
  }

  return 'Something went wrong. Please try again.';
}

function getFieldErrors(errors: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [toCamelCase(field), messages[0] ?? 'Invalid value.']),
  );
}

function toCamelCase(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}

