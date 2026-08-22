import { UrlImageField } from "focus-client";

/**
 * One field for "a picture that lives somewhere else" — shared by the vision
 * board, trip covers, destinations and outfits, because four copies would mean
 * four different ideas of what a broken address looks like.
 *
 * The preview **is** the validation. Loading the address is the only honest
 * test that it points at an image: nothing is fetched for metadata, from any
 * service, and only the address is ever stored — never the bytes and never a
 * data URI. That is what keeps a board of thirty pictures a few kilobytes, and
 * what makes a removed picture genuinely gone.
 *
 * Two failure states are worth a cell each, because they are different
 * mistakes. `invalid` is "that is not an http address at all", caught before
 * anything is requested. `failed` is "that address answered, and what came back
 * was not a picture" — the usual cause being a page pasted instead of the image
 * on it. Neither substitutes artwork for the photograph somebody chose; that
 * would look like their photograph and hide the fact that the link is broken.
 *
 * The addresses here are real, reachable Wikimedia Commons files. A preview
 * pointing at a placeholder host would fail `npm run check:links` and would
 * misrepresent what the field does.
 */

const hold = (_value: string): void => {};

const KINKAKUJI =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Kinkaku-ji_in_November_2016_-02.jpg/960px-Kinkaku-ji_in_November_2016_-02.jpg";

const LIVING_ROOM =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Living_Room_3D_Render_with_Interior_Design_by_NONAGON_studio.png/960px-Living_Room_3D_Render_with_Interior_Design_by_NONAGON_studio.png";

/** The address resolved: a capped preview and the caption confirming it. */
export const WithPreview = () => (
  <UrlImageField id="tile-url-ok" label="כתובת התמונה" value={KINKAKUJI} onChange={hold} />
);

/** A tall picture is contained, never cropped — the point is checking the address, not displaying it. */
export const WithCustomHint = () => (
  <UrlImageField
    id="page-vision-url"
    label="כתובת התמונה"
    hint="קישור ישיר לתמונה. נשמרת רק הכתובת — לעולם לא התמונה עצמה."
    value={LIVING_ROOM}
    onChange={hold}
  />
);

/** Pasted without a scheme, so nothing is requested at all and the field says why. */
export const InvalidAddress = () => (
  <UrlImageField
    id="tile-url-invalid"
    label="כתובת התמונה"
    value="pinterest.com/tomerc/kitchen-2026"
    onChange={hold}
  />
);

/**
 * The description page pasted instead of the picture on it. The address is a
 * real destination, so it is requested — and what comes back is not an image.
 */
export const BrokenAddress = () => (
  <UrlImageField
    id="tile-url-failed"
    label="כתובת התמונה"
    value="https://commons.wikimedia.org/wiki/File:Kinkaku-ji_in_November_2016_-02.jpg"
    onChange={hold}
  />
);

/** Where it sits in the vision-tile form: source, address, then the words on the tile. */
export const InTileForm = () => (
  <div>
    <fieldset className="mb-3">
      <legend className="form-label fw-medium">תמונה</legend>
      <div className="focus-pills" role="radiogroup" aria-label="תמונה">
        <button type="button" role="radio" aria-checked={false} className="focus-pills__item">
          איור
        </button>
        <button type="button" role="radio" aria-checked className="focus-pills__item is-active">
          כתובת
        </button>
      </div>
    </fieldset>

    <div className="mb-3">
      <UrlImageField id="tile-url-form" label="כתובת התמונה" value={KINKAKUJI} onChange={hold} />
    </div>

    <div className="mb-3">
      <label htmlFor="tile-caption-demo" className="form-label fw-medium">
        כותרת
      </label>
      <input
        id="tile-caption-demo"
        className="form-control"
        dir="auto"
        value="קיוטו באוקטובר, סוף סוף"
        readOnly
      />
    </div>
  </div>
);
