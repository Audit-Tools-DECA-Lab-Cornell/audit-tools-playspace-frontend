import { AcceptInviteForm } from "./accept-invite-form";

type InvitePageParams = {
	token: string;
};

export default async function ManagerInvitePage({ params }: Readonly<{ params: Promise<InvitePageParams> }>) {
	const { token } = await params;
	return <AcceptInviteForm token={token} />;
}
