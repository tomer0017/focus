import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import { BackButton } from "../../components/ui/BackButton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ExternalLink } from "../../components/ui/ExternalLink";
import { Icon } from "../../components/ui/Icon";
import { LabelledText } from "../../components/ui/LabelledText";
import { PageHeader } from "../../components/ui/PageHeader";
import { SegmentedNav, type SegmentedItem } from "../../components/ui/SegmentedNav";
import { Thumbnail } from "../../components/ui/Thumbnail";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import {
  LEISURE_NOTE_TEMPLATES,
  primaryStatusOf,
  statusKeyFor,
  tracksOwnership,
} from "../../lib/leisureCollections";
import { useLeisure } from "../../state/leisureContext";
import { usePages } from "../../state/pagesContext";
import type { LeisureItem, ProjectNote } from "../../types";
import { ProjectNotes } from "../page/ProjectNotes";
import { LeisureFormModal } from "./LeisureFormModal";
import { MaterialsPanel } from "../resources/MaterialsPanel";

type Topic = "overview" | "notes" | "materials";

const TOPICS: Topic[] = ["overview", "notes", "materials"];

/**
 * One saved thing, in full.
 *
 * A detail screen rather than a modal, because this is where somebody lands a
 * year later asking "what did I already work out about this camera?" — and the
 * answer to that is notes and links, which a dialog cannot hold and cannot be
 * linked to.
 *
 * It opens in **view mode**: the facts, then the user's own notes, then the
 * material. No open inputs, no selects, no delete button in every block.
 * Editing is one explicit action beside the title, and because notes and
 * material save as they are made, the way out is "done editing" rather than a
 * Save button that pretends to do something.
 */
export function LeisureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["leisure", "common", "pages"]);
  const navigate = useNavigate();
  const { items, updateItem, deleteItem } = useLeisure();
  const { savedItemsFor } = usePages();
  const [params, setParams] = useSearchParams();

  const [editingItem, setEditingItem] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const item = items.find((entry) => entry.id === id);

  const materials = useMemo(() => (id ? savedItemsFor(id) : []), [savedItemsFor, id]);

  const topicParam = params.get("topic");
  const topic: Topic = TOPICS.includes(topicParam as Topic) ? (topicParam as Topic) : "overview";

  if (!item) {
    return (
      <>
        <BackButton />
        <EmptyState title={t("leisure:missing")} hint={t("leisure:missingHint")} />
      </>
    );
  }

  const setTopic = (next: string): void => {
    const params2 = new URLSearchParams(params);
    params2.set("topic", next);
    setParams(params2, { replace: true });
  };

  const status = primaryStatusOf(item);
  const notes = item.notes ?? [];

  const tabs: SegmentedItem[] = [
    { id: "overview", label: t("leisure:tabs.overview") },
    {
      id: "notes",
      label: t("leisure:tabs.notes"),
      badge: notes.length > 0 ? String(notes.length) : undefined,
    },
    {
      id: "materials",
      label: t("leisure:tabs.materials"),
      badge: materials.length > 0 ? String(materials.length) : undefined,
    },
  ];

  return (
    <>
      <BackButton />

      <PageHeader
        title={item.title}
        action={
          <>
            <Button variant="outline-secondary" size="sm" onClick={() => setEditingItem(true)}>
              {t("leisure:editFacts")}
            </Button>
            {/* One explicit step into edit mode; it saves as it goes, so the
                way out says "done editing" rather than "save". */}
            <Button
              variant={editMode ? "secondary" : "outline-secondary"}
              size="sm"
              onClick={() => setEditMode((current) => !current)}
            >
              {editMode ? t("common:actions.doneEditing") : t("common:actions.edit")}
            </Button>
          </>
        }
      />

      {/* The five things worth seeing before anything else. */}
      <div className="focus-leisure-brief">
        <Thumbnail imageUrl={item.imageUrl} thumb={item.thumb} size="md" />

        <div className="focus-leisure-brief__facts">
          <p className="focus-dense-row__eyebrow">{t(`leisure:kinds.${item.kind}`)}</p>

          <p className="focus-leisure-brief__status">
            {status && (
              <span className="focus-chip focus-chip--primary">
                {t(`leisure:${statusKeyFor(item.kind)}.${status}`)}
              </span>
            )}
            {/*
              A book's second fact, stated as a separate one. Ownership and
              progress were the same field before this, so "mine, unread" could
              not be written down at all.
            */}
            {tracksOwnership(item.kind) && item.ownershipStatus && (
              <span className="focus-chip focus-chip--muted">
                {t(`leisure:ownership.${item.ownershipStatus}`)}
              </span>
            )}
          </p>

          {item.note && (
            <p className="focus-panel__lead mb-0" dir="auto">
              {item.note}
            </p>
          )}

          {item.url && (
            <p className="mb-0">
              <ExternalLink href={item.url}>{t("leisure:openLink")}</ExternalLink>
            </p>
          )}
        </div>
      </div>

      <SegmentedNav
        label={t("leisure:tabsLabel")}
        items={tabs}
        value={topic}
        onChange={setTopic}
        variant="tabs"
        idPrefix="leisure"
        collapse
      />

      <div
        role="tabpanel"
        id={`leisure-panel-${topic}`}
        aria-labelledby={`leisure-tab-${topic}`}
        className="focus-collection__body"
      >
        {topic === "overview" && <Overview item={item} />}

        {topic === "notes" && (
          <ProjectNotes
            notes={notes}
            isEditing={editMode}
            templates={LEISURE_NOTE_TEMPLATES[item.kind]}
            onChange={(next: ProjectNote[]) => updateItem(item.id, { notes: next })}
          />
        )}

        {topic === "materials" && (
          <MaterialsPanel contextId={item.id} materials={materials} canAdd={editMode} />
        )}
      </div>

      {editMode && (
        <div className="focus-danger-zone">
          <Button variant="outline-danger" size="sm" onClick={() => setDeleting(true)}>
            <Icon name="trash" size={14} /> {t("common:actions.delete")}
          </Button>
        </div>
      )}

      <LeisureFormModal
        show={editingItem}
        item={item}
        defaultKind={item.kind}
        onClose={() => setEditingItem(false)}
      />

      <ConfirmDialog
        show={deleting}
        title={t("leisure:actions.deleteTitle")}
        body={t("leisure:actions.deleteBody", { title: item.title })}
        confirmLabel={t("common:actions.delete")}
        onConfirm={() => {
          deleteItem(item.id);
          navigate("/leisure");
        }}
        onCancel={() => setDeleting(false)}
      />
    </>
  );
}

/**
 * The facts, and only the ones this kind actually has.
 *
 * A destination has no budget and a book has no region, so neither renders an
 * empty row for one — the rule the whole app follows: a page shows nothing it
 * has nothing to say about.
 */
function Overview({ item }: { item: LeisureItem }) {
  const { t } = useTranslation(["leisure", "common"]);
  const { locale } = useLocale();

  const facts: { label: string; value: string }[] = [];

  if (item.region) facts.push({ label: t("leisure:fields.region"), value: item.region });
  if (item.estimatedBudget !== undefined) {
    facts.push({
      label: t("leisure:fields.budget"),
      value: `${item.currency ?? ""}${item.estimatedBudget}`,
    });
  }
  if (item.minutes !== undefined) {
    facts.push({
      label: t("leisure:fields.minutes"),
      value: `${item.minutes} ${t("leisure:fields.minutesUnit")}`,
    });
  }
  if (item.energy) {
    facts.push({ label: t("leisure:fields.energy"), value: t(`leisure:energy.${item.energy}`) });
  }
  if (item.place) {
    facts.push({ label: t("leisure:fields.place"), value: t(`leisure:place.${item.place}`) });
  }
  if (item.cost) {
    facts.push({ label: t("leisure:fields.cost"), value: t(`leisure:cost.${item.cost}`) });
  }

  const tags = item.tags ?? [];

  return (
    <div className="focus-form-stack">
      {facts.length > 0 && (
        <div className="focus-leisure-brief__facts">
          {facts.map((fact) => (
            <LabelledText key={fact.label} label={fact.label}>
              {fact.value}
            </LabelledText>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="focus-chips">
          {tags.map((tag) => (
            <span key={tag} className="focus-chip focus-chip--muted" dir="auto">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/*
        A destination is not a trip until somebody says so. This is an explicit
        action and it carries the destination's name into a new trip; nothing is
        created automatically and nothing is matched by title.
      */}
      {item.kind === "destination" && (
        <p className="mb-0">
          <Link className="btn btn-outline-primary btn-sm" to="/trips">
            {t("leisure:makeTrip")}
          </Link>
          <span className="form-text d-block">{t("leisure:makeTripHint")}</span>
        </p>
      )}

      <p className="form-text mb-0">
        {t("leisure:updatedAt", { when: formatRelativeDay(item.updatedAt, locale) })}
      </p>
    </div>
  );
}
