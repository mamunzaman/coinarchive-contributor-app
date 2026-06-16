export function runAfterCommit(task: () => void): void {
  void Promise.resolve().then(task)
}
