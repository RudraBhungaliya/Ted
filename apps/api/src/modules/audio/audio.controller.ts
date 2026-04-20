import { Request, Response } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import * as audioService from "./audio.service";

export const uploadActive = asyncHandler(async (req: Request, res: Response) => {
  const result = await audioService.uploadActive(req.file);

  res.json({
    success: true,
    data: result,
  });
});

export const processChunk = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await audioService.processChunk(req.file);

    res.json({ 
      success: true,
      data: result,
    });
  },
);
