import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

interface OrganizationLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    organizationSlug: string;
  }>;
}

export default async function OrganizationLayout({
  children,
  params,
}: OrganizationLayoutProps) {
  const { organizationSlug } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select(
      `
      id,
      name,
      slug
    `,
    )
    .eq("slug", organizationSlug)
    .single();

  if (!organization) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      role
    `,
    )
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    notFound();
  }

  return <div className="min-h-screen">{children}</div>;
}
