import { useEffect, useState } from 'react';
import { completeTask, createTask, deleteTask, listTasks, updateTask } from '../api/client';
import type { TaskRequest, TodoTask } from '../types/tasks';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { getErrorMessage } from './taskUiHelpers';

export function TaskBoard() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
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
    setIsCreateFormOpen(false);
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

  function handleStartCreate() {
    setEditingTask(null);
    setIsCreateFormOpen(true);
  }

  function handleCancelForm() {
    setEditingTask(null);
    setIsCreateFormOpen(false);
  }

  function handleStartEdit(task: TodoTask) {
    setIsCreateFormOpen(false);
    setEditingTask(task);
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

  const visibleTasks = showCompleted ? tasks : tasks.filter((task) => !task.isComplete);
  const completedTaskCount = tasks.filter((task) => task.isComplete).length;

  return (
    <section className="task-layout">
      {editingTask || isCreateFormOpen ? (
        <TaskForm
          key={editingTask?.id ?? 'create'}
          initialTask={editingTask}
          onCancel={handleCancelForm}
          onSubmit={editingTask ? handleUpdate : handleCreate}
        />
      ) : (
        <section className="panel task-form-prompt">
          <h2>New task</h2>
          <p className="muted">Add a task when you are ready to capture the next thing.</p>
          <button onClick={handleStartCreate} type="button">
            New task
          </button>
        </section>
      )}

      <TaskList
        completedTaskCount={completedTaskCount}
        error={error}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={handleStartEdit}
        onToggleCompletedVisibility={() => setShowCompleted((currentValue) => !currentValue)}
        onToggleComplete={handleToggleComplete}
        pendingTaskId={pendingTaskId}
        showCompleted={showCompleted}
        tasks={visibleTasks}
        totalTaskCount={tasks.length}
      />
    </section>
  );
}
