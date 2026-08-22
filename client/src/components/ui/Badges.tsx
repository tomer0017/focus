import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { getSpace } from "../../mocks/spaces";
import type { EventKind, PageStatus, PageType, RoutineDomain, SpaceId } from "../../types";

export function SpaceBadge({ spaceId }: { spaceId: SpaceId }) {
  const { t } = useTranslation();
  const space = getSpace(spaceId);
  return <span className={`focus-chip focus-chip--${space.accent}`}>{t(`spaces.${spaceId}`)}</span>;
}

export function PageTypeBadge({ type }: { type: PageType }) {
  const { t } = useTranslation();
  return <span className="focus-chip focus-chip--muted">{t(`pageTypes.${type}`)}</span>;
}

const STATUS_VARIANT: Record<PageStatus, string> = {
  active: "success",
  paused: "muted",
  completed: "info",
};

/**
 * Status is never signalled by colour alone — the label carries the meaning and
 * the colour only reinforces it. Three statuses, and only three: being blocked
 * is a separate fact, shown by `BlockedBadge`.
 */
export function StatusBadge({ status }: { status: PageStatus }) {
  const { t } = useTranslation();
  return (
    <span className={`focus-chip focus-chip--${STATUS_VARIANT[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}

/** Shown alongside a status, never instead of one. */
export function BlockedBadge() {
  const { t } = useTranslation();
  return (
    <span className="focus-chip focus-chip--warning focus-chip--icon">
      <Icon name="alert" size={12} />
      {t("status.blocked")}
    </span>
  );
}

export function RoutineDomainBadge({ domain }: { domain: RoutineDomain }) {
  const { t } = useTranslation();
  return <span className="focus-chip focus-chip--muted">{t(`routineDomains.${domain}`)}</span>;
}

export function EventKindBadge({ kind }: { kind: EventKind }) {
  const { t } = useTranslation("events");
  return <span className="focus-chip focus-chip--primary">{t(`events:kinds.${kind}`)}</span>;
}
