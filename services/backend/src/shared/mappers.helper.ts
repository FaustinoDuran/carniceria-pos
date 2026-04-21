export function mapToModel<T>(Model: new (data: unknown) => T, row: unknown): T {
    return new Model(row)
}
