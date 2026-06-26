import type { TodoTask } from '../types/tasks';
import { TaskListItem } from './TaskListItem';

type TaskListProps = {
  completedTaskCount: number;
  error: string | null;
  isLoading: boolean;
  onDelete: (task: TodoTask) => Promise<void>;
  onEdit: (task: TodoTask) => void;
  onToggleCompletedVisibility: () => void;
  onToggleComplete: (task: TodoTask) => Promise<void>;
  pendingTaskId: number | null;
  showCompleted: boolean;
  tasks: TodoTask[];
  totalTaskCount: number;
};

export function TaskList({
  completedTaskCount,
  error,
  isLoading,
  onDelete,
  onEdit,
  onToggleCompletedVisibility,
  onToggleComplete,
  pendingTaskId,
  showCompleted,
  tasks,
  totalTaskCount,
}: TaskListProps) {
  const hasHiddenCompletedTasks = !showCompleted && completedTaskCount > 0;
  const emptyStateMessage = hasHiddenCompletedTasks
    ? 'No active tasks. Completed tasks are hidden.'
    : 'No tasks yet. Create your first task.';

  return (
    <section className="panel task-list-panel">
      <div className="section-heading">
        <div>
          <h2>Tasks</h2>
          <p className="muted">Create, edit, delete, and complete your tasks.</p>
        </div>
        <div className="section-heading__actions">
          <span className="task-count">{showCompleted ? totalTaskCount : tasks.length}</span>
          {completedTaskCount > 0 ? (
            <label className="task-filter-toggle">
              <input checked={showCompleted} onChange={onToggleCompletedVisibility} type="checkbox" />
              Show completed
            </label>
          ) : null}
        </div>
      </div>

      {isLoading ? <p className="status-message">Loading tasks...</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {!isLoading && !error && tasks.length === 0 ? (
        <p className="empty-state">{emptyStateMessage}</p>
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
