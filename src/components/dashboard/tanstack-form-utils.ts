interface ZodLikeIssue {
	path: readonly PropertyKey[];
	message: string;
}

function getValidationMessageFromSingleError(error: unknown): string | null {
	if (typeof error === "string" && error.trim().length > 0) {
		return error;
	}

	if (Array.isArray(error)) {
		return getValidationMessage(error);
	}

	if (typeof error === "object" && error !== null) {
		if ("message" in error && typeof error.message === "string" && error.message.trim().length > 0) {
			return error.message;
		}

		if ("messages" in error && Array.isArray(error.messages)) {
			return getValidationMessage(error.messages);
		}
	}

	return null;
}

/**
 * Resolve the first readable validation message from TanStack Form field errors.
 */
export function getValidationMessage(errors: unknown[]): string | null {
	for (const error of errors) {
		const validationMessage = getValidationMessageFromSingleError(error);
		if (validationMessage) {
			return validationMessage;
		}
	}

	return null;
}

/**
 * Convert Zod issues into a first-error-per-field map for TanStack Form validators.
 */
export function getZodFieldErrors<TFieldName extends string>(
	issues: readonly ZodLikeIssue[]
): Partial<Record<TFieldName, string>> {
	const fieldErrors: Partial<Record<TFieldName, string>> = {};

	for (const issue of issues) {
		const firstPathSegment = issue.path[0];
		if (typeof firstPathSegment !== "string") {
			continue;
		}

		const fieldName = firstPathSegment as TFieldName;
		if (fieldErrors[fieldName] === undefined) {
			fieldErrors[fieldName] = issue.message;
		}
	}

	return fieldErrors;
}
