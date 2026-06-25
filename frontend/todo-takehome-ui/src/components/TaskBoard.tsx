import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiClientError, completeTask, createTask, deleteTask, listTasks, updateTask } from '../api/client';
import type { TaskRequest, TodoTask } from '../types/tasks';

export function TaskBoard() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    const updatedTask = await completeTask(task.id, { isComplete: !task.isComplete });
    setTasks((currentTasks) =>
      currentTasks.map((currentTask) => (currentTask.id === updatedTask.id ? updatedTask : currentTask)),
    );
  }

  async function handleDelete(task: TodoTask) {
    await deleteTask(task.id);
    setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));

    if (editingTask?.id === task.id) {
      setEditingTask(null);
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
          {tasks.map((task) => (
            <li className="task-item" key={task.id}>
              <div className="task-item__content">
                <label className="complete-toggle">
                  <input
                    checked={task.isComplete}
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
                <button className="secondary-button" onClick={() => setEditingTask(task)} type="button">
                  Edit
                </button>
                <button className="danger-button" onClick={() => void handleDelete(task)} type="button">
                  Delete
                </button>
              </div>
            </li>
          ))}
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title,
        description: description.trim() ? description : null,
        dueDate: dueDate || null,
      });

      if (!initialTask) {
        setTitle('');
        setDescription('');
        setDueDate('');
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="panel task-form" onSubmit={handleSubmit}>
      <h2>{initialTask ? 'Edit task' : 'Create task'}</h2>

      <label>
        Title
        <input
          disabled={isSubmitting}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>

      <label>
        Description
        <textarea
          disabled={isSubmitting}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          value={description}
        />
      </label>

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}

