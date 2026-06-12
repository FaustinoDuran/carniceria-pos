import { NextFunction, Request, Response } from 'express'
import { ZodType } from 'zod'

function validate(schema: ZodType, source: 'body' | 'query' | 'params') {
    return (req: Request, res: Response, next: NextFunction): void => {
        const parsed = schema.safeParse(req[source])

        if (!parsed.success) {
            next(parsed.error)
            return
        }

        res.locals[source] = parsed.data
        next()
    }
}

export const validateBody = (schema: ZodType) => validate(schema, 'body')
export const validateQuery = (schema: ZodType) => validate(schema, 'query')
export const validateParams = (schema: ZodType) => validate(schema, 'params')
