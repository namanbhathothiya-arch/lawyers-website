export function getErrorMessage(error: unknown): string {
  if (!error) return "Unknown error occurred";
  if (typeof error === "string") return error;

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const errObj = error as Record<string, unknown>;

    if (typeof errObj.message === "string" && errObj.message.trim()) {
      return errObj.message;
    }
    if (typeof errObj.error_description === "string" && errObj.error_description.trim()) {
      return errObj.error_description;
    }
    if (typeof errObj.details === "string" && errObj.details.trim()) {
      return errObj.details;
    }
    if (typeof errObj.hint === "string" && errObj.hint.trim()) {
      return errObj.hint;
    }
    try {
      const str = JSON.stringify(error);
      if (str !== "{}" && str !== "[]") {
        return str;
      }
    } catch {
      // Fall through
    }
  }

  const str = String(error);
  return str === "[object Object]" ? "An unexpected database error occurred." : str;
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

export function parseLawyerDeleteError(error: unknown): string {
  const msg = getErrorMessage(error);
  const lowerMsg = msg.toLowerCase();

  if (
    lowerMsg.includes("appointments_doctor_id_fkey") ||
    lowerMsg.includes("consultations_lawyer_id_fkey") ||
    (lowerMsg.includes("foreign key constraint") &&
      (lowerMsg.includes("consultations") || lowerMsg.includes("appointments"))) ||
    (lowerMsg.includes("violates foreign key constraint") &&
      (lowerMsg.includes("consultations") || lowerMsg.includes("appointments")))
  ) {
    return "This lawyer has historical consultations and cannot be permanently deleted. Archive/deactivate the lawyer instead so historical records remain intact.";
  }

  if (
    lowerMsg.includes("foreign key constraint") ||
    lowerMsg.includes("violates foreign key") ||
    lowerMsg.includes("23503")
  ) {
    return "Lawyer could not be deleted because another record still references this lawyer. Archive the lawyer instead.";
  }

  if (!msg || msg === "[object Object]") {
    return "Failed to delete lawyer due to a database constraint. Please try archiving the lawyer instead.";
  }

  return msg;
}

