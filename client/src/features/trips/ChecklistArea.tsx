import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import { useChecklists } from "../../state/checklistsContext";
import { progressOf } from "../../lib/checklist";
import { ChecklistSection } from "../checklist/ChecklistSection";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import type { Trip } from "../../types";

interface ChecklistAreaProps {
  trip: Trip;
  /** Other trips whose lists can be copied — "same as last time". */
  copyFrom: { ownerId: string; label: string }[];
}

/**
 * A trip's lists, one on screen at a time.
 *
 * Documents, packing, before-you-leave, shopping and gear are all the same
 * mechanism — the shared `Checklist`, keyed by owner — so a trip gets as many as
 * it needs without a second model. The trip's original list keeps the plain
 * `trip:<id>` key it has always had, because the packing suggestions write into
 * it and a stored list must never be orphaned by a rename of its key; extra
 * lists hang off it as `trip:<id>:<n>`.
 *
 * Ticking stays live in view mode — marking something packed is not editing the
 * list's structure.
 */
export function ChecklistArea({ trip, copyFrom }: ChecklistAreaProps) {
  const { t } = useTranslation(["trips", "checklist", "common"]);
  const { checklists, createEmpty, update, removeChecklist } = useChecklists();

  const mainOwner = `trip:${trip.id}`;
  const prefix = `${mainOwner}:`;

  const owners = useMemo(() => {
    const extras = Object.keys(checklists)
      .filter((key) => key.startsWith(prefix))
      .sort();
    return [mainOwner, ...extras];
  }, [checklists, mainOwner, prefix]);

  const [owner, setOwner] = useState(mainOwner);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  // A list can be deleted from under the switcher; fall back rather than
  // rendering a panel for an owner that no longer exists.
  useEffect(() => {
    if (!owners.includes(owner)) setOwner(mainOwner);
  }, [owners, owner, mainOwner]);

  const labelFor = (ownerId: string): string => {
    const list = checklists[ownerId];
    if (list?.title) return list.title;
    return ownerId === mainOwner ? t("trips:checklists.main") : t("trips:checklists.untitled");
  };

  const items: SegmentedItem[] = owners.map((ownerId) => {
    const progress = progressOf(checklists[ownerId]);
    return {
      id: ownerId,
      label: labelFor(ownerId),
      isUserContent: Boolean(checklists[ownerId]?.title),
      badge: progress.total > 0 ? `${progress.done}/${progress.total}` : undefined,
    };
  });

  const isExtra = owner !== mainOwner;

  return (
    <div className="focus-trip-lists">
      <div className="focus-trip-lists__bar">
        {owners.length > 1 && (
          <SegmentedNav
            label={t("trips:checklists.choose")}
            items={items}
            value={owner}
            onChange={setOwner}
            variant="pills"
            collapse
          />
        )}

        {adding ? (
          <form
            className="focus-inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = name.trim();
              if (!trimmed) return;
              const ownerId = `${prefix}${Date.now().toString(36)}`;
              createEmpty(ownerId);
              update(ownerId, (list) => ({ ...list, title: trimmed }));
              setOwner(ownerId);
              setName("");
              setAdding(false);
            }}
          >
            <label className="visually-hidden" htmlFor="trip-list-name">
              {t("trips:checklists.newName")}
            </label>
            <input
              id="trip-list-name"
              className="form-control form-control-sm"
              dir="auto"
              autoFocus
              placeholder={t("trips:checklists.newName")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button type="submit" size="sm" variant="primary" disabled={!name.trim()}>
              {t("common:actions.add")}
            </Button>
            <Button type="button" size="sm" variant="link" onClick={() => setAdding(false)}>
              {t("common:actions.cancel")}
            </Button>
          </form>
        ) : (
          <div className="focus-trip-lists__actions">
            <Button variant="outline-primary" size="sm" onClick={() => setAdding(true)}>
              <Icon name="plus" size={13} />
              {t("trips:checklists.add")}
            </Button>
            {/* Only an extra list can be removed here. Deleting the trip's own
                list would orphan the packing suggestions that write into it. */}
            {isExtra && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  const confirmed = window.confirm(
                    t("trips:checklists.confirmRemove", { name: labelFor(owner) })
                  );
                  if (!confirmed) return;
                  removeChecklist(owner);
                  setOwner(mainOwner);
                }}
              >
                <Icon name="trash" size={13} />
                {t("trips:checklists.remove")}
              </Button>
            )}
          </div>
        )}
      </div>

      <ChecklistSection key={owner} ownerId={owner} copyFrom={owner === mainOwner ? copyFrom : []} />
    </div>
  );
}
