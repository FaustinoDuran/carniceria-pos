import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { BusinessError, NotFoundError, UnauthorizedError, ValidationError } from '../../shared/errors'

interface ErrorResponse {
    error: {
        code: string
        message: string
        requestId?: string
        details?: Array<{
            path: string
            message: string
        }>
    }
}

function sendError(res: Response, status: number, body: ErrorResponse): void {
    res.status(status).json(body)
}

interface DatabaseError {
    code?: string
}

function isDatabaseError(error: unknown): error is DatabaseError {
    return typeof error === 'object' && error !== null && 'code' in error
}

export function notFoundHandler(req: Request, res: Response): void {
    sendError(res, 404, {
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
            requestId: res.locals.requestId,
        },
    })
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) {
        next(err)
        return
    }

    if (err instanceof ZodError) {
        sendError(res, 400, {
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                requestId: res.locals.requestId,
                details: err.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            },
        })
        return
    }

    if (err instanceof ValidationError) {
        sendError(res, 400, {
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message,
                requestId: res.locals.requestId,
            },
        })
        return
    }

    if (err instanceof NotFoundError) {
        sendError(res, 404, {
            error: {
                code: 'NOT_FOUND',
                message: err.message,
                requestId: res.locals.requestId,
            },
        })
        return
    }

    if (err instanceof UnauthorizedError) {
        sendError(res, 401, {
            error: {
                code: 'UNAUTHORIZED',
                message: err.message,
                requestId: res.locals.requestId,
            },
        })
        return
    }

    if (err instanceof BusinessError) {
        sendError(res, 409, {
            error: {
                code: 'BUSINESS_ERROR',
                message: err.message,
                requestId: res.locals.requestId,
            },
        })
        return
    }

    if (isDatabaseError(err)) {
        if (err.code === '23503') {
            sendError(res, 409, {
                error: {
                    code: 'BUSINESS_ERROR',
                    message: 'Operation cannot be completed because related records exist',
                    requestId: res.locals.requestId,
                },
            })
            return
        }

        if (err.code === '23505') {
            sendError(res, 409, {
                error: {
                    code: 'BUSINESS_ERROR',
                    message: 'A record with the same unique value already exists',
                    requestId: res.locals.requestId,
                },
            })
            return
        }
    }

    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err instanceof Error
            ? err.message
            : 'Internal server error'

    sendError(res, 500, {
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message,
            requestId: res.locals.requestId,
        },
    })
}
