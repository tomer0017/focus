import type { ThumbKey } from "../../types";
import pizza from "./pizza.svg";
import livingRoom from "./livingRoom.svg";
import sideboard from "./sideboard.svg";
import spring from "./spring.svg";
import mountain from "./mountain.svg";
import laptop from "./laptop.svg";
import gym from "./gym.svg";
import notebook from "./notebook.svg";
import document from "./document.svg";
import running from "./running.svg";
import cake from "./cake.svg";
import table from "./table.svg";
import plant from "./plant.svg";
import city from "./city.svg";
import books from "./books.svg";
import camera from "./camera.svg";
import salad from "./salad.svg";
import sea from "./sea.svg";

/**
 * Local illustration set for mock saved items, collection entries and vision
 * tiles. These are real bundled assets — no external image service, no runtime
 * dependency, and nothing fetched from the network.
 */
export const THUMBS: Record<ThumbKey, string> = {
  pizza,
  livingRoom,
  sideboard,
  spring,
  mountain,
  laptop,
  gym,
  notebook,
  document,
  running,
  cake,
  table,
  plant,
  city,
  books,
  camera,
  salad,
  sea,
};

/** Every thumbnail key, for pickers that let the user choose artwork. */
export const THUMB_KEYS = Object.keys(THUMBS) as ThumbKey[];
