"use client";

import { Button, Spinner } from "@bokdy/ui";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { usePageShellTitle } from "@/components/shell/shell-title";
import {
  UserDetailProvider,
  type UserDetailRecord,
} from "@/components/users/detail/user-detail-context";
import { UserAccountForm } from "@/components/users/user-account-form";
import { useAdminUserDetail } from "@/hooks/use-admin-users";
import { Link } from "@/i18n/navigation";
import type { UserAudience } from "@/lib/api/admin-users";
import { ApiError } from "@/lib/api/errors";

const CREATE_TITLE_KEY = {
  players: "pageTitles.userPlayerCreate",
  owners: "pageTitles.userOwnerCreate",
  admins: "pageTitles.userAdminCreate",
} as const;

const EDIT_TITLE_KEY = {
  players: "pageTitles.userPlayerEdit",
  owners: "pageTitles.userOwnerEdit",
  admins: "pageTitles.userAdminEdit",
} as const;

export function UserAccountCreatePage({ audience }: { audience: UserAudience }) {
  const ts = useTranslations("shell");
  usePageShellTitle(ts(CREATE_TITLE_KEY[audience]));

  return (
    <div className="page-canvas">
      <UserAccountForm audience={audience} mode="create" layout="page" />
    </div>
  );
}

export function UserAccountEditPage({ audience }: { audience: UserAudience }) {
  const ts = useTranslations("shell");
  const t = useTranslations("users");
  const tc = useTranslations("common");
  usePageShellTitle(ts(EDIT_TITLE_KEY[audience]));
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminUserDetail(
    audience,
    id,
  );

  if (isLoading) {
    return (
      <p className="page-canvas flex items-center gap-2 p-4 text-sm text-muted-foreground md:p-6">
        <Spinner />
        {tc("loading")}
      </p>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="page-canvas">
        <div className="m-4 space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 md:m-6">
          <p className="text-sm text-destructive">
            {notFound ? t("notFound") : t("detailLoadError")}
          </p>
          <div className="flex flex-wrap gap-2">
            {!notFound ? (
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                {tc("retry")}
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href={`/users/${audience}`}>{t("backToList")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserDetailProvider user={data as UserDetailRecord} userId={id} audience={audience}>
      <div className="page-canvas">
        <UserAccountForm audience={audience} mode="edit" layout="page" />
      </div>
    </UserDetailProvider>
  );
}
