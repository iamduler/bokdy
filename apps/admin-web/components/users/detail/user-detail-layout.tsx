"use client";

import { Button } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { UserDetailProvider } from "@/components/users/detail/user-detail-context";
import { UserDetailHeader } from "@/components/users/detail/user-detail-header";
import { UserDetailSubnav } from "@/components/users/detail/user-detail-subnav";
import { useAdminUserDetail } from "@/hooks/use-admin-users";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/errors";
import type { UserAudience } from "@/lib/api/admin-users";

export function UserDetailLayout({
  audience,
  children,
}: {
  audience: UserAudience;
  children: ReactNode;
}) {
  const t = useTranslations("users");
  const tc = useTranslations("common");
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: user, isLoading, isError, error, refetch, isFetching } = useAdminUserDetail(
    audience,
    id,
  );

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground md:p-6">{tc("loading")}</p>;
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="m-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:m-6">
        <p className="text-sm text-destructive">{notFound ? t("notFound") : t("detailLoadError")}</p>
        <div className="flex flex-wrap gap-2">
          {!notFound ? (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {tc("retry")}
            </Button>
          ) : null}
          <Link
            href={`/users/${audience}`}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
          >
            ← {t("backToList")}
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserDetailProvider user={user} userId={id} audience={audience}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <UserDetailSubnav />
        <UserDetailHeader />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </UserDetailProvider>
  );
}
