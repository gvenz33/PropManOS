import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string; unitId: string }>;
};

export default async function OwnerUnitProfilePage({ params }: Props) {
  const { id } = await params;
  redirect(`/dashboard/owner/properties/${id}#units-tenants`);
}
