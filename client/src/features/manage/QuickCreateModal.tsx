import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { Icon, type IconName } from "../../components/ui/Icon";
import { TemplatePicker, type PickerTemplate } from "../../components/ui/TemplatePicker";
import { QUICK_CREATE_TEMPLATES, type TemplateTarget } from "../../lib/templates";
import { useLeisure } from "../../state/leisureContext";
import type { CommitmentKind, ScheduledItemCategory } from "../../types";
import { CommitmentFormModal } from "./CommitmentFormModal";
import { MedicationFormModal } from "./MedicationFormModal";
import { MenuFormModal } from "./MenuFormModal";
import { NewListModal } from "./NewListModal";
import { ScheduledFormModal } from "./ScheduledFormModal";

interface QuickCreateModalProps {
  show: boolean;
  onClose: () => void;
}

/** The four primitives, offered before any template. */
const PRIMITIVES: { id: string; icon: IconName; target: TemplateTarget | "event" | "note" }[] = [
  { id: "reminder", icon: "bell", target: { create: "scheduled", category: "reminder" } },
  { id: "list", icon: "cart", target: { create: "checklist", templateId: "" } },
  { id: "event", icon: "calendar", target: "event" },
  { id: "note", icon: "edit", target: "note" },
];

/**
 * Quick create: four things, then optionally a template.
 *
 * The order is the whole design. Somebody who wants to write "call the garage"
 * must be able to do that in two taps, and must never be shown a form with a
 * billing cycle and a provider on it. Templates are the *second* step, for when
 * you already know you are creating an insurance policy.
 *
 * This dialog creates nothing itself — it chooses which real form to open. That
 * keeps one form per record type rather than a second, quicker, subtly
 * different version of each.
 */
export function QuickCreateModal({ show, onClose }: QuickCreateModalProps) {
  const { t } = useTranslation(["manage", "common"]);
  const navigate = useNavigate();
  const { recentTemplates, rememberTemplateUse } = useLeisure();

  const [scheduledCategory, setScheduledCategory] = useState<ScheduledItemCategory | undefined>(
    undefined
  );
  const [commitmentKind, setCommitmentKind] = useState<CommitmentKind | undefined>(undefined);
  const [medication, setMedication] = useState(false);
  const [list, setList] = useState(false);
  const [menu, setMenu] = useState(false);

  const closeAll = (): void => {
    setScheduledCategory(undefined);
    setCommitmentKind(undefined);
    setMedication(false);
    setList(false);
    setMenu(false);
    onClose();
  };

  const run = (target: TemplateTarget | "event" | "note"): void => {
    onClose();

    if (target === "event") {
      navigate("/events?new=1");
      return;
    }
    if (target === "note") {
      // Quick save already owns "keep this thing", and is in the header.
      navigate("/?save=1");
      return;
    }

    switch (target.create) {
      case "scheduled":
        setScheduledCategory(target.category);
        return;
      case "commitment":
        setCommitmentKind(target.kind);
        return;
      case "medication":
        setMedication(true);
        return;
      case "checklist":
        setList(true);
        return;
      case "menu":
        setMenu(true);
        return;
      case "profileBirthday":
        navigate("/family?new=1");
        return;
    }
  };

  const templates: PickerTemplate[] = QUICK_CREATE_TEMPLATES.map((template) => ({
    id: template.id,
    name: t(`manage:${template.nameKey}`),
    hint: template.hintKey ? t(`manage:${template.hintKey}`) : undefined,
    recommended: template.recommended,
  }));

  return (
    <>
      <Modal show={show} onHide={onClose} scrollable centered size="lg">
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {t("manage:quickCreate.title")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="focus-panel__lead">{t("manage:quickCreate.lead")}</p>

          <ul className="list-unstyled focus-template-list mb-3">
            {PRIMITIVES.map((primitive) => (
              <li key={primitive.id}>
                <button
                  type="button"
                  className="focus-template-option"
                  onClick={() => run(primitive.target)}
                >
                  <span className="focus-template-option__name">
                    <Icon name={primitive.icon} size={15} />{" "}
                    {t(`manage:quickCreate.${primitive.id}`)}
                  </span>
                  <span className="focus-template-option__hint">
                    {t(`manage:quickCreate.${primitive.id}Hint`)}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <h3 className="focus-panel__title">{t("manage:quickCreate.orTemplate")}</h3>
          <TemplatePicker
            templates={templates}
            recentIds={recentTemplates}
            label={t("manage:templates.pickLabel")}
            onPick={(id) => {
              const template = QUICK_CREATE_TEMPLATES.find((entry) => entry.id === id);
              if (!template) return;
              rememberTemplateUse(id);
              run(template.target);
            }}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
        </Modal.Footer>
      </Modal>

      <ScheduledFormModal
        show={Boolean(scheduledCategory)}
        defaultCategory={scheduledCategory}
        onClose={closeAll}
      />
      <CommitmentFormModal
        show={Boolean(commitmentKind)}
        defaultKind={commitmentKind}
        onClose={closeAll}
      />
      <MedicationFormModal show={medication} onClose={closeAll} />
      <NewListModal show={list} onClose={closeAll} />
      <MenuFormModal show={menu} onClose={closeAll} />
    </>
  );
}
