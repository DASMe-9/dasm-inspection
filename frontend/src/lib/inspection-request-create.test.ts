import { describe, expect, it } from "vitest";
import {
  normalizeCreateRequestInput,
  resolveCreateRequestIdentity,
} from "./inspection-request-create";

describe("resolveCreateRequestIdentity", () => {
  it("binds a DASM customer to the verified user and ignores a forged field", () => {
    expect(
      resolveCreateRequestIdentity({
        jwtEnforced: true,
        context: { userId: "322", inspectionRole: "dasm_user" },
        requestedDasmUserId: "999",
      })
    ).toEqual({
      dasmUserId: "322",
      actorRole: "dasm_user",
      requiresOperationalAuthorization: false,
    });
  });

  it("keeps operational creation behind the existing authorization gate", () => {
    expect(
      resolveCreateRequestIdentity({
        jwtEnforced: true,
        context: { userId: "7", inspectionRole: "inspection_admin" },
        requestedDasmUserId: "322",
      }).requiresOperationalAuthorization
    ).toBe(true);
  });
});

describe("normalizeCreateRequestInput", () => {
  it("derives a useful title from the vehicle description", () => {
    const result = normalizeCreateRequestInput({
      title: "",
      vehicleLabel: "تويوتا كامري 2022",
      preferredServiceMode: "workshop",
      fieldServiceAddress: "",
      preferredSlotAt: "2099-06-12T10:30:00.000Z",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        title: "طلب فحص — تويوتا كامري 2022",
        vehicleLabel: "تويوتا كامري 2022",
        serviceMode: "workshop",
        fieldServiceAddress: null,
        preferredSlotAt: "2099-06-12T10:30:00.000Z",
      },
    });
  });

  it("requires a specific future appointment", () => {
    expect(
      normalizeCreateRequestInput({
        title: "",
        vehicleLabel: "تويوتا كامري 2022",
        preferredServiceMode: "workshop",
        fieldServiceAddress: "",
        preferredSlotAt: "",
      })
    ).toEqual({ ok: false, message: "اختر تاريخ ووقت الموعد." });

    expect(
      normalizeCreateRequestInput({
        title: "",
        vehicleLabel: "تويوتا كامري 2022",
        preferredServiceMode: "workshop",
        fieldServiceAddress: "",
        preferredSlotAt: "2020-01-01T10:00:00.000Z",
      })
    ).toEqual({ ok: false, message: "اختر موعداً مستقبلياً للفحص." });
  });

  it("requires an address for field inspection", () => {
    expect(
      normalizeCreateRequestInput({
        title: "",
        vehicleLabel: "كيا كادينزا",
      preferredServiceMode: "field",
      fieldServiceAddress: "",
      preferredSlotAt: "2099-06-12T10:30:00.000Z",
      })
    ).toEqual({
      ok: false,
      message: "أدخل عنوان الفحص الميداني حتى تتمكن الورشة من خدمتك.",
    });
  });

  it("drops a field address when workshop service is selected", () => {
    const result = normalizeCreateRequestInput({
      title: "فحص قبل الشراء",
      vehicleLabel: "هيونداي سوناتا",
      preferredServiceMode: "workshop",
      fieldServiceAddress: "الرياض",
      preferredSlotAt: "2099-06-12T10:30:00.000Z",
    });

    expect(result.ok && result.value.fieldServiceAddress).toBeNull();
  });
});
