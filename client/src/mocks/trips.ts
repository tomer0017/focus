import type { Trip } from "../types";
import { addDaysToKey, todayKey } from "../lib/dateKey";

/**
 * One trip, planned in enough detail to be worth reading.
 *
 * Dates are generated relative to today so the countdown and the day plan stay
 * believable whenever the demo is opened. Destination pictures use local
 * artwork; the URL path is exercised by adding one through the UI, so the demo
 * has no dependency on somebody else's server staying up.
 */
const START = addDaysToKey(todayKey(), 96);
const day = (offset: number): string => addDaysToKey(START, offset);

/** Anchors for the shorter trips, so all five stay believable side by side. */
const SOON = addDaysToKey(todayKey(), 18);
const WEEKEND = addDaysToKey(todayKey(), 32);
const OUTDOORS = addDaysToKey(todayKey(), 9);
const LAST = addDaysToKey(todayKey(), -74);

export const MOCK_TRIPS: Trip[] = [
  {
    id: "japan-2027",
    title: "Japan 2027",
    kind: "abroad",
    countries: ["Japan"],
    startDate: START,
    endDate: day(11),
    coverThumb: "city",
    status: "booking",
    nextAction: "Book the Kyoto ryokan before the autumn rates change.",
    notes: "Two weeks was too long last time we tried to plan it. Eleven days, three cities.",
    createdAt: new Date().toISOString(),

    flights: [
      {
        id: "flight-out",
        number: "LY 095",
        from: "TLV",
        to: "NRT",
        departsAt: `${START}T23:40:00.000Z`,
        arrivesAt: `${day(1)}T17:20:00.000Z`,
        confirmation: "QJ4T2M",
        note: "Long leg. Aisle seats already chosen.",
      },
      {
        id: "flight-home",
        number: "LY 096",
        from: "KIX",
        to: "TLV",
        departsAt: `${day(11)}T10:15:00.000Z`,
        arrivesAt: `${day(11)}T18:05:00.000Z`,
        confirmation: "QJ4T2M",
      },
    ],

    stays: [
      {
        id: "stay-tokyo",
        name: "Hotel in Shinjuku",
        destinationId: "tokyo",
        address: "3-chome, Shinjuku, Tokyo",
        checkIn: `${day(1)}T15:00:00.000Z`,
        checkOut: `${day(5)}T10:00:00.000Z`,
        confirmation: "HN-88213",
        note: "Two minutes from the station's south exit. Ask for a high floor.",
      },
      {
        id: "stay-kyoto",
        name: "Ryokan near Gion",
        destinationId: "kyoto",
        address: "Higashiyama, Kyoto",
        checkIn: `${day(5)}T16:00:00.000Z`,
        checkOut: `${day(9)}T10:00:00.000Z`,
        note: "Not booked yet. Dinner is included and worth taking.",
      },
      {
        id: "stay-osaka",
        name: "Apartment in Namba",
        destinationId: "osaka",
        address: "Namba, Osaka",
        checkIn: `${day(9)}T15:00:00.000Z`,
        checkOut: `${day(11)}T09:00:00.000Z`,
        confirmation: "AP-5521",
      },
    ],

    destinations: [
      {
        id: "tokyo",
        name: "Tokyo",
        country: "Japan",
        thumb: "city",
        arriveOn: day(1),
        leaveOn: day(5),
        clothing: "Layers. Warm mornings, cold once the sun goes down.",
        goodToKnow: [
          "Many museums close on Monday — plan the parks for that day.",
          "The farmers' market by the station runs on Wednesday until 20:00.",
          "IC card works on almost every train, but not on the airport express.",
        ],
        savedItemIds: ["saved-tokyo-clip", "saved-tokyo-guide"],
        notes: "Jet lag day one. Nothing booked before noon.",
      },
      {
        id: "kyoto",
        name: "Kyoto",
        country: "Japan",
        thumb: "spring",
        arriveOn: day(5),
        leaveOn: day(9),
        clothing: "Something you can walk 15km in. One smart outfit for the ryokan dinner.",
        goodToKnow: [
          "Temples open early and empty out by 09:00 — go before breakfast.",
          "Nishiki market is closed on Wednesday.",
          "Buses take exact change; keep coins.",
        ],
        savedItemIds: ["saved-kyoto-pin"],
      },
      {
        id: "osaka",
        name: "Osaka",
        country: "Japan",
        thumb: "sea",
        arriveOn: day(9),
        leaveOn: day(11),
        clothing: "נוח. שני ערבים, בעיקר אוכל.",
        goodToKnow: [
          "רוב דוכני האוכל ברחוב מקבלים מזומן בלבד.",
          "האקווריום מתמלא אחרי 11:00 בסופ״ש — להגיע מוקדם.",
          "הרכבת לשדה התעופה יוצאת מתחנה אחרת מזו שהגענו אליה.",
        ],
        savedItemIds: ["saved-osaka-food"],
      },
    ],

    days: [
      {
        id: "d1",
        date: day(1),
        destinationId: "tokyo",
        morning: "Land, train into the city, drop the bags.",
        afternoon: "Walk the neighbourhood. Nothing ambitious.",
        evening: "Early dinner near the hotel, then sleep.",
        alternatives: "If we land on time, the observation deck at sunset.",
        clothing: "Whatever we flew in.",
        notes: "Do not book anything on day one again.",
      },
      {
        id: "d2",
        date: day(2),
        destinationId: "tokyo",
        morning: "Fish market, early.",
        afternoon: "Museum district.",
        evening: "Yakitori under the tracks.",
        bookings: "Museum tickets, 14:00.",
      },
      {
        id: "d3",
        date: day(3),
        destinationId: "tokyo",
        morning: "Park and the shrine.",
        afternoon: "Second-hand camera shops.",
        evening: "Wander.",
        alternatives: "Rain: the aquarium instead of the park.",
      },
      {
        id: "d4",
        date: day(4),
        destinationId: "tokyo",
        morning: "Day trip out of the city.",
        afternoon: "Hot spring town.",
        evening: "Back late.",
        bookings: "Train seats booked both ways.",
      },
      {
        id: "d5",
        date: day(5),
        destinationId: "kyoto",
        morning: "Train to Kyoto.",
        afternoon: "Check in, walk Higashiyama.",
        evening: "Ryokan dinner.",
        clothing: "The smart outfit.",
      },
      {
        id: "d6",
        date: day(6),
        destinationId: "kyoto",
        morning: "Temples before breakfast.",
        afternoon: "Bamboo grove and the river.",
        evening: "Quiet.",
      },
      {
        id: "d7",
        date: day(7),
        destinationId: "kyoto",
        morning: "Market — not Wednesday.",
        afternoon: "Pottery street.",
        evening: "Dinner in Pontocho.",
      },
      {
        id: "d8",
        date: day(8),
        destinationId: "kyoto",
        morning: "Nothing planned.",
        afternoon: "Nothing planned.",
        evening: "Whatever we liked most, again.",
        notes: "Leave one empty day. It is always the best one.",
      },
      {
        id: "d9",
        date: day(9),
        destinationId: "osaka",
        morning: "Train to Osaka.",
        afternoon: "Castle park.",
        evening: "Dotonbori, slowly.",
      },
      {
        id: "d10",
        date: day(10),
        destinationId: "osaka",
        morning: "Aquarium, early.",
        afternoon: "Last shopping.",
        evening: "The okonomiyaki place from the video.",
      },
      {
        id: "d11",
        date: day(11),
        destinationId: "osaka",
        morning: "Airport.",
        bookings: "Flight LY 096, 10:15.",
      },
    ],

    outfits: [
      {
        id: "outfit-flight",
        title: "טיסה ארוכה",
        occasion: "flight",
        destinationId: "tokyo",
        dayIds: ["d1"],
        status: "selected",
        order: 0,
        note: "שכבות. במטוס קר ובנריטה חם.",
        clothingItems: [
          { id: "oc-1", name: "טרנינג נוח", quantity: 1 },
          { id: "oc-2", name: "גרביים חמות", quantity: 1 },
          { id: "oc-3", name: "נעלי הליכה", quantity: 1 },
          { id: "oc-4", name: "קפוצ׳ון", quantity: 1 },
        ],
      },
      {
        id: "outfit-city-day",
        title: "Walking the city",
        occasion: "walking",
        destinationId: "tokyo",
        dayIds: ["d2", "d3"],
        status: "selected",
        order: 1,
        note: "Same base, different shirt. Nothing that needs ironing.",
        clothingItems: [
          { id: "oc-5", name: "נעלי הליכה", quantity: 1 },
          { id: "oc-6", name: "Grey trousers", quantity: 1 },
          { id: "oc-7", name: "Black shirt", quantity: 2 },
          { id: "oc-8", name: "Light jacket", quantity: 1 },
        ],
      },
      {
        id: "outfit-ryokan",
        title: "Ryokan dinner",
        occasion: "restaurant",
        destinationId: "kyoto",
        dayIds: ["d5"],
        status: "selected",
        order: 2,
        note: "The one smart outfit. Shoes that come off easily.",
        clothingItems: [
          { id: "oc-9", name: "Smart shirt", quantity: 1 },
          { id: "oc-10", name: "Dark trousers", quantity: 1 },
          { id: "oc-11", name: "Slip-on shoes", quantity: 1 },
        ],
      },
      {
        id: "outfit-osaka-evening",
        title: "ערב באוסקה",
        occasion: "evening",
        destinationId: "osaka",
        dayIds: [],
        status: "idea",
        order: 3,
        pinterestUrl: "https://www.pinterest.com/",
        note: "רעיון מפינטרסט — עוד לא בטוח שזה מתאים לטמפרטורה.",
        clothingItems: [{ id: "oc-12", name: "ז׳קט קל", quantity: 1 }],
      },
    ],

    food: [
      {
        id: "food-1",
        destinationId: "tokyo",
        name: "Yakitori under the tracks",
        kind: "restaurant",
        address: "Yurakucho",
        note: "No reservations. Go before 18:00 or queue.",
        status: "planned",
        day: day(2),
        source: "youtube",
      },
      {
        id: "food-2",
        destinationId: "tokyo",
        name: "Coffee place with the wooden counter",
        kind: "cafe",
        note: "Opens at 07:00 — good on a jet-lagged morning.",
        status: "option",
        source: "instagram",
      },
      {
        id: "food-3",
        destinationId: "kyoto",
        name: "Nishiki market",
        kind: "market",
        note: "Closed Wednesday. Go hungry.",
        status: "planned",
        day: day(7),
      },
      {
        id: "food-4",
        destinationId: "kyoto",
        name: "Tofu set lunch near the temple",
        kind: "dish",
        note: "Cheaper at lunch than dinner, same food.",
        status: "option",
      },
      {
        id: "food-5",
        destinationId: "osaka",
        name: "Okonomiyaki from the video",
        kind: "restaurant",
        note: "The one with the queue outside. Cash only.",
        status: "planned",
        day: day(10),
        source: "tiktok",
      },
    ],
  },
  /*
   * A hotel holiday in Israel. One place, four nights, nothing to fly to — so
   * it carries no flights and no multi-city itinerary, and the screen it opens
   * has neither. Same model, different shape.
   */
  {
    id: "eilat-hotel",
    title: "ארבעה לילות באילת",
    kind: "hotel",
    countries: ["ישראל"],
    startDate: SOON,
    endDate: addDaysToKey(SOON, 4),
    coverThumb: "sea",
    status: "planned",
    nextAction: "לבדוק אם הבריכה מחוממת בתאריכים האלה.",
    notes: "החדר עם הנוף שווה את ההפרש. בפעם שעברה לקחנו בלי.",
    createdAt: new Date().toISOString(),

    flights: [],
    stays: [
      {
        id: "eilat-stay",
        name: "מלון על הטיילת",
        destinationId: "eilat",
        address: "טיילת צפון, אילת",
        checkIn: `${SOON}T15:00:00.000Z`,
        checkOut: `${addDaysToKey(SOON, 4)}T11:00:00.000Z`,
        confirmation: "IL-44190",
        note: "חניה כלולה. לבקש קומה גבוהה.",
      },
    ],
    destinations: [
      {
        id: "eilat",
        name: "אילת",
        country: "ישראל",
        thumb: "sea",
        arriveOn: SOON,
        leaveOn: addDaysToKey(SOON, 4),
        clothing: "בגד ים, כובע, משהו אחד לערב.",
        goodToKnow: [
          "ארוחת הבוקר נסגרת ב־10:00 בדיוק.",
          "השמורה דורשת הזמנה מראש בסופ״ש.",
          "אחרי 16:00 הרוח בטיילת חזקה.",
        ],
        savedItemIds: [],
      },
    ],
    days: [
      {
        id: "eilat-d1",
        date: SOON,
        destinationId: "eilat",
        afternoon: "צ׳ק־אין ובריכה.",
        evening: "ארוחה בטיילת.",
      },
      {
        id: "eilat-d2",
        date: addDaysToKey(SOON, 1),
        destinationId: "eilat",
        morning: "שנורקלינג בחוף הדקל.",
        evening: "לא לתכנן כלום.",
      },
      { id: "eilat-d3", date: addDaysToKey(SOON, 2), destinationId: "eilat" },
      {
        id: "eilat-d4",
        date: addDaysToKey(SOON, 3),
        destinationId: "eilat",
        morning: "השמורה — להזמין מראש.",
        bookings: "כרטיסים לשמורה, 09:30.",
      },
    ],
    food: [
      {
        id: "eilat-food-1",
        destinationId: "eilat",
        name: "הדגים של רפי",
        kind: "restaurant",
        note: "להזמין מקום בסופ״ש. יושבים בחוץ.",
        status: "planned",
      },
    ],
    outfits: [],
  },

  /*
   * A weekend. Two days, one place, no flights and no looks — the lightest
   * shape the screen can take, and the one that used to get the heaviest.
   */
  {
    id: "galilee-weekend",
    title: "סופ״ש בגליל",
    kind: "weekend",
    countries: ["ישראל"],
    startDate: WEEKEND,
    endDate: addDaysToKey(WEEKEND, 1),
    coverThumb: "spring",
    status: "booking",
    nextAction: "לאשר את הצימר מול בעלת הבית.",
    createdAt: new Date().toISOString(),

    flights: [],
    stays: [
      {
        id: "galilee-stay",
        name: "צימר ליד ראש פינה",
        destinationId: "galilee",
        checkIn: `${WEEKEND}T16:00:00.000Z`,
        checkOut: `${addDaysToKey(WEEKEND, 1)}T11:00:00.000Z`,
        note: "עוד לא שולם. מחכים לאישור.",
      },
    ],
    destinations: [
      {
        id: "galilee",
        name: "ראש פינה",
        country: "ישראל",
        thumb: "spring",
        arriveOn: WEEKEND,
        leaveOn: addDaysToKey(WEEKEND, 1),
        goodToKnow: ["רוב המסעדות סגורות בשבת בצהריים.", "הכביש למעלה צר — לא בלילה."],
        savedItemIds: [],
      },
    ],
    days: [
      {
        id: "galilee-d1",
        date: WEEKEND,
        destinationId: "galilee",
        afternoon: "לצאת אחרי הצהריים, בלי פקקים.",
        evening: "ארוחה במושבה.",
      },
      {
        id: "galilee-d2",
        date: addDaysToKey(WEEKEND, 1),
        destinationId: "galilee",
        morning: "הליכה קצרה ליד הנחל.",
      },
    ],
    food: [],
    outfits: [],
  },

  /*
   * Camping. No flights, no hotel, no itinerary worth the name — what this trip
   * *is* is gear, food, the notes somebody wrote, and a list. It is the case
   * that proved the project screen was the wrong shape for a trip.
   */
  {
    id: "north-camping",
    title: "קמפינג בצפון",
    kind: "outdoors",
    countries: ["ישראל"],
    startDate: OUTDOORS,
    endDate: addDaysToKey(OUTDOORS, 2),
    coverThumb: "mountain",
    status: "planned",
    nextAction: "לבדוק שהגז עובד לפני שיוצאים.",
    createdAt: new Date().toISOString(),
    noteBlocks: [
      {
        id: "camp-note-1",
        title: "איפה חונים",
        content:
          "החניון התחתון מתמלא עד 15:00 בסופ״ש. העליון פחות יפה אבל תמיד יש מקום, ומשם עשר דקות הליכה למים.",
        order: 0,
      },
      {
        id: "camp-note-2",
        title: "מה לא לקחת שוב",
        content:
          "בפעם שעברה לקחנו שלושה פנסים ואף אחד לא עבד. פנס ראש אחד טוב וסוללות רזרביות מספיקים.",
        order: 1,
      },
      {
        id: "camp-note-3",
        title: "אוכל בשטח",
        content: "לחתוך הכול בבית. סיר אחד, לא שניים. קפה של בוקר זה מה שמציל את היום.",
        order: 2,
      },
    ],

    flights: [],
    stays: [],
    destinations: [
      {
        id: "north-site",
        name: "נחל בצפון",
        country: "ישראל",
        thumb: "mountain",
        arriveOn: OUTDOORS,
        leaveOn: addDaysToKey(OUTDOORS, 2),
        goodToKnow: [
          "אין קליטה מהחניון והלאה — להוריד מפה מראש.",
          "מדורה מותרת רק באזור המסומן.",
          "המים קרים עד אמצע יוני.",
        ],
        savedItemIds: [],
      },
    ],
    days: [],
    food: [
      {
        id: "camp-food-1",
        destinationId: "north-site",
        name: "פיתות על הסאج",
        kind: "dish",
        note: "בצק מוכן מהבית. עשר דקות ונגמר.",
        status: "planned",
      },
      {
        id: "camp-food-2",
        destinationId: "north-site",
        name: "שקשוקה בסיר אחד",
        kind: "dish",
        note: "הכי טוב בבוקר השני, כשכבר קר.",
        status: "option",
      },
    ],
    outfits: [],
  },

  /*
   * A trip that is over. Everything is kept — the itinerary, the bookings, the
   * pictures — and nothing on the screen still asks to be prepared.
   */
  {
    id: "lisbon-past",
    title: "Lisbon, last spring",
    kind: "abroad",
    countries: ["Portugal"],
    startDate: LAST,
    endDate: addDaysToKey(LAST, 5),
    coverThumb: "city",
    status: "done",
    notes: "חמישה ימים זה בדיוק. ביום השישי כבר היינו עייפים מהמדרגות.",
    createdAt: new Date().toISOString(),

    flights: [
      {
        id: "lisbon-out",
        number: "TP 1234",
        from: "TLV",
        to: "LIS",
        departsAt: `${LAST}T06:30:00.000Z`,
        arrivesAt: `${LAST}T10:45:00.000Z`,
        confirmation: "PT9K2A",
      },
    ],
    stays: [
      {
        id: "lisbon-stay",
        name: "Apartment in Alfama",
        destinationId: "lisbon",
        address: "Alfama, Lisboa",
        checkIn: `${LAST}T14:00:00.000Z`,
        checkOut: `${addDaysToKey(LAST, 5)}T10:00:00.000Z`,
        confirmation: "AL-7781",
        note: "Four flights of stairs. Worth knowing before booking again.",
      },
    ],
    destinations: [
      {
        id: "lisbon",
        name: "Lisbon",
        country: "Portugal",
        thumb: "city",
        arriveOn: LAST,
        leaveOn: addDaysToKey(LAST, 5),
        goodToKnow: ["Most museums are free on the first Sunday.", "The 28 tram is unusable after 10:00."],
        savedItemIds: [],
      },
    ],
    days: [
      {
        id: "lisbon-d1",
        date: LAST,
        destinationId: "lisbon",
        morning: "Landed, dropped the bags, walked.",
        evening: "Dinner near the apartment.",
      },
      {
        id: "lisbon-d2",
        date: addDaysToKey(LAST, 1),
        destinationId: "lisbon",
        morning: "Belém, early.",
        afternoon: "The tile museum.",
        notes: "Next time: buy the transport card on day one, not day three.",
      },
    ],
    food: [
      {
        id: "lisbon-food-1",
        destinationId: "lisbon",
        name: "The place with the queue",
        kind: "restaurant",
        note: "Worth the wait. Go at 18:30.",
        status: "visited",
      },
    ],
    outfits: [],
  },
];
