// Composables
import { Ref, ref } from "vue";

// Composables
import { usePlanCalculation } from "@/features/planning/usePlanCalculation";
import { useBuildingData } from "@/database/services/useBuildingData";

// Util
import { deepClone } from "@/util/data";

// Static
import { optimalProduction } from "@/features/roi_overview/assets/optimalProduction";

// Types & Interfaces
import { IPlan, PLAN_COGCPROGRAM_TYPE } from "@/stores/planningStore.types";
import { IRecipe } from "@/features/api/gameData.types";
import {
	IROIResult,
	IStaticOptimalProduction,
} from "@/features/roi_overview/useROIOverview.types";
import { until } from "@vueuse/core";

export async function useROIOverview(
	definition: Ref<IPlan>,
	cxUuid: Ref<string | undefined>
) {
	const { getBuilding, getBuildingRecipes } = await useBuildingData();

	// Filter for all non-extracting and non-fertility needing buildings
	const filteredOptimalProduction = optimalProduction.filter(
		(e) => !["RIG", "EXT", "COL", "FRM"].includes(e.ticker)
	);

	const resultData: Ref<IROIResult[]> = ref([]);

	/**
	 * Calculates a single optimal building with all its recipe options
	 * @author jplacht
	 *
	 * @async
	 * @param {IStaticOptimalProduction} optimal Optimal Building Setup
	 * @returns {Promise<void>} Void, adds to resultData directly
	 */
	async function calculateItem(
		optimal: IStaticOptimalProduction
	): Promise<IROIResult[]> {
		// get a deep copy of the definition as otherwise parallel runs would
		// overwrite each other in terms of setup
		const definitionCopy = deepClone(definition.value);

		const buildingRecipes: IRecipe[] = await getBuildingRecipes(
			optimal.ticker,
			[]
		);

		// get building data
		const building = await getBuilding(optimal.ticker);

		const itemResults: IROIResult[] = [];

		for (const recipe of buildingRecipes) {
			// as we're using production buildings, they all have a COGC
			definitionCopy.baseplanner_data.planet.cogc =
				`${building.Expertise}` as PLAN_COGCPROGRAM_TYPE;

			// set building
			definitionCopy.baseplanner_data.buildings = [
				{
					name: optimal.ticker,
					amount: optimal.amount,
					active_recipes: [],
				},
			];

			// set infrastructure
			definitionCopy.baseplanner_data.infrastructure = [
				{ building: "HB1", amount: optimal.HB1 },
				{ building: "HB2", amount: optimal.HB2 },
				{ building: "HB3", amount: optimal.HB3 },
				{ building: "HB4", amount: optimal.HB4 },
				{ building: "HB5", amount: optimal.HB5 },
				{ building: "HBB", amount: optimal.HBB },
				{ building: "HBC", amount: optimal.HBC },
				{ building: "HBM", amount: optimal.HBM },
				{ building: "HBL", amount: optimal.HBL },
				{ building: "STO", amount: optimal.sto },
			];

			// set recipe
			definitionCopy.baseplanner_data.buildings[0].active_recipes = [
				{
					recipeid: recipe.RecipeId,
					amount: 1,
				},
			];

			const calculation = await usePlanCalculation(
				ref(definitionCopy),
				undefined,
				undefined,
				cxUuid
			);
			const result = await calculation.calculate();

			const overviewData = await until(calculation.overviewData).toMatch(
				(v) => v.roi !== Infinity
			);

			itemResults.push({
				buildingTicker: optimal.ticker,
				optimalSetup: optimal,
				recipeId: recipe.RecipeId,
				recipeInputs: recipe.Inputs,
				recipeOutputs: recipe.Outputs,
				cogc: result.cogc,
				cogm: result.production.buildings[0].activeRecipes[0].cogm,
				outputProfit:
					result.production.buildings[0].activeRecipes[0].cogm
						?.totalProfit ?? 0,
				dailyProfit: overviewData.profit,
				planCost: overviewData.totalConstructionCost,
				planROI: overviewData.roi,
			});
		}

		return itemResults;
	}

	/**
	 * Triggers calculation of all optimal definitions
	 * @author jplacht
	 *
	 * @async
	 * @returns {Promise<IROIResult[]>} ROI results
	 */
	async function calculate(): Promise<IROIResult[]> {
		resultData.value = [];

		// set all the experts to 5
		definition.value.baseplanner_data.planet.experts.forEach(
			(expert) => (expert.amount = 5)
		);

		// do calculations in parallel
		const nestedResults = await Promise.all(
			filteredOptimalProduction.map((optimal) => calculateItem(optimal))
		);

		const results = nestedResults.flat();
		resultData.value = results;

		return results;
	}

	/**
	 * Formats an optimal production setup into comma separated string list
	 * for building and its amount as well as non-zero infrastructures
	 *
	 * @author jplacht
	 *
	 * @param {IStaticOptimalProduction} optimal Optimal Building Setup
	 * @returns {string} Formatted string
	 */
	function formatOptimal(optimal: IStaticOptimalProduction): string {
		const skipKeys = ["total_area", "ticker", "amount"];

		const prefix = `${optimal.amount}x ${optimal.ticker}`;

		const infrastructure = Object.entries(optimal)
			.filter(
				([key, value]) => !skipKeys.includes(key) && Number(value) !== 0
			)
			.sort((a, b) => (a > b ? 1 : -1))
			.map(([key, value]) => `${value}x ${key.toUpperCase()}`);

		return [prefix, ...infrastructure].join(", ");
	}

	return {
		resultData,
		calculate,
		calculateItem,
		formatOptimal,
	};
}
