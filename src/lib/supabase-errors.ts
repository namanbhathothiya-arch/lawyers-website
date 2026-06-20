export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isMissingSupabaseTableError(error: unknown, tableName: string) {
  const message = getErrorMessage(error).toLowerCase();
  const normalizedTableName = tableName.toLowerCase();
  return (
    message.includes("schema cache") &&
    (message.includes(`table '${normalizedTableName}'`) ||
      message.includes(`table 'public.${normalizedTableName}'`)) &&
    message.includes("could not find")
  );
}
