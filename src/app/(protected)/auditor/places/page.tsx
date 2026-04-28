import { redirect } from "next/navigation";

/**
 * Auditors do not have a standalone places page.
 * Assigned places are shown on the auditor dashboard.
 */
export default function AuditorPlacesRedirect() {
	redirect("/auditor/dashboard");
}
