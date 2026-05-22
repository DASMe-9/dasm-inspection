import { describe, expect, it } from "vitest";
import { resolveRequestListScope } from "./request-list-scope";

const workshops = [
  { id: "11111111-1111-4111-8111-111111111111", name: "ورشة أ" },
  { id: "22222222-2222-4222-8222-222222222222", name: "ورشة ب" },
];

describe("resolveRequestListScope", () => {
  it("forces workshop filter for workshop_owner", () => {
    const wid = "11111111-1111-4111-8111-111111111111";
    const scope = resolveRequestListScope({
      persona: {
        persona: "workshop_owner",
        platformUserId: "u1",
        trust: "jwt",
      },
      parsedQuery: {
        sort: "updated_desc",
        workshopId: "22222222-2222-4222-8222-222222222222",
      },
      authWorkshopId: wid,
      authInspectorRecordId: null,
      workshops,
    });
    expect(scope.listOpts.workshopId).toBe(wid);
    expect(scope.showWorkshopFilter).toBe(false);
    expect(scope.lockedWorkshopName).toBe("ورشة أ");
  });

  it("scopes inspector to inspector record", () => {
    const scope = resolveRequestListScope({
      persona: {
        persona: "inspector",
        platformUserId: "u2",
        trust: "jwt",
      },
      parsedQuery: { sort: "updated_desc" },
      authWorkshopId: null,
      authInspectorRecordId: "insp-1",
      workshops,
    });
    expect(scope.listOpts.inspectorId).toBe("insp-1");
    expect(scope.scopedNote).toContain("مفتش");
  });
});
