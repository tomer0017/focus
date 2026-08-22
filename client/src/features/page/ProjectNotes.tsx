import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import { Icon } from "../../components/ui/Icon";
import {
  PROJECT_NOTE_TEMPLATES,
  moveNote,
  noteId,
  noteTemplate,
  noteTitle,
  renumber,
} from "../../lib/projectNotes";
import type { ProjectNote } from "../../types";

interface ProjectNotesProps {
  notes: ProjectNote[];
  isEditing: boolean;
  onChange: (notes: ProjectNote[]) => void;
}

/**
 * The body of a project page: as many blocks as the project needs, and none
 * when it needs none.
 *
 * In view mode this is text under headings — no delete buttons, no reorder
 * arrows, no open textareas. That was the complaint that started this: opening
 * a project to read it showed a content-management system instead. Editing is
 * one explicit step away, and saves as it goes, so the way out is "done
 * editing" rather than a Save button that pretends to do something.
 */
export function ProjectNotes({ notes, isEditing, onChange }: ProjectNotesProps) {
  const { t } = useTranslation(["pages", "common"]);
  const [adding, setAdding] = useState(false);

  const addNote = (templateId?: string): void => {
    const template = templateId ? noteTemplate(templateId) : undefined;
    const now = new Date().toISOString();
    onChange(
      renumber([
        ...notes,
        {
          id: noteId(),
          titleKey: template?.titleKey,
          content: "",
          order: notes.length,
          createdAt: now,
          updatedAt: now,
        },
      ])
    );
    setAdding(false);
  };

  const patch = (id: string, changes: Partial<ProjectNote>): void =>
    onChange(
      notes.map((note) =>
        note.id === id ? { ...note, ...changes, updatedAt: new Date().toISOString() } : note
      )
    );

  if (!isEditing) {
    // An empty project renders nothing at all — not a heading, not a prompt.
    if (notes.length === 0) return null;

    return (
      <div className="focus-notes">
        {notes
          .filter((note) => note.content.trim() || noteTitle(note, t))
          .map((note) => (
            <section key={note.id} className="focus-note">
              <h2 className="focus-note__title" dir="auto">
                {noteTitle(note, t)}
              </h2>
              {note.content.trim() && (
                <p className="focus-note__body mb-0" dir="auto">
                  {note.content}
                </p>
              )}
            </section>
          ))}
      </div>
    );
  }

  return (
    <div className="focus-notes focus-notes--editing">
      {notes.map((note, index) => {
        const template = note.titleKey
          ? PROJECT_NOTE_TEMPLATES.find((entry) => entry.titleKey === note.titleKey)
          : undefined;

        return (
          <section key={note.id} className="focus-note focus-note--edit">
            <div className="focus-note__toolbar">
              <label className="visually-hidden" htmlFor={`note-title-${note.id}`}>
                {t("pages:notes.titleLabel")}
              </label>
              <input
                id={`note-title-${note.id}`}
                className="form-control form-control-sm focus-note__title-input"
                dir="auto"
                placeholder={t("pages:notes.titlePlaceholder")}
                value={noteTitle(note, t)}
                onChange={(event) =>
                  // Renaming makes the title the user's own words, so the
                  // template key is dropped — the same rule as event sections.
                  patch(note.id, { title: event.target.value, titleKey: undefined })
                }
              />
              <div className="focus-note__actions">
                <button
                  type="button"
                  className="focus-icon-button border"
                  disabled={index === 0}
                  onClick={() => onChange(moveNote(notes, index, -1))}
                  aria-label={t("pages:notes.moveUp", { name: noteTitle(note, t) })}
                >
                  <Icon name="chevronUp" size={15} />
                </button>
                <button
                  type="button"
                  className="focus-icon-button border"
                  disabled={index === notes.length - 1}
                  onClick={() => onChange(moveNote(notes, index, 1))}
                  aria-label={t("pages:notes.moveDown", { name: noteTitle(note, t) })}
                >
                  <Icon name="chevronDown" size={15} />
                </button>
                <button
                  type="button"
                  className="focus-icon-button border focus-icon-button--danger"
                  onClick={() =>
                    onChange(renumber(notes.filter((entry) => entry.id !== note.id)))
                  }
                  aria-label={t("pages:notes.remove", { name: noteTitle(note, t) })}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>

            <label className="visually-hidden" htmlFor={`note-body-${note.id}`}>
              {t("pages:notes.contentLabel")}
            </label>
            <textarea
              id={`note-body-${note.id}`}
              className="form-control"
              rows={3}
              dir="auto"
              placeholder={template ? t(`pages:${template.hintKey}`) : undefined}
              value={note.content}
              onChange={(event) => patch(note.id, { content: event.target.value })}
            />
          </section>
        );
      })}

      {adding ? (
        <div className="focus-note-add">
          <p className="focus-note-add__lead mb-2">{t("pages:notes.pickTemplate")}</p>
          <div className="focus-note-add__options">
            <Button variant="outline-primary" size="sm" onClick={() => addNote()}>
              {t("pages:notes.blank")}
            </Button>
            {PROJECT_NOTE_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline-secondary"
                size="sm"
                onClick={() => addNote(template.id)}
              >
                {t(`pages:${template.titleKey}`)}
              </Button>
            ))}
          </div>
          <Button
            variant="link"
            size="sm"
            className="px-0"
            onClick={() => setAdding(false)}
          >
            {t("common:actions.cancel")}
          </Button>
        </div>
      ) : (
        <Button variant="outline-primary" size="sm" onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} />
          {t("pages:notes.add")}
        </Button>
      )}
    </div>
  );
}
