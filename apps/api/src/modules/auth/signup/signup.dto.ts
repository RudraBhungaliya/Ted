export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignupResponse {
  success: boolean;
  userId?: string;
  message: string;
}
