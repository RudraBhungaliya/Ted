// Global type definitions for the application

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AudioFile {
  id: string;
  fileName: string;
  size: number;
  transcription?: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  recording?: string;
}
