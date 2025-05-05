import { PLANET_RESOURCETYPE_TYPE } from "@/features/game_data/gameData.types";

const TOTALMSDAY: number = 24 * 60 * 60 * 1000;
const TIME_COL: number = 6 * 60 * 60 * 1000;
const TIME_EXT: number = 12 * 60 * 60 * 1000;
const TIME_RIG: number = 4 * 60 * 60 * 1000 + 48 * 60 * 1000;

const DAILY_TYPE_SHARE: Record<PLANET_RESOURCETYPE_TYPE, number> = {
	MINERAL: TIME_EXT / TOTALMSDAY,
	GASEOUS: TIME_COL / TOTALMSDAY,
	LIQUID: TIME_RIG / TOTALMSDAY,
};

export function calculateExtraction(
	resourceType: PLANET_RESOURCETYPE_TYPE,
	dailyExtraction: number
): { timeMs: number; extractionAmount: number } {
	const dailyShare: number = DAILY_TYPE_SHARE[resourceType];

	// extraction amount is rounded up and truncated
	const extractionAmount: number = Math.trunc(
		Math.ceil(dailyExtraction * dailyShare)
	);
	const timeMs: number = extractionAmount * (TOTALMSDAY / dailyExtraction);

	return {
		timeMs: timeMs,
		extractionAmount: extractionAmount,
	};
}
