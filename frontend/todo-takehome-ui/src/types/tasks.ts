export type TodoTask = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TaskRequest = {
  title: string;
  description?: string | null;
  dueDate?: string | null;
};

export type CompleteTaskRequest = {
  isComplete: boolean;
};
