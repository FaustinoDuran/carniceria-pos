export function serializeResource(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value
    }

    if (value instanceof Date) {
        return value.toISOString()
    }

    if (Array.isArray(value)) {
        return value.map((item) => serializeResource(item))
    }

    if (typeof value !== 'object') {
        return value
    }

    const prototype = Object.getPrototypeOf(value)
    const descriptors = prototype && prototype !== Object.prototype
        ? Object.getOwnPropertyDescriptors(prototype)
        : {}
    const getterNames = Object.entries(descriptors)
        .filter(([name, descriptor]) => name !== 'constructor' && typeof descriptor.get === 'function')
        .map(([name]) => name)

    if (getterNames.length > 0) {
        return getterNames.reduce<Record<string, unknown>>((result, key) => {
            result[key] = serializeResource((value as Record<string, unknown>)[key])
            return result
        }, {})
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((result, [key, item]) => {
        result[key] = serializeResource(item)
        return result
    }, {})
}
