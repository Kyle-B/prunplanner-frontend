import { describe, it, expect, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

// Stores
import { usePlanningStore } from "@/stores/planningStore";

// Composables
import { usePlan } from "@/features/planning_data/usePlan";

import {
	callCreatePlan,
	callGetPlan,
	callSavePlan,
	callPatchPlanMaterialIO,
} from "@/features/api/planData.api";
import { apiService } from "@/lib/apiService";
import { IMaterialIO } from "@/features/planning/usePlanCalculation.types";

vi.mock("@/features/api/planData.api", async () => {
	return {
		...(await vi.importActual("@/features/api/planData.api")),
		callGetShared: vi.fn(),
		callCreatePlan: vi.fn(),
		callSavePlan: vi.fn(),
		callGetPlan: vi.fn(),
		callPatchPlanMaterialIO: vi.fn(),
	};
});

vi.mock("@/features/api/gameData.api", async () => {
	return {
		...(await vi.importActual("@/features/api/gameData.api")),
		callDataMaterials: vi.fn(),
		callDataExchanges: vi.fn(),
		callDataRecipes: vi.fn(),
		callDataBuildings: vi.fn(),
		callDataPlanet: vi.fn(),
		callDataMultiplePlanets: vi.fn(),
	};
});

describe("usePlan", async () => {
	setActivePinia(createPinia());
	let planningStore = usePlanningStore();

	it("has shared plan uuid", async () => {
		const { isEditDisabled } = usePlan();

		// @ts-expect-error mock data
		expect(isEditDisabled({ sharedPlanUuid: "foo" })).toBeTruthy();
		// @ts-expect-error mock data
		expect(isEditDisabled({ sharedPlanUuid: undefined })).toBeFalsy();
	});

	it("mapPlanetToPlanType", async () => {
		const { mapPlanetToPlanType } = usePlan();

		expect(mapPlanetToPlanType("ADVERTISING_AGRICULTURE")).toBe(
			"AGRICULTURE"
		);
		expect(mapPlanetToPlanType(null)).toBe("---");
	});

	it("createBlankDefinition", async () => {
		const { createBlankDefinition } = usePlan();

		const result = createBlankDefinition("OT-580b", null);

		expect(result.planet_id).toBe("OT-580b");
		expect(result.baseplanner_data.planet.experts.length).toBe(9);
		expect(result.baseplanner_data.planet.workforce.length).toBe(5);
		expect(result.baseplanner_data.infrastructure.length).toBe(0);
		expect(result.baseplanner_data.buildings.length).toBe(0);
		expect(result.empires.length).toBe(0);
	});

	describe("createNewPlan", async () => {
		const fakeUuid: string = "41094cb6-c4bc-429f-b8c8-b81d02b3811c";

		it("success, uuid return", async () => {
			const { createNewPlan } = usePlan();
			vi.mocked(callCreatePlan).mockResolvedValueOnce({ uuid: fakeUuid });

			// @ts-expect-error mock data
			const result = await createNewPlan({});

			expect(result).toBe(fakeUuid);
		});

		it("failure, undefined return", async () => {
			const { createNewPlan } = usePlan();
			vi.mocked(callCreatePlan).mockRejectedValueOnce(new Error());

			// @ts-expect-error mock data
			await expect(createNewPlan({})).resolves.toBe(undefined);
		});
	});

	describe("saveExistingPlan", async () => {
		const fakeUuid: string = "41094cb6-c4bc-429f-b8c8-b81d02b3811c";

		it("success, uuid return", async () => {
			const { saveExistingPlan } = usePlan();
			vi.mocked(callSavePlan).mockResolvedValueOnce({ uuid: fakeUuid });
			// @ts-expect-error mock data
			vi.mocked(callGetPlan).mockResolvedValueOnce({ uuid: fakeUuid });

			// @ts-expect-error mock data
			const result = await saveExistingPlan({});

			expect(result).toBe(fakeUuid);
		});

		it("failure, undefined return", async () => {
			const { saveExistingPlan } = usePlan();
			vi.mocked(callSavePlan).mockRejectedValueOnce(new Error());

			// @ts-expect-error mock data
			await expect(saveExistingPlan({})).resolves.toBe(undefined);
		});
	});

	it("reloadExistingPlan", async () => {
		const fakeUuid: string = "41094cb6-c4bc-429f-b8c8-b81d02b3811c";
		const { reloadExistingPlan } = usePlan();
		planningStore.getPlan = vi.fn().mockResolvedValue({});

		const result = await reloadExistingPlan(fakeUuid);

		expect(result).toStrictEqual({});
	});

	it("patchMaterialIO", async () => {
		const { patchMaterialIO } = usePlan();
		const fakeMaterialIO: IMaterialIO[] = [
			{
				ticker: "C",
				input: 1,
				output: 2,
				price: 0,
				delta: 0,
				individualWeight: 0,
				individualVolume: 0,
				totalWeight: 0,
				totalVolume: 0,
			},
			{
				ticker: "FEO",
				input: 0,
				output: 100,
				price: 0,
				delta: 0,
				individualWeight: 0,
				individualVolume: 0,
				totalWeight: 0,
				totalVolume: 0,
			},
		];
		vi.mocked(callPatchPlanMaterialIO).mockResolvedValueOnce(true);

		const result = await patchMaterialIO("foo", "moo", fakeMaterialIO);

		expect(callPatchPlanMaterialIO).toBeCalledTimes(1);
		expect(callPatchPlanMaterialIO).toHaveBeenCalledWith([
			{
				material_io: [
					{
						input: 1,
						output: 2,
						ticker: "C",
					},
					{
						input: 0,
						output: 100,
						ticker: "FEO",
					},
				],
				planet_id: "moo",
				uuid: "foo",
			},
		]);

		expect(result).toBeTruthy();
	});

	describe("getPlanNamePlanet", async () => {
		it("unknown plan throws error", async () => {
			const { getPlanNamePlanet } = usePlan();

			expect(() => getPlanNamePlanet("moo")).toThrowError();
		});

		it("known plan returns planetId and planName", async () => {
			// @ts-expect-error mock data
			planningStore.plans["foo"] = {
				planet_id: "1",
				name: "2",
			};

			const { getPlanNamePlanet } = usePlan();

			const { planetId, planName } = getPlanNamePlanet("foo");

			expect(planetId).toBe("1");
			expect(planName).toBe("2");
		});

		it("known plan returns planetId and default planName", async () => {
			// @ts-expect-error mock data
			planningStore.plans["foo"] = {
				planet_id: "1",
			};

			const { getPlanNamePlanet } = usePlan();

			const { planetId, planName } = getPlanNamePlanet("foo");

			expect(planetId).toBe("1");
			expect(planName).toBe("Unnamed");
		});
	});
});
