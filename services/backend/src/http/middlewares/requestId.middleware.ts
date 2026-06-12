import { randomUUID } from 'crypto'
import { NextFunction, Request, Response } from 'express'

const REQUEST_ID_HEADER = 'X-Request-Id'

export function requestId(req: Request, res: Response, next: NextFunction): void {
    const headerValue = req.header(REQUEST_ID_HEADER)
    const id = headerValue?.trim() || randomUUID()

    res.locals.requestId = id
    res.setHeader(REQUEST_ID_HEADER, id)
    next()
}
