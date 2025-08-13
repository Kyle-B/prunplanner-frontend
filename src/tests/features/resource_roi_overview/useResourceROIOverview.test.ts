import { ref } from "vue";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import AxiosMockAdapter from "axios-mock-adapter";
import axiosSetup from "@/util/axiosSetup";

// Services
import { apiService } from "@/lib/apiService";

// Composables
import { useResourceROIOverview } from "@/features/resource_roi_overview/useResourceROIOverview";

// stores
import { useGameDataStore } from "@/stores/gameDataStore";

// test data
import recipes from "@/tests/test_data/api_data_recipes.json";
import buildings from "@/tests/test_data/api_data_buildings.json";
import materials from "@/tests/test_data/api_data_materials.json";
import exchanges from "@/tests/test_data/api_data_exchanges.json";
import planet_etherwind from "@/tests/test_data/api_data_planet_etherwind.json";
import planet_search_results from "@/tests/test_data/api_data_planet_search.json";

// mock apiService client
const mock = new AxiosMockAdapter(apiService.client);

describe("useResourceROIOverview", async () => {
	beforeAll(() => {
		setActivePinia(createPinia());
		axiosSetup();

		const gameDataStore = useGameDataStore();

		gameDataStore.setMaterials(materials);
		gameDataStore.setExchanges(exchanges);
		gameDataStore.setRecipes(recipes);
		// @ts-expect-error mock data
		gameDataStore.setBuildings(buildings);
	});

	it("searchPlanets", async () => {
		mock.onPost("/data/planet/search").reply(200, planet_search_results);

		const { searchPlanets } = useResourceROIOverview();

		const result = await searchPlanets("N");

		expect(result.length).toBe(60);
	});

	it("calculate", async () => {
		mock.onPost("/data/planet/search").reply(200, [planet_etherwind]);

		const { calculate } = useResourceROIOverview();

		const result = await calculate("H2O");

		expect(result.length).toBe(1);
		expect(result[0].buildingTicker).toBe("RIG");
		expect(result[0].dailyYield).toBe(2359.3500937521458);
		expect(result[0].dailyProfit).toBe(69531.18805678377);
		expect(result[0].planetSurface.length).toBe(1);
	});
});
