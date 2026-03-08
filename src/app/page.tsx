import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function HomePage() {
	const session = await getServerAuthSession();

	if (!session) {
		redirect("/login");
	}
	return <AuditInputCard />;

	// redirect(session.role === "manager" ? "/manager/dashboard" : "/auditor/dashboard");
}

/**
 * AuditInputCard provides a tactile, sun-ready audit section.
 * Step 1: Render the card shell and header.
 * Step 2: Capture structured text input and notes.
 * Step 3: Provide an offline checkbox with clear affordance.
 */
export function AuditInputCard() {
	// Step 1: Wrap the section in the resilient card shell.
	return (
		<section className="field-card" aria-labelledby="audit-swing-title">
			<div className="field-card-body">
				{/* Step 2: Provide the section header and context. */}
				<div className="space-y-1">
					<h3 id="audit-swing-title" className="field-card-title">
						Swing Set Condition
					</h3>
					<p className="field-card-meta">
						Record what you see and feel while inspecting the set.
					</p>
				</div>
				{/* Step 3: Capture the equipment model. */}
				<div className="field-card-section">
					<label htmlFor="swing-model">Equipment Model</label>
					<input
						id="swing-model"
						name="swingModel"
						type="text"
						placeholder="e.g., PlaySpace LS-42"
					/>
				</div>
				{/* Step 4: Capture detailed notes with more vertical space. */}
				<div className="field-card-section">
					<label htmlFor="swing-notes">Inspection Notes</label>
					<textarea
						id="swing-notes"
						name="swingNotes"
						placeholder="Describe wear, clearance, and anchor stability."
					/>
				</div>
				{/* Step 5: Provide a tactile checkbox row for offline syncing. */}
				<div className="field-card-section">
					<div className="flex items-start gap-3 rounded-field border border-border bg-surface-raised p-3 shadow-field">
						<input id="swing-offline" name="swingOffline" type="checkbox" />
						<div className="space-y-1">
							<label htmlFor="swing-offline" className="cursor-pointer">
								Save offline while walking
							</label>
							<p className="text-sm text-muted-foreground">
								Syncs automatically when a signal is available.
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}