import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string; leaseId: string }>;
};

export default async function OwnerTenantProfilePage({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/owner/properties/${id}#units-tenants`);
}
