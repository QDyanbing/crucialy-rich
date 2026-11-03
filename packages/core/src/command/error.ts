export function getCommandErrorReason(error: unknown): string {
  try {
    const message = error instanceof Error ? error.message : undefined;
    return typeof message === "string" ? message : "Command execution failed.";
  } catch {
    return "Command execution failed.";
  }
}
