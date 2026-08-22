import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { CollectionPage } from "../../components/ui/CollectionPage";
import { CompactList } from "../../components/ui/CompactRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { FilterChips, type FilterOption } from "../../components/ui/FilterChips";
import { Icon } from "../../components/ui/Icon";
import { PagedList } from "../../components/ui/PagedList";
import { SearchField } from "../../components/ui/SearchField";
import { countByType, filterProfiles, sortProfiles } from "../../lib/familySelectors";
import { useFamily } from "../../state/familyContext";
import { useManage } from "../../state/manageContext";
import type { FamilyProfile } from "../../types";
import { ProfileFormModal } from "./ProfileFormModal";
import { ProfileRow } from "./ProfileRow";

const ALL = "all";
const TYPES: FamilyProfile["type"][] = ["adult", "child", "baby", "pet"];

function isType(value: string | null): value is FamilyProfile["type"] {
  return TYPES.includes(value as FamilyProfile["type"]);
}

/**
 * Everyone, one row each.
 *
 * A grid of cards was fine for six people and wrong for a household that keeps
 * two grandparents, three children and a dog: cards of different heights, and
 * every one of them printing whatever it had. One row apiece, the nearest thing
 * that wants doing under the name, and twenty to a page.
 *
 * There is no tree, no grouping by household and no "add a relationship".
 * Search and the type filter live in the URL.
 */
export function FamilyPage() {
  const { t } = useTranslation(["family", "common"]);
  const { profiles } = useFamily();
  const { scheduled } = useManage();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FamilyProfile | undefined>(undefined);

  // Quick create links here with `?new=1`; the parameter is consumed so a
  // refresh does not reopen the dialog.
  useEffect(() => {
    if (params.get("new") !== "1") return;
    setCreating(true);
    const next = new URLSearchParams(params);
    next.delete("new");
    setParams(next, { replace: true });
  }, [params, setParams]);

  const typeParam = params.get("type");
  const type = isType(typeParam) ? typeParam : ALL;
  const query = params.get("q") ?? "";

  const setParam = (key: string, value: string): void => {
    const next = new URLSearchParams(params);
    if (value && value !== ALL) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => countByType(profiles), [profiles]);

  const visible = useMemo(
    () =>
      sortProfiles(
        filterProfiles(profiles, {
          type: type === ALL ? undefined : type,
          query: query || undefined,
        })
      ),
    [profiles, type, query]
  );

  /* Only the types this household actually has. */
  const options: FilterOption<string>[] = [
    { value: ALL, label: t("family:filters.all"), count: profiles.length },
    ...TYPES.map((value) => ({
      value,
      label: t(`family:types.${value}`),
      count: counts[value],
    })).filter((option) => option.count > 0),
  ];

  return (
    <>
      <CollectionPage
        title={t("family:title")}
        lead={t("family:lead")}
        action={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="plus" size={15} /> {t("family:addProfile")}
          </Button>
        }
        toolbar={
          profiles.length > 0 ? (
            <>
              {options.length > 2 && (
                <FilterChips
                  label={t("family:filters.type")}
                  options={options}
                  value={type}
                  onChange={(value) => setParam("type", value)}
                />
              )}
              <SearchField
                label={t("family:search")}
                value={query}
                onChange={(value) => setParam("q", value)}
                resultCount={query ? visible.length : undefined}
              />
            </>
          ) : undefined
        }
      >
        {visible.length === 0 ? (
          <EmptyState
            title={query || type !== ALL ? t("family:noMatches") : t("family:empty")}
            hint={query || type !== ALL ? undefined : t("family:emptyHint")}
          />
        ) : (
          <PagedList items={visible} pageSize={20} resetKey={`${type}:${query}`}>
            {(shown) => (
              <CompactList>
                {shown.map((profile) => (
                  <li key={profile.id}>
                    <ProfileRow profile={profile} scheduled={scheduled} onEdit={setEditing} />
                  </li>
                ))}
              </CompactList>
            )}
          </PagedList>
        )}
      </CollectionPage>

      <ProfileFormModal
        show={creating || Boolean(editing)}
        profile={editing}
        onClose={() => {
          setCreating(false);
          setEditing(undefined);
        }}
      />
    </>
  );
}
