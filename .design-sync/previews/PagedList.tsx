import { CompactList, CompactRow, PagedList } from "focus-client";

/**
 * A long list, disclosed a page at a time.
 *
 * `ShowMore` reveals *everything* behind one press, which is right for six
 * saved links and wrong for seventy finished projects: one press and the
 * browser lays out seventy rows nobody asked to see. This grows the list in
 * fixed steps and states the honest total, so "show more" is never a guess
 * about depth.
 *
 * The page size is set low here so a sheet can show the button; the app uses 20.
 */

const projects = Array.from({ length: 70 }, (_, index) => ({
  id: `p${index}`,
  title: index % 2 ? `Finished project ${index + 1}` : `פרויקט שהסתיים ${index + 1}`,
}));

export const LongArchive = () => (
  <PagedList items={projects} pageSize={4}>
    {(visible) => (
      <CompactList>
        {visible.map((page) => (
          <li key={page.id}>
            <CompactRow title={page.title} eyebrow="הושלם" meta={<span>אשתקד</span>} />
          </li>
        ))}
      </CompactList>
    )}
  </PagedList>
);

/** Shorter than one page: no button, no count, nothing to disclose. */
export const FitsOnOnePage = () => (
  <PagedList items={projects.slice(0, 3)} pageSize={4}>
    {(visible) => (
      <CompactList>
        {visible.map((page) => (
          <li key={page.id}>
            <CompactRow title={page.title} eyebrow="הושלם" />
          </li>
        ))}
      </CompactList>
    )}
  </PagedList>
);

/** Nothing at all. The screen above it owns the empty state, not this. */
export const Empty = () => (
  <PagedList items={[]} pageSize={4}>
    {() => <p className="focus-day-empty mb-0">אין פריטים במצב הזה.</p>}
  </PagedList>
);
