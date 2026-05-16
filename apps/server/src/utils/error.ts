export class AppError extends Error {
    statusCode : number;

    constructor(
        message : string,
        statusCode = 500,
    ){
        super(message);
        this.statusCode = statusCode;
    }
}

export class UnauthorizedError extends AppError{
    constructor(
        message = "Unauthorized",
    ){
        super(message, 401);
    }
}

export class BadRequestError extends AppError{
    constructor(
        message = "Bad Request"
    ){
        super(message, 400);
    }
}

export class NotFoundError extends AppError{
    constructor(
        message = "Not Found"
    ){
        super(message, 403);
    }
}