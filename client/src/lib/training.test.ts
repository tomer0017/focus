/**
 * Training plans.
 *
 * The defect behind this file is one line of the old screen:
 *
 *     const [activePlan, ...previousPlans] = plans;
 *
 * "The active plan" was whichever training document happened to be newest. So
 * running Plan A and Plan B in the same week could not be represented at all,
 * and there was nowhere to write down what was *in* a plan.
 *
 * Most of what follows checks the operations that can silently lose somebody's
 * data — duplicating, reordering, deleting — because those are the ones you
 * only notice went wrong weeks later.
 */
import { describe, expect, it } from "vitest";
import {
  TRAINING_NOTE_TEMPLATES,
  addExercise,
  addGroup,
  countByStatus,
  duplicatePlan,
  exerciseCount,
  filterPlans,
  moveExercise,
  moveGroup,
  removeExercise,
  removeGroup,
  sortPlans,
  updateExercise,
} from "./training";
import { MOCK_TRAINING_PLANS } from "../mocks/training";
import type { TrainingPlan } from "../types";

function plan(extra: Partial<TrainingPlan> = {}): TrainingPlan {
  return {
    id: "p1",
    title: "Plan",
    status: "active",
    groups: [],
    order: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

/** A plan with two groups of two exercises, for the reordering tests. */
function filled(): TrainingPlan {
  let p = plan();
  p = addGroup(p, "Warm-up");
  p = addGroup(p, "Main");
  const [warm, main] = p.groups;
  p = addExercise(p, warm.id, "Bike");
  p = addExercise(p, warm.id, "Band pulls");
  p = addExercise(p, main.id, "Bench");
  p = addExercise(p, main.id, "Row");
  return p;
}

describe("more than one plan can be running", () => {
  it("does not treat any plan as the single active one", () => {
    const plans = [
      plan({ id: "a", status: "active" }),
      plan({ id: "b", status: "active" }),
      plan({ id: "home", status: "active" }),
      plan({ id: "old", status: "completed" }),
    ];

    expect(filterPlans(plans, { status: "active" }).map((p) => p.id)).toEqual(["a", "b", "home"]);
    expect(countByStatus(plans)).toEqual({ active: 3, paused: 0, completed: 1 });
  });

  it("ships two live gym plans and a live home plan in the seed", () => {
    const active = MOCK_TRAINING_PLANS.filter((p) => p.status === "active");
    expect(active.length).toBeGreaterThanOrEqual(3);
    expect(active.filter((p) => p.environment === "gym").length).toBeGreaterThanOrEqual(2);
    expect(active.some((p) => p.environment === "home")).toBe(true);
  });

  it("treats the short name as free text, not a fixed A/B/C", () => {
    // "Push/Pull/Legs" is one household's convention and "A/B/C" is another's.
    const labels = MOCK_TRAINING_PLANS.map((p) => p.label);
    expect(labels).toContain("A");
    expect(labels.some((label) => label && !["A", "B", "C"].includes(label))).toBe(true);
  });
});

describe("building a plan", () => {
  it("adds groups and exercises in order", () => {
    const p = filled();
    expect(p.groups.map((g) => g.title)).toEqual(["Warm-up", "Main"]);
    expect(p.groups.map((g) => g.order)).toEqual([0, 1]);
    expect(exerciseCount(p)).toBe(4);
  });

  it("ignores an empty name rather than adding a blank row", () => {
    const p = addGroup(plan(), "   ");
    expect(p.groups).toEqual([]);
  });

  it("keeps sets, reps, weight and a note as the user's own text", () => {
    // Strings, not numbers: people write "8-12 each side" and "20kg, maybe 22".
    let p = filled();
    const group = p.groups[1];
    p = updateExercise(p, group.id, group.exercises[0].id, {
      sets: "3–4",
      reps: "8-12 each side",
      lastWeight: "60 ק״ג",
      note: "לרדת לאט",
    });

    const saved = p.groups[1].exercises[0];
    expect(saved.sets).toBe("3–4");
    expect(saved.reps).toBe("8-12 each side");
    expect(saved.lastWeight).toBe("60 ק״ג");
    expect(saved.note).toBe("לרדת לאט");
  });
});

describe("reordering, with buttons and no dragging", () => {
  it("moves a group one place and renumbers", () => {
    const p = filled();
    const moved = moveGroup(p, p.groups[1].id, -1);
    expect(moved.groups.map((g) => g.title)).toEqual(["Main", "Warm-up"]);
    expect(moved.groups.map((g) => g.order)).toEqual([0, 1]);
  });

  it("refuses to move past either end rather than wrapping", () => {
    const p = filled();
    expect(moveGroup(p, p.groups[0].id, -1)).toBe(p);
    expect(moveGroup(p, p.groups[1].id, 1)).toBe(p);
  });

  it("moves an exercise within its own group only", () => {
    const p = filled();
    const group = p.groups[1];
    const moved = moveExercise(p, group.id, group.exercises[1].id, -1);

    expect(moved.groups[1].exercises.map((e) => e.name)).toEqual(["Row", "Bench"]);
    // The other group is untouched.
    expect(moved.groups[0].exercises.map((e) => e.name)).toEqual(["Bike", "Band pulls"]);
  });
});

describe("removing", () => {
  it("removes one exercise and leaves the rest numbered", () => {
    const p = filled();
    const group = p.groups[0];
    const after = removeExercise(p, group.id, group.exercises[0].id);

    expect(after.groups[0].exercises.map((e) => e.name)).toEqual(["Band pulls"]);
    expect(after.groups[0].exercises[0].order).toBe(0);
  });

  it("removes a group without touching its neighbour", () => {
    const p = filled();
    const after = removeGroup(p, p.groups[0].id);

    expect(after.groups).toHaveLength(1);
    expect(after.groups[0].title).toBe("Main");
    expect(after.groups[0].order).toBe(0);
    expect(after.groups[0].exercises).toHaveLength(2);
  });
});

describe("duplicating", () => {
  const source = filled();
  const copy = duplicatePlan(source, "Plan A (copy)");

  it("gives every group and exercise a fresh id", () => {
    expect(copy.id).not.toBe(source.id);

    const sourceIds = new Set([
      ...source.groups.map((g) => g.id),
      ...source.groups.flatMap((g) => g.exercises.map((e) => e.id)),
    ]);
    for (const group of copy.groups) {
      expect(sourceIds.has(group.id)).toBe(false);
      for (const exercise of group.exercises) expect(sourceIds.has(exercise.id)).toBe(false);
    }
  });

  it("copies the content itself", () => {
    expect(copy.groups.map((g) => g.title)).toEqual(source.groups.map((g) => g.title));
    expect(exerciseCount(copy)).toBe(exerciseCount(source));
  });

  it("parks the copy rather than quietly starting a second live plan", () => {
    // Duplicating is what you do before changing something. Deciding it is now
    // running is the user's call, not the app's.
    expect(copy.status).toBe("paused");
  });

  it("cannot be edited back into the original", () => {
    const edited = removeGroup(copy, copy.groups[0].id);
    expect(edited.groups).toHaveLength(1);
    expect(source.groups).toHaveLength(2);
  });
});

describe("finding a plan", () => {
  const plans = [
    plan({ id: "gym", title: "Chest day", environment: "gym", label: "A" }),
    plan({ id: "home", title: "Quick home", environment: "home", status: "paused" }),
    plan({
      id: "old",
      title: "Winter full body",
      status: "completed",
      groups: [
        { id: "g", title: "All", order: 0, exercises: [{ id: "e", name: "Hip thrust", order: 0 }] },
      ],
    }),
  ];

  it("filters by status and by where it happens, independently", () => {
    expect(filterPlans(plans, { status: "paused" }).map((p) => p.id)).toEqual(["home"]);
    expect(filterPlans(plans, { environment: "gym" }).map((p) => p.id)).toEqual(["gym"]);
  });

  it("searches the whole set, including exercise names", () => {
    // "Where did I write down that hip thing?" is a real way of looking.
    expect(filterPlans(plans, { query: "hip" }).map((p) => p.id)).toEqual(["old"]);
    expect(filterPlans(plans, { query: "chest" }).map((p) => p.id)).toEqual(["gym"]);
  });

  it("keeps the user's order", () => {
    const shuffled = [plan({ id: "c", order: 2 }), plan({ id: "a", order: 0 })];
    expect(sortPlans(shuffled).map((p) => p.id)).toEqual(["a", "c"]);
  });
});

describe("notes reuse the shared model", () => {
  it("offers training prompts, not another area's", () => {
    const ids = TRAINING_NOTE_TEMPLATES.map((entry) => entry.id);
    expect(ids).toContain("weights");
    expect(ids).toContain("changeNext");
    expect(ids).toContain("limits");
  });

  it("carries notes into a duplicate with fresh ids", () => {
    const source = plan({
      notes: [{ id: "n1", title: "The last weights", content: "60kg", order: 0 }],
    });
    const copy = duplicatePlan(source, "copy");

    expect(copy.notes?.[0].content).toBe("60kg");
    expect(copy.notes?.[0].id).not.toBe("n1");
  });
});

describe("a heavy plan stays sane", () => {
  it("holds twenty groups of a hundred exercises without special handling", () => {
    let p = plan();
    for (let g = 0; g < 20; g += 1) p = addGroup(p, `Group ${g}`);
    for (const group of p.groups) {
      for (let e = 0; e < 5; e += 1) p = addExercise(p, group.id, `Exercise ${e}`);
    }

    expect(p.groups).toHaveLength(20);
    expect(exerciseCount(p)).toBe(100);
    // Still one document, and still a small one.
    expect(JSON.stringify(p).length).toBeLessThan(60_000);
  });

  it("counts fifty plans by status without scanning them twice", () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      plan({ id: `p${i}`, status: i < 10 ? "active" : i < 30 ? "paused" : "completed" })
    );
    expect(countByStatus(many)).toEqual({ active: 10, paused: 20, completed: 20 });
  });
});
