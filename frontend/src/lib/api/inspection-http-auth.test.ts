import { describe, expect, it } from "vitest";
import { mapProfilePayload } from "./inspection-http-auth";

describe("mapProfilePayload", () => {
  it("maps the central DASM identity fields needed by Inspection", () => {
    const profile = mapProfilePayload({
      id: 13,
      first_name: "محمد",
      last_name: "العتيق",
      email: "user@example.com",
      phone: "+966500000000",
      email_verified_at: "2026-09-25T10:00:00Z",
      phone_verified_at: null,
      address: {
        area_label: "مكة المكرمة",
        city: "جدة",
        district: "السلامة",
        confirmed: true,
        national_address_short: "ABCD1234",
        national_address_status: "verified",
      },
    });

    expect(profile).toMatchObject({
      id: "13",
      firstName: "محمد",
      lastName: "العتيق",
      email: "user@example.com",
      phone: "+966500000000",
      emailVerified: true,
      phoneVerified: false,
      address: {
        areaLabel: "مكة المكرمة",
        city: "جدة",
        district: "السلامة",
        confirmed: true,
        nationalAddressShort: "ABCD1234",
        nationalAddressStatus: "verified",
      },
    });
  });
});
