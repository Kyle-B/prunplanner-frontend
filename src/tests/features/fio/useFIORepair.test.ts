import { ref } from "vue";
import { beforeAll, describe, expect, it } from "vitest";

// Stores
import { useGameDataStore } from "@/stores/gameDataStore";
import { createPinia, setActivePinia } from "pinia";

import fio_sites from "@/tests/test_data/api_data_fio_sites.json";
import { useFIORepair } from "@/features/fio/useFIORepair";

describe("useFIORepair", async () => {
	let gameDataStore: any;

	const test_planets = ref(fio_sites.planets);
	const test_ships = ref(fio_sites.ships);

	beforeAll(() => {
		setActivePinia(createPinia());
		gameDataStore = useGameDataStore();
	});

	it("isInfrastructureBuilding", async () => {
		const { isInfrastructureBuilding } = useFIORepair(
			// @ts-expect-error mock data
			test_planets,
			test_ships
		);

		expect(isInfrastructureBuilding("POL")).toBeFalsy();
		expect(isInfrastructureBuilding("HB1")).toBeTruthy();
		expect(isInfrastructureBuilding("HBL")).toBeTruthy();
		expect(isInfrastructureBuilding("STO")).toBeTruthy();
		expect(isInfrastructureBuilding("CM")).toBeTruthy();
	});

	it("planetRepairTable", async () => {
		const { planetRepairTable } = useFIORepair(
			// @ts-expect-error mock data
			test_planets,
			test_ships
		);

		const result = planetRepairTable.value;

		expect(result.length).toBe(18);
		expect(result[0].amountBuildings).toBe(29);
		expect(result[0].amountProductionBuildings).toBe(17);
		expect(result[0].minCondition).toBe(0.8522478342056274);
		expect(result[0].averageCondition).toBe(0.8522478342056274);
		expect(result[0].maxLastRepairDays).toBe(83);
	});

	it("shipRepairTable", async () => {
		const { shipRepairTable } = useFIORepair(
			// @ts-expect-error mock data
			test_planets,
			test_ships
		);

		const result = shipRepairTable.value;

		expect(result.length).toBe(24);
		expect(result[0].condition).toBe(0.88849937915802);
		expect(result[0].repairMaterials.length).toBe(4);
	});
});
