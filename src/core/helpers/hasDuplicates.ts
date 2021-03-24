export const hasDuplicates = (values: unknown[]) => {
  return new Set(values).size !== values.length
}
