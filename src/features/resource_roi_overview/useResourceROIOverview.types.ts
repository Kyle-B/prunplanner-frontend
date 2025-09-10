import { IProductionBuildingRecipeCOGM } from "@/features/planning/usePlanCalculation.types";
import { PLANET_COGCPROGRAM_TYPE } from "@/features/api/gameData.types";

export interface IResourceROIResult {
	planetNaturalId: string;
	planetName: string;
	buildingTicker: string;
	dailyYield: number;
	percentMaxDailyYield: number;
	cogm: IProductionBuildingRecipeCOGM | undefined;
	outputProfit: number;
	dailyProfit: number;
	planCost: number;
	planROI: number;
	distanceAI1: number;
	distanceCI1: number;
	distanceIC1: number;
	distanceNC1: number;
	planetSurface: string[];
	planetGravity: string[];
	planetPressure: string[];
	planetTemperature: string[];
	planetCOGC: PLANET_COGCPROGRAM_TYPE | null;
	planetInfrastructures: string[];
}
