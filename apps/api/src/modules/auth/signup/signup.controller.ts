import { Request, Response } from "express";
import { asyncHandler } from "../../../shared/utils/asyncHandler";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  // Signup logic here
  res.json({
    success: true,
    message: "Signup route handler",
  });
});
