import type { TodoTask } from '../types/tasks';
import { TaskListItem } from './TaskListItem';

type TaskListProps = {
  error: string | null;
  isLoading: boolean;
  onDelete: (task: TodoTask) => Promise<void>;
  onEdit: (task: TodoTask) => void;
  onToggleComplete: (task: TodoTask) => Promise<void>;
  pendingTaskId: number | null;
  tasks: TodoTask[];
};

export function TaskList({
  error,
  isLoading,
  onDelete,
  onEdit,
  onToggleComplete,
  pendingTaskId,
  tasks,
}: TaskListProps) {
  return (
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
          <TaskListItem
            isPending={pendingTaskId === task.id}
            key={task.id}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggleComplete={onToggleComplete}
            task={task}
          />
        ))}
      </ul>
    </section>
  );
}
