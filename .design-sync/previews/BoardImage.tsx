import { BoardImage } from "focus-client";

/**
 * A picture that may live on someone else's server.
 *
 * Focus stores the **address** of a remote picture and never the bytes, so
 * every one of these can fail — and when one does, `BoardImage` says so. It
 * does not quietly swap in a piece of local artwork: a drawing put in place of
 * somebody's photograph looks like their photograph, so they never find out
 * the address is broken. Artwork is only ever used for an item that was
 * *seeded* with it and has no address of its own.
 *
 * The addresses below are real, reachable Wikimedia Commons files, and the
 * broken one is a real host with a path that genuinely 404s. A placeholder
 * host would be caught by `npm run check:links`, and would also be exactly the
 * dishonest link this component exists to avoid.
 */

const KYOTO =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Kiyomizu-dera_in_Kyoto-r.jpg/960px-Kiyomizu-dera_in_Kyoto-r.jpg";

const TABLE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/960px-Good_Food_Display_-_NCI_Visuals_Online.jpg";

/** Real host, real shape, no such file. */
const GONE = "https://upload.wikimedia.org/wikipedia/commons/9/99/Focus_removed_photo_2026.jpg";

/**
 * The canonical use: the picture a page is aiming at. Capped and `contain`
 * rather than `cover` — cropping the building out of a picture of a building
 * is not a saving.
 */
export const VisionPicture = () => (
  <div className="focus-vision-image" style={{ maxInlineSize: 420 }}>
    <BoardImage
      imageUrl={KYOTO}
      className="focus-vision-image__picture"
      alt="קיומיזו-דרה, קיוטו"
    />
  </div>
);

/** Progress pictures, the other kind a page carries: where it actually is. */
export const ProgressPictures = () => (
  <ul
    className="list-unstyled focus-grid focus-grid--progress"
    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}
  >
    <li>
      <figure className="focus-progress-card">
        <BoardImage imageUrl={KYOTO} className="focus-progress-card__picture" alt="" />
        <figcaption className="focus-progress-card__caption">
          <span className="focus-progress-card__when">14 באוגוסט 2026</span>
          <span className="focus-progress-card__note" dir="auto">
            המסלול שסימנו ליום השני
          </span>
        </figcaption>
      </figure>
    </li>
    <li>
      <figure className="focus-progress-card">
        <BoardImage imageUrl={TABLE} className="focus-progress-card__picture" alt="" />
        <figcaption className="focus-progress-card__caption">
          <span className="focus-progress-card__when">2 באוגוסט 2026</span>
          <span className="focus-progress-card__note" dir="auto">
            השולחן כמו שיצא בפעם הקודמת
          </span>
        </figcaption>
      </figure>
    </li>
  </ul>
);

/**
 * The address is well-formed and the host is real, but the file is gone. The
 * placeholder says the picture did not load and offers the way to fix it —
 * which is the whole reason this component refuses to substitute artwork.
 */
export const BrokenAddress = () => (
  <div className="focus-outfit-card" style={{ maxInlineSize: 280 }}>
    <BoardImage
      imageUrl={GONE}
      action={
        <button type="button" className="btn btn-link btn-sm p-0">
          עריכת הכתובת
        </button>
      }
    />
    <div className="focus-outfit-card__body">
      <p className="focus-outfit-card__title" dir="auto">
        לוק ליום הראשון
      </p>
      <p className="focus-outfit-card__note" dir="auto">
        נשמר מפינטרסט בחורף שעבר
      </p>
    </div>
  </div>
);

/**
 * Local artwork, used **only** because this item has no address at all. This
 * is the one branch where a drawing is honest.
 */
export const SeededArtwork = () => (
  <div className="focus-outfit-card" style={{ maxInlineSize: 280 }}>
    <BoardImage thumb="salad" className="focus-outfit-card__image" alt="" />
    <div className="focus-outfit-card__body">
      <p className="focus-outfit-card__title" dir="auto">
        סלט קיץ עם אפרסקים
      </p>
      <p className="focus-outfit-card__note" dir="auto">
        מתכון שנשמר בלי תמונה משלו
      </p>
    </div>
  </div>
);

/** Neither an address nor artwork: the picture was simply never added. */
export const NoPicture = () => (
  <div className="focus-outfit-card" style={{ maxInlineSize: 280 }}>
    <BoardImage />
    <div className="focus-outfit-card__body">
      <p className="focus-outfit-card__title" dir="auto">
        לוק לערב האחרון
      </p>
      <p className="focus-outfit-card__note" dir="auto">
        עוד לא בחרתי
      </p>
    </div>
  </div>
);
