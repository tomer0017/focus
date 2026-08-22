import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../../components/ui/EmptyState";
import { Icon } from "../../components/ui/Icon";
import { PageHeader } from "../../components/ui/PageHeader";
import { sortProfiles } from "../../lib/familySelectors";
import { useFamily } from "../../state/familyContext";
import { useManage } from "../../state/manageContext";
import { ProfileCard } from "./ProfileCard";
import { ProfileFormModal } from "./ProfileFormModal";

/**
 * Everyone, as a grid of compact cards.
 *
 * There is no tree, no grouping by household and no "add a relationship". The
 * order is people before animals and then alphabetical, which is enough
 * structure for a list that will never be longer than a dozen.
 */
export function FamilyPage() {
  const { t } = useTranslation(["family", "common"]);
  const { profiles, logs } = useFamily();
  const { scheduled } = useManage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [creating, setCreating] = useState(false);

  // Quick create links here with `?new=1`; the parameter is consumed so a
  // refresh does not reopen the dialog.
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setCreating(true);
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const ordered = useMemo(() => sortProfiles(profiles), [profiles]);

  return (
    <>
      <PageHeader
        title={t("family:title")}
        lead={t("family:lead")}
        action={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} /> {t("family:addProfile")}
          </Button>
        }
      />

      {ordered.length === 0 ? (
        <EmptyState title={t("family:empty")} hint={t("family:emptyHint")} />
      ) : (
        <div className="focus-profile-grid">
          {ordered.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              scheduled={scheduled}
              logs={logs}
            />
          ))}
        </div>
      )}

      <ProfileFormModal show={creating} onClose={() => setCreating(false)} />
    </>
  );
}
