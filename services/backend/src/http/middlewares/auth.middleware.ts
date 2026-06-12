import { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose'
import { config } from '../../config'
import { UnauthorizedError } from '../../shared/errors'

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(`${config.auth.issuer}/.well-known/jwks.json`))
    }

    return jwks
}

function extractBearerToken(header: string | undefined): string | null {
    if (!header) {
        return null
    }

    const [scheme, token] = header.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return null
    }

    return token
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!config.auth.enabled) {
        next()
        return
    }

    const token = extractBearerToken(req.header('authorization'))

    if (!token) {
        next(new UnauthorizedError('Missing bearer token'))
        return
    }

    try {
        const { payload } = await jwtVerify(token, getJwks(), {
            issuer: config.auth.issuer,
            audience: config.auth.audience,
        })

        res.locals.auth = payload as JWTPayload
        next()
    } catch {
        next(new UnauthorizedError('Invalid or expired token'))
    }
}
