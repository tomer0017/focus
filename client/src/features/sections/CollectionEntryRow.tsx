import { Section } from "./Section";
import { spanFor, type SectionSpan } from "./sectionSpan";
import { Link } from "react-router-dom";
import { BoardImage } from "../../components/ui/BoardImage";
import { useLocale } from "../../i18n/useLocale";
import { formatRelativeDay } from "../../lib/format";
import type { CollectionEntry } from "../../types";

interface CollectionEntryRowProps {
  title: string;
  entries: CollectionEntry[];
  /** Overrides the width the card count would choose. */
  span?: SectionSpan;
}

/**
 * Entries inside a collection — recipes, places, gear — grouped by their state
 * (recommended / want to try / made recently). Used by the Cooking and Trips
 * space views, which are about the contents of collections rather than about
 * project progress.
 */
export function CollectionEntryRow({ title, entries, span }: CollectionEntryRowProps) {
  const { locale } = useLocale();

  return (
    <Section title={title} hasContent={entries.length > 0} span={span ?? spanFor(entries.length)}>
      <ul className="list-unstyled focus-grid focus-grid--saved mb-0">
        {entries.map((entry) => (
          <li key={entry.id}>
            <article className="focus-saved">
              <BoardImage
                className="focus-saved__thumb"
                imageUrl={entry.imageUrl}
                thumb={entry.thumb}
              />
              <div className="focus-saved__body">
                <h3 className="focus-saved__title" dir="auto">
                  <Link to={`/recipes/${entry.id}`} className="stretched-link">
                    {entry.title}
                  </Link>
                </h3>
                {entry.note && <p className="focus-saved__note" dir="auto">{entry.note}</p>}
                {entry.lastDoneAt && (
                  <p className="focus-saved__foot mb-0">
                    <time dateTime={entry.lastDoneAt}>
                      {formatRelativeDay(entry.lastDoneAt, locale)}
                    </time>
                  </p>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
