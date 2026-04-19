declare namespace Express {
  interface Request {
    file?: {
      buffer: Buffer;
    };
  }
}
