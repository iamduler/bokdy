"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { EntityDetailError, EntityDetailLoading } from "@/components/entity/detail-state";
import { UserDetailProvider } from "@/components/users/detail/user-detail-context";
import { UserDetailHeader } from "@/components/users/detail/user-detail-header";
import { UserDetailSubnav } from "@/components/users/detail/user-detail-subnav";
import { useAdminUserDetail } from "@/hooks/use-admin-users";
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
    return (
      <div className="page-canvas">
        <EntityDetailLoading label={tc("loading")} />
      </div>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="page-canvas">
      <EntityDetailError
        message={notFound ? t("notFound") : t("detailLoadError")}
        notFound={notFound}
        retryLabel={tc("retry")}
        onRetry={() => refetch()}
        retryDisabled={isFetching}
        backHref={`/users/${audience}`}
        backLabel={t("backToList")}
      />
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserDetailProvider user={user} userId={id} audience={audience}>
      <div className="page-canvas flex min-h-full flex-1 flex-col overflow-hidden">
        <UserDetailSubnav />
        <UserDetailHeader />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </UserDetailProvider>
  );
}
