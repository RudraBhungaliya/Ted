import { Request, Response, NextFunction } from "express";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): Response => {
    console.error(err);

    return res.status(500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};
