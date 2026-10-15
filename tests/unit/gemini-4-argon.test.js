// Gemini 4 Argon (2026-10): unified 1M window, tunable thinking low|medium|high
// (no minimal), paid only, intro pricing $2/$10. Regression coverage for the
// registry/capabilities/pricing wiring.
import { describe, it, expect } from "vitest";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";
import { getThinkingLevels } from "../../open-sse/providers/thinkingLevels.js";
import { getPricingForModel } from "../../open-sse/providers/pricing.js";
import { applyThinking } from "../../open-sse/translator/concerns/thinkingUnified.js";
import { getModelsByProviderId } from "../../open-sse/config/providerModels.js";

describe("gemini-4-argon wiring", () => {
  it("caps: reasoning, gemini-level, cannot disable, 1M window", () => {
    const c = getCapabilitiesForModel("gemini", "gemini-4-argon");
    expect(c.reasoning).toBe(true);
    expect(c.vision).toBe(true);
    expect(c.thinkingFormat).toBe("gemini-level");
    expect(c.thinkingCanDisable).toBe(false);
    expect(c.contextWindow).toBe(1048576);
    expect(c.maxOutput).toBe(65536);
  });

  it("thinking levels are low|medium|high only", () => {
    expect(getThinkingLevels("gemini", "gemini-4-argon")).toEqual(["low", "medium", "high"]);
  });

  it("unsupported levels clamp to the nearest advertised level", () => {
    const body = { reasoning_effort: "minimal" };
    applyThinking("gemini", "gemini-4-argon", body, "gemini");
    expect(body.generationConfig.thinkingConfig.thinkingLevel).toBe("low");

    // Gemini 3.x still accepts minimal — untouched.
    const b3 = { reasoning_effort: "minimal" };
    applyThinking("gemini", "gemini-3.8-flash", b3, "gemini");
    expect(b3.generationConfig.thinkingConfig.thinkingLevel).toBe("minimal");
  });

  it("intro pricing $2/$10 with 95% cache discount", () => {
    expect(getPricingForModel("gemini", "gemini-4-argon")).toEqual({
      input: 2, output: 10, cached: 0.1, reasoning: 10, cache_creation: 2
    });
    // Effort-annotated alias prices at the base rate.
    expect(getPricingForModel("gemini", "gemini-4-argon-high").input).toBe(2);
  });

  it("registered on gemini, vertex, gemini-cli and antigravity", () => {
    for (const p of ["gemini", "vertex", "gemini-cli"]) {
      expect(getModelsByProviderId(p).some((m) => m.id === "gemini-4-argon")).toBe(true);
    }
    expect(getModelsByProviderId("antigravity").some((m) => m.id === "gemini-4-argon")).toBe(true);
  });
});
