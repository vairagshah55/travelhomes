import { describe, it, expect } from "vitest";
import {
  defaultVehicleFormData,
  vehicleEnumFields,
  type FormData,
} from "./vehicleConfig";

/**
 * `POST /api/onboarding/vehicle` returned 422 on every submission.
 *
 * All four enum paths on `VehicleOnboarding` are typed `X | ""` on the form and
 * seeded `""`, and the submit payload spreads `...formData`. Mongoose treats
 * `""` as a value that is SET but absent from the enum, so the document failed
 * validation and the error middleware turned that into a 422 for the whole
 * submission — naming no field the vendor could act on. Because the wizard
 * never renders fuelPolicy or tollsAndParking, `fuelPolicy: ""` went out every
 * single time.
 */
const form = (over: Partial<FormData> = {}): FormData => ({
  ...defaultVehicleFormData,
  ...over,
});

/** How the payload actually reaches the server: fetch + JSON.stringify. */
const asSent = (payload: Record<string, any>) => JSON.parse(JSON.stringify(payload));

describe("vehicleEnumFields", () => {
  it("omits every unanswered enum rather than sending an empty string", () => {
    const sent = asSent(vehicleEnumFields(form()));
    expect(sent).toEqual({});
  });

  it("keeps a value the vendor did pick", () => {
    const sent = asSent(
      vehicleEnumFields(form({ fuelType: "Diesel", transmission: "Automatic" })),
    );
    expect(sent).toEqual({ fuelType: "Diesel", transmission: "Automatic" });
  });

  it("keeps a running-cost policy restored from a draft", () => {
    const sent = asSent(
      vehicleEnumFields(form({ fuelPolicy: "same-to-same", tollsAndParking: "included" })),
    );
    expect(sent).toEqual({ fuelPolicy: "same-to-same", tollsAndParking: "included" });
  });

  /**
   * The reason the original guard did not work. It was written as
   * `...(formData.fuelPolicy ? { fuelPolicy } : {})` AFTER `...formData`, and
   * spreading `{}` does not remove a key an earlier spread already set — so the
   * empty string survived and the guard was inert. Overriding with `undefined`
   * is what actually removes it, because JSON.stringify omits undefined.
   */
  it("removes the key from a payload that already spread the blank form", () => {
    const inert = { ...form(), ...(form().fuelPolicy ? { fuelPolicy: "included" } : {}) };
    expect(asSent(inert).fuelPolicy).toBe("");

    const fixed = { ...form(), ...vehicleEnumFields(form()) };
    expect("fuelPolicy" in asSent(fixed)).toBe(false);
    expect("fuelType" in asSent(fixed)).toBe(false);
  });
});
