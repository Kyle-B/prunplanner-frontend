import { computed, ComputedRef } from "vue";

import { materialsStore } from "@/database/stores";
import { useDB } from "@/database/composables/useDB";

import { IMaterial } from "@/features/api/gameData.types";
import { PSelectOption } from "@/ui/ui.types";

const materialCache = new Map<string, IMaterial>();
const materialClassCache = new Map<string, string>();

export function useMaterialData() {
	const {
		allData,
		get,
		preload: storePreload,
	} = useDB(materialsStore, "Ticker");

	async function preload(): Promise<void> {
		if (!allData.value || allData.value.length === 0) {
			await storePreload();
		}
	}

	// reactive caches
	const materialsMap = computed((): Record<string, IMaterial> => {
		return allData.value
			? allData.value.reduce((acc, mat) => {
					acc[mat.Ticker] = mat;
					return acc;
			  }, {} as Record<string, IMaterial>)
			: {};
	});

	async function getMaterial(ticker: string): Promise<IMaterial> {
		if (materialCache.has(ticker)) return materialCache.get(ticker)!;

		const material = await get(ticker);

		if (!material) {
			throw new Error(`Material ${ticker} not available.`);
		}

		materialCache.set(ticker, material);
		return material;
	}

	const materialSelectOptions: ComputedRef<PSelectOption[]> = computed(() =>
		allData.value
			? allData.value.map((m) => ({ label: m.Ticker, value: m.Ticker }))
			: []
	);

	function getMaterialClass(ticker: string): string {
		if (materialClassCache.has(ticker))
			return materialClassCache.get(ticker)!;

		const material = materialsMap.value[ticker];

		if (!material)
			throw new Error(`Material ${ticker} not available. Preload.`);

		const classString = `material-category-${material.CategoryName.replaceAll(
			" ",
			"-"
		)
			.replaceAll("(", "")
			.replaceAll(")", "")}`;

		materialClassCache.set(ticker, classString);
		return classString;
	}

	return {
		materials: allData,
		materialsMap,
		materialSelectOptions,
		getMaterial,
		preload,
		getMaterialClass,
	};
}
