import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { useManage } from "../../state/manageContext";
import type { Menu, MenuKind } from "../../types";

interface MenuFormModalProps {
  show: boolean;
  onClose: () => void;
  menu?: Menu;
}

const KINDS: MenuKind[] = ["shabbat", "shabbatGuests", "holiday", "free"];

/**
 * Create or rename a menu. Dishes are edited on the menu's own screen — a
 * dialog that tried to hold both would be a form with a list inside it.
 */
export function MenuFormModal({ show, onClose, menu }: MenuFormModalProps) {
  const { t } = useTranslation(["manage", "common"]);
  const navigate = useNavigate();
  const { createMenu, updateMenu } = useManage();

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<MenuKind>("shabbat");
  const [servings, setServings] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!show) return;
    setTitle(menu?.title ?? "");
    setKind(menu?.kind ?? "shabbat");
    setServings(menu?.servings !== undefined ? String(menu.servings) : "");
    setDate(menu?.date ?? "");
    setNote(menu?.note ?? "");
  }, [show, menu]);

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();

    const payload = {
      title: title.trim() || undefined,
      kind,
      servings: servings.trim() ? Number(servings) : undefined,
      date: date || undefined,
      note: note.trim() || undefined,
    };

    if (menu) {
      updateMenu(menu.id, payload);
      onClose();
      return;
    }

    const created = createMenu(payload);
    onClose();
    navigate(`/manage/menus/${created.id}`);
  };

  return (
    <Modal show={show} onHide={onClose} scrollable centered>
      <form onSubmit={submit}>
        <Modal.Header closeButton closeLabel={t("common:actions.close")}>
          <Modal.Title as="h2" className="h5 mb-0">
            {menu ? t("common:actions.edit") : t("manage:shopping.newMenu")}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="focus-form-stack">
            <div>
              <label htmlFor="menu-title" className="form-label fw-medium">
                {t("manage:scheduled.titleField")}
              </label>
              <input
                id="menu-title"
                className="form-control"
                dir="auto"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="focus-field-row">
              <div>
                <label htmlFor="menu-kind" className="form-label fw-medium">
                  {t("manage:menu.kind")}
                </label>
                <select
                  id="menu-kind"
                  className="form-select"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as MenuKind)}
                >
                  {KINDS.map((option) => (
                    <option key={option} value={option}>
                      {t(`manage:menuKinds.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="menu-servings" className="form-label fw-medium">
                  {t("manage:menu.servings")}
                </label>
                <input
                  id="menu-servings"
                  type="number"
                  min={1}
                  className="form-control"
                  dir="ltr"
                  value={servings}
                  onChange={(event) => setServings(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="menu-date" className="form-label fw-medium">
                  {t("manage:menu.date")}
                </label>
                <input
                  id="menu-date"
                  type="date"
                  className="form-control"
                  dir="ltr"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="menu-note" className="form-label fw-medium">
                {t("manage:menu.note")}
              </label>
              <textarea
                id="menu-note"
                className="form-control"
                dir="auto"
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" type="button" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="primary" type="submit">
            {menu ? t("common:actions.save") : t("common:actions.create")}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
