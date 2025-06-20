import { computed, ComputedRef, Ref } from "vue";

// Stores
import { useGameDataStore } from "@/stores/gameDataStore";

// Types & Interfaces
import { IPlanResult } from "@/features/planning/usePlanCalculation.types";
import { IFIOStoragePlanet } from "@/features/api/gameData.types";
import { IPlan } from "@/stores/planningStore.types";
import {
	IFIOBurnPlanetTableElement,
	IFIOBurnTableElement,
	IFIOBurnTableElementMaterial,
} from "@/features/fio/useFIOBurn.types";

export function useFIOBurn(
	plans: Ref<IPlan[]>,
	data: Ref<Record<string, IPlanResult>>
) {
	const gameDataStore = useGameDataStore();

	const burnData: Record<string, IFIOStoragePlanet> =
		gameDataStore.fio_storage_planets;

	const planRecord: ComputedRef<Record<string, IPlan>> = computed(() => {
		return plans.value.reduce(
			(acc, item) => ((acc[item.uuid!] = item), acc),
			{} as Record<string, IPlan>
		);
	});

	const planTable: ComputedRef<IFIOBurnPlanetTableElement[]> = computed(
		() => {
			const table: IFIOBurnPlanetTableElement[] = burnTable.value.map(
				(p) => {
					return {
						planUuid: p.planUuid,
						planName: p.planName,
						planetId: p.planetId,
						minDays: p.minDays,
					};
				}
			);

			// sort by planName
			table.sort((a, b) => (a.planName > b.planName ? 1 : -1));

			return table;
		}
	);

	const burnTable: ComputedRef<IFIOBurnTableElement[]> = computed(() => {
		const tableData: IFIOBurnTableElement[] = [];

		for (const [planUuid, plan] of Object.entries(data.value) as [
			string,
			IPlanResult,
		][]) {
			const planData: IPlan = planRecord.value[planUuid];
			const hasStorage: boolean = burnData[planData.planet_id]
				? true
				: false;

			const elementData: IFIOBurnTableElement = {
				key: planUuid,
				planUuid: planUuid,
				planName: planData.name ?? "Unnamed",
				planetId: planData.planet_id,
				hasStorage,
				burnMaterials: [] as IFIOBurnTableElementMaterial[],
				minDays: 0,
			};

			let minDays: number = Infinity;

			// do burn analysis
			plan.materialio.forEach((m) => {
				let stock: number = 0;

				if (hasStorage && burnData[planData.planet_id]) {
					const found = burnData[
						planData.planet_id
					].StorageItems.find((bi) => bi.MaterialTicker === m.ticker);

					if (found) {
						stock = found.MaterialAmount;
					}
				}

				let exhaustion: number = Infinity;

				if (m.delta < 0) {
					exhaustion = stock / (m.delta * -1);
				}

				if (exhaustion < minDays) minDays = exhaustion;

				elementData.burnMaterials.push({
					ticker: m.ticker,
					input: m.input,
					output: m.output,
					delta: m.delta,
					stock: stock,
					exhaustion: exhaustion,
				});

				elementData.minDays = minDays;
			});

			tableData.push(elementData);
		}

		// sort by plan name
		tableData.sort((a, b) => (a.planName > b.planName ? 1 : -1));

		return tableData;
	});

	return {
		burnTable,
		planTable,
	};
}
