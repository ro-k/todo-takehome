import { useEffect, useState } from 'react';
import { completeTask, createTask, deleteTask, listTasks, updateTask } from '../api/client';
import type { TaskRequest, TodoTask } from '../types/tasks';
import { TaskForm } from './TaskForm';
import { TaskList } from './TaskList';
import { getErrorMessage } from './taskUiHelpers';

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

      <TaskList
        error={error}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={setEditingTask}
        onToggleComplete={handleToggleComplete}
        pendingTaskId={pendingTaskId}
        tasks={tasks}
      />
    </section>
  );
}
