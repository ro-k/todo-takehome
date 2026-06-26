import type { TodoTask } from '../types/tasks';
import { formatDate } from './taskUiHelpers';

type TaskListItemProps = {
  isPending: boolean;
  onDelete: (task: TodoTask) => Promise<void>;
  onEdit: (task: TodoTask) => void;
  onToggleComplete: (task: TodoTask) => Promise<void>;
  task: TodoTask;
};

export function TaskListItem({ isPending, onDelete, onEdit, onToggleComplete, task }: TaskListItemProps) {
  return (
    <li className="task-item">
      <div className="task-item__content">
        <label className="complete-toggle">
          <input
            checked={task.isComplete}
            disabled={isPending}
            onChange={() => void onToggleComplete(task)}
            type="checkbox"
          />
          <span className={task.isComplete ? 'task-title task-title--complete' : 'task-title'}>{task.title}</span>
        </label>
        {task.description ? <p>{task.description}</p> : null}
        {task.dueDate ? <p className="muted">Due {formatDate(task.dueDate)}</p> : null}
      </div>
      <div className="task-actions">
        <button className="secondary-button" disabled={isPending} onClick={() => onEdit(task)} type="button">
          Edit
        </button>
        <button className="danger-button" disabled={isPending} onClick={() => void onDelete(task)} type="button">
          Delete
        </button>
      </div>
    </li>
  );
}
