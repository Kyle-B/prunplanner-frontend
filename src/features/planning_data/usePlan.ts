import { useQuery } from "@/lib/query_cache/useQuery";
import { useQueryRepository } from "@/lib/query_cache/queryRepository";

import { usePlanningStore } from "@/stores/planningStore";

// Types & Interfaces
import {
	IPlanCreateData,
	IPlanPatchMaterialIOElement,
	IPlanRouteParams,
	IPlanSaveCreateResponse,
} from "@/features/planning_data/usePlan.types";
import { PLANET_COGCPROGRAM_TYPE } from "@/features/api/gameData.types";
import { IPlan, PLAN_COGCPROGRAM_TYPE } from "@/stores/planningStore.types";
import { IMaterialIO } from "@/features/planning/usePlanCalculation.types";

export function usePlan() {
	const planningStore = usePlanningStore();

	/**
	 * Checks if route parameters contain the uuid of a
	 * shared plan, if so the whole plan is read-only
	 *
	 * @author jplacht
	 *
	 * @param {IPlanRouteParams} routeParams Route Parameters
	 * @returns {boolean} True if shared uuid is present
	 */
	function isEditDisabled(routeParams: IPlanRouteParams): boolean {
		if (routeParams.sharedPlanUuid) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Maps planets COGC Program Type to Plans COGC Program Type
	 *
	 * @author jplacht
	 *
	 * @param {(PLANET_COGCPROGRAM_TYPE | null | undefined)} input Planet COGC Type
	 * @returns {PLAN_COGCPROGRAM_TYPE} Plan COGC Type
	 */
	function mapPlanetToPlanType(
		input: PLANET_COGCPROGRAM_TYPE | null | undefined
	): PLAN_COGCPROGRAM_TYPE {
		if (!input) return "---";
		const parts = input.split("_");
		return parts.slice(1).join("_").toUpperCase() as PLAN_COGCPROGRAM_TYPE;
	}

	/**
	 * Generates a new plan definition from Planet Natural Id
	 *
	 * @author jplacht
	 *
	 * @param {string} planetNaturalId Planet Natural Id (e.g. 'OT-580b')
	 * @param {(PLANET_COGCPROGRAM_TYPE | null)} cogc Planet COGC
	 * @returns {IPlan} Blank plan definition
	 */
	function createBlankDefinition(
		planetNaturalId: string,
		cogc: PLANET_COGCPROGRAM_TYPE | null
	): IPlan {
		return {
			name: undefined,
			uuid: undefined,
			planet_id: planetNaturalId,
			faction: "NONE",
			permits_used: 1,
			permits_total: 3,
			override_empire: false,
			baseplanner_data: {
				planet: {
					planetid: planetNaturalId,
					permits: 1,
					corphq: false,
					cogc: mapPlanetToPlanType(cogc),
					experts: [
						{
							type: "Agriculture",
							amount: 0,
						},
						{
							type: "Chemistry",
							amount: 0,
						},
						{
							type: "Construction",
							amount: 0,
						},
						{
							type: "Electronics",
							amount: 0,
						},
						{
							type: "Food_Industries",
							amount: 0,
						},
						{
							type: "Fuel_Refining",
							amount: 0,
						},
						{
							type: "Manufacturing",
							amount: 0,
						},
						{
							type: "Metallurgy",
							amount: 0,
						},
						{
							type: "Resource_Extraction",
							amount: 0,
						},
					],
					workforce: [
						{
							type: "pioneer",
							lux1: true,
							lux2: true,
						},
						{
							type: "settler",
							lux1: true,
							lux2: true,
						},
						{
							type: "technician",
							lux1: true,
							lux2: true,
						},
						{
							type: "engineer",
							lux1: true,
							lux2: true,
						},
						{
							type: "scientist",
							lux1: true,
							lux2: true,
						},
					],
				},
				infrastructure: [],
				buildings: [],
			},
			empires: [],
		};
	}

	/**
	 * Creates a new plan and returns the new plans Uuid on a
	 * successful save operation in the backend
	 * @author jplacht
	 *
	 * @async
	 * @param {IPlanCreateData} data Plan Data
	 * @returns {Promise<string | undefined>} Plan Uuid
	 */
	async function createNewPlan(
		data: IPlanCreateData
	): Promise<string | undefined> {
		try {
			const createdData: IPlanSaveCreateResponse = await useQuery(
				useQueryRepository().repository.CreatePlan,
				{ data: data }
			).execute();

			// trigger backend data load
			await useQuery(useQueryRepository().repository.GetPlan, {
				planUuid: createdData.uuid,
			});
			return createdData.uuid;
		} catch (err) {
			console.error(`Error creating plan: ${err}`);
			return undefined;
		}
	}

	/**
	 * Updates an existing plan in the backend api and returns
	 * its uuid again on successful operation in the backend
	 * @author jplacht
	 *
	 * @async
	 * @param {string} planUuid Plan Uuid
	 * @param {IPlanCreateData} data Plan Data
	 * @returns {Promise<string | undefined>} Plan Uuid
	 */
	async function saveExistingPlan(
		planUuid: string,
		data: IPlanCreateData
	): Promise<string | undefined> {
		try {
			const savedData: IPlanSaveCreateResponse = await useQuery(
				useQueryRepository().repository.PatchPlan,
				{
					planUuid: planUuid,
					data: {
						uuid: planUuid,
						...data,
					},
				}
			).execute();

			if (savedData) {
				await useQuery(useQueryRepository().repository.GetPlan, {
					planUuid: savedData.uuid,
				}).execute();
				return savedData.uuid;
			}
		} catch (err) {
			console.error(`Error updating plan: ${err}`);
			return undefined;
		}
	}

	/**
	 * Patch material i/o values for given plan and planet
	 *
	 * @author jplacht
	 *
	 * @async
	 * @param {string} planUuid Plan Uuid
	 * @param {string} planetNaturalId Planet Natural Id
	 * @param {IMaterialIO[]} materialio Calculated Material IO
	 * @returns {Promise<boolean>} Patch Result
	 */
	async function patchMaterialIO(
		planUuid: string,
		planetNaturalId: string,
		materialio: IMaterialIO[]
	): Promise<boolean> {
		return await useQuery(useQueryRepository().repository.PatchMaterialIO, {
			data: [
				{
					uuid: planUuid,
					planet_id: planetNaturalId,
					material_io: materialio.map((e) => ({
						ticker: e.ticker,
						input: e.input,
						output: e.output,
					})),
				} as IPlanPatchMaterialIOElement,
			],
		}).execute();
	}

	/**
	 * Reloading an existing plan is fetching the plan data from
	 * planning store again. The planning view won't persist changes
	 * to the stores data itself.
	 * @author jplacht
	 *
	 * @async
	 * @param {string} planUuid Plan Uuid
	 * @returns {Promise<IPlan>} Plan Data
	 */
	async function reloadExistingPlan(planUuid: string): Promise<IPlan> {
		return await planningStore.getPlan(planUuid);
	}

	/**
	 * Gets a plans name and planet natural id by given Plan UUID
	 * from already loaded plan information
	 * @author jplacht
	 *
	 * @param {string} planUuid Plan Uuid
	 * @returns {{
	 * 			planetId: string;
	 * 			planName: string;
	 * 		}} Planet Natural ID and Plan Name
	 */
	function getPlanNamePlanet(planUuid: string): {
		planetId: string;
		planName: string;
	} {
		const findPlan = planningStore.plans[planUuid];

		if (findPlan)
			return {
				planetId: findPlan.planet_id,
				planName: findPlan.name ?? "Unnamed",
			};

		throw new Error(
			`No data: Plan '${planUuid}'. Ensure Plan uuid is valid and planning data has been loaded.`
		);
	}

	return {
		isEditDisabled,
		mapPlanetToPlanType,
		createBlankDefinition,
		createNewPlan,
		saveExistingPlan,
		reloadExistingPlan,
		getPlanNamePlanet,
		patchMaterialIO,
	};
}
