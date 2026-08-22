import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { ONBOARDING_MODELS, onboardingModelFor } = require("../onboardingModels.js");
const Offer = require("../../models/Offer.js");

const SOURCE_MODEL_ENUM = Offer.schema.path("sourceModel").enumValues;

describe("onboardingModelFor", () => {
  /* The regression guard. Vehicle rental was added to Offer's `sourceModel`
     enum but not to the lookup approvals go through, so approving a vehicle
     left its onboarding doc on "pending" for ever. Adding a service type to
     the enum without adding it here now fails here instead of in production. */
  it("resolves every sourceModel the Offer schema allows", () => {
    const unmapped = SOURCE_MODEL_ENUM.filter((name) => !onboardingModelFor(name));
    expect(unmapped).toEqual([]);
  });

  it("maps vehicle rental — the one that was missing", () => {
    expect(onboardingModelFor("VehicleOnboarding")).toBe(ONBOARDING_MODELS.VehicleOnboarding);
    expect(onboardingModelFor("VehicleOnboarding").modelName).toBe("VehicleOnboarding");
  });

  it("returns the model whose name matches the key, not a neighbouring one", () => {
    for (const [name, model] of Object.entries(ONBOARDING_MODELS)) {
      expect(model.modelName).toBe(name);
    }
  });

  it("returns null for an unknown or absent sourceModel", () => {
    expect(onboardingModelFor("SomethingElse")).toBeNull();
    expect(onboardingModelFor(undefined)).toBeNull();
    expect(onboardingModelFor("")).toBeNull();
  });

  it("carries no key the Offer schema would reject", () => {
    const extra = Object.keys(ONBOARDING_MODELS).filter((k) => !SOURCE_MODEL_ENUM.includes(k));
    expect(extra).toEqual([]);
  });
});
