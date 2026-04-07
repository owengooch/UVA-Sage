/** Merge local + remote completion lists (dedupe, stable sort). */
export function mergeCompletionLists(local: string[] | undefined, remote: string[] | undefined): string[] {
  return Array.from(new Set([...(local ?? []), ...(remote ?? [])])).sort();
}
