import { PLAN_COGCPROGRAM_TYPE } from "@/stores/planningStore.types";
import { IRecipeMaterial } from "../api/gameData.types";
import { IProductionBuildingRecipeCOGM } from "../planning/usePlanCalculation.types";

export type IStaticOptimalProduction = {
	ticker: string;
	amount: number;
	sto: number;
	total_area: number;
	HB1: number;
	HB2: number;
	HB3: number;
	HB4: number;
	HB5: number;
	HBB: number;
	HBC: number;
	HBM: number;
	HBL: number;
};

export interface IROIResult {
	buildingTicker: string;
	optimalSetup: IStaticOptimalProduction;
	recipeId: string;
	recipeInputs: IRecipeMaterial[];
	recipeOutputs: IRecipeMaterial[];
	cogc: PLAN_COGCPROGRAM_TYPE;
	cogm: IProductionBuildingRecipeCOGM | undefined;
	outputProfit: number;
	dailyProfit: number;
	planCost: number;
	planROI: number;
}
