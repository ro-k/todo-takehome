export type User = {
  id: number;
  email: string;
};

export type AuthResponse = {
  user: User;
};

export type AuthRequest = {
  email: string;
  password: string;
};

export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
};
