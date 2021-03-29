export const removeDuplicates = <T>(values: T[]): T[] => {
  return [...new Set(values)]
}
