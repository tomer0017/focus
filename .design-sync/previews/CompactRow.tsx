import { CompactRow, CompactList, StatusBadge, BlockedBadge, Icon } from "focus-client";

/**
 * The dense row is the workhorse of Focus: a name, a fact and a date on one
 * line. Every cell here is content of the kind the app actually holds — a real
 * subscription, a real blocker — because a row full of "Item one" says nothing
 * about whether the clamping and the spacing hold up.
 */

export const Row = () => (
  <CompactList>
    <li>
      <CompactRow
        title="Netflix"
        eyebrow="מנוי"
        detail="החשבון המשותף — מתחדש אוטומטית בכרטיס של הבית"
        meta={<span>₪54.90 / חודש</span>}
      />
    </li>
  </CompactList>
);

export const Tones = () => (
  <CompactList>
    <li>
      <CompactRow
        title="ביטוח רכב"
        eyebrow="חידוש"
        detail="הצעה חלופית התקבלה, צריך להשוות לפני החידוש"
        meta={<span>היום</span>}
        tone="due"
      />
    </li>
    <li>
      <CompactRow
        title="בדיקת דם — המשך"
        eyebrow="תור"
        detail="צום 12 שעות לפני"
        meta={<span>בעוד 4 ימים</span>}
        tone="soon"
      />
    </li>
    <li>
      <CompactRow
        title="ארנונה"
        eyebrow="תשלום"
        detail="דו-חודשי"
        meta={<span>1 בחודש</span>}
        tone="neutral"
      />
    </li>
    <li>
      <CompactRow
        title="טסט שנתי"
        eyebrow="רכב"
        detail="בוצע במוסך ברחוב הרצל"
        meta={<span>הושלם</span>}
        tone="done"
      />
    </li>
  </CompactList>
);

export const WithBadgesAndActions = () => (
  <CompactList>
    <li>
      <CompactRow
        title="Sorcol"
        eyebrow="פרויקט"
        detail="Sizing product and marketing site — the size model is the product."
        leading={<Icon name="board" size={18} />}
        badges={
          <>
            <StatusBadge status="active" />
            <BlockedBadge />
          </>
        }
        meta={<span>עודכן לפני יומיים</span>}
        actions={
          <button type="button" className="btn btn-sm btn-link focus-icon-button text-secondary">
            <Icon name="edit" size={16} />
          </button>
        }
      />
    </li>
  </CompactList>
);

export const ClampedDetail = () => (
  <CompactList>
    <li>
      <CompactRow
        title="Painter Platform"
        eyebrow="פרויקט"
        detail="Auth, the painting list and the gallery view all work against the API — custom domains are next, once uploads stop failing on large files, and after that the public gallery needs a real empty state."
        meta={<span>עודכן לפני 5 ימים</span>}
      />
    </li>
  </CompactList>
);
