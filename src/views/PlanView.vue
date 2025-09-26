<script setup lang="ts">
	import {
		computed,
		ComputedRef,
		defineAsyncComponent,
		nextTick,
		PropType,
		ref,
		Ref,
		watch,
	} from "vue";

	// Router
	import router from "@/router";

	// Stores
	import { useUserStore } from "@/stores/userStore";
	const userStore = useUserStore();

	// Types & Interfaces
	import { IPlan, IPlanEmpireElement } from "@/stores/planningStore.types";
	import { IPlanet } from "@/features/api/gameData.types";
	import { INFRASTRUCTURE_TYPE } from "@/features/planning/usePlanCalculation.types";
	import {
		optimizeHabs,
		calculateAvailableArea,
	} from "@/features/planning/calculations/habOptimization";

	// Composables
	import { usePlanetData } from "@/database/services/usePlanetData";
	const { getPlanet } = usePlanetData();
	import { useCXData } from "@/features/cx/useCXData";
	const { findEmpireCXUuid } = useCXData();
	import { usePlanCalculation } from "@/features/planning/usePlanCalculation";
	import { usePlan } from "@/features/planning_data/usePlan";
	const {
		createNewPlan,
		saveExistingPlan,
		reloadExistingPlan,
		patchMaterialIO,
		cloneSharedPlan,
	} = usePlan();
	import { trackEvent } from "@/lib/analytics/useAnalytics";

	// Util
	import { inertClone } from "@/util/data";

	// Components
	import PlanBonuses from "@/features/planning/components/PlanBonuses.vue";
	import PlanArea from "@/features/planning/components/PlanArea.vue";
	import PlanWorkforce from "@/features/planning/components/PlanWorkforce.vue";
	import PlanInfrastructure from "@/features/planning/components/PlanInfrastructure.vue";
	import PlanExperts from "@/features/planning/components/PlanExperts.vue";
	import PlanProduction from "@/features/planning/components/PlanProduction.vue";
	import PlanMaterialIO from "@/features/planning/components/PlanMaterialIO.vue";
	import PlanConfiguration from "@/features/planning/components/PlanConfiguration.vue";
	import PlanOverview from "@/features/planning/components/PlanOverview.vue";
	import HelpDrawer from "@/features/help/components/HelpDrawer.vue";
	const ShareButton = defineAsyncComponent(
		() => import("@/features/sharing/components/SharingButton.vue")
	);

	// UI
	import { PButton, PButtonGroup, PTooltip, PSpin, PIcon } from "@/ui";
	import {
		ShoppingBasketSharp,
		AttachMoneySharp,
		DataSaverOffSharp,
		DataObjectRound,
		SaveSharp,
		ChangeCircleOutlined,
		ContentCopySharp,
	} from "@vicons/material";
	import { onBeforeRouteLeave } from "vue-router";

	const props = defineProps({
		disabled: {
			type: Boolean,
			required: false,
			default: false,
		},
		planData: {
			type: Object as PropType<IPlan>,
			required: true,
		},
		empireList: {
			type: Array as PropType<IPlanEmpireElement[]>,
			required: false,
			default: undefined,
		},
		sharedPlanUuid: {
			type: String,
			required: false,
			default: undefined,
		},
	});

	const refPlanData: Ref<IPlan> = ref(inertClone(props.planData));
	const refEmpireList: Ref<IPlanEmpireElement[] | undefined> = ref(
		props.empireList
	);
	const refEmpireUuid: Ref<string | undefined> = ref(undefined);
	const refCXUuid: Ref<string | undefined> = ref(undefined);

	const calculation = await usePlanCalculation(
		refPlanData,
		refEmpireUuid,
		refEmpireList,
		refCXUuid
	);

	const {
		existing,
		saveable,
		modified,
		result,
		planName,
		backendData,
		computedActiveEmpire,
		planEmpires,
		visitationData,
		overviewData,
		handleResetModified,
		handleUpdateCorpHQ,
		handleUpdateCOGC,
		handleUpdatePermits,
		handleUpdateWorkforceLux,
		handleUpdateInfrastructure,
		handleUpdateExpert,
		handleUpdateBuildingAmount,
		handleDeleteBuilding,
		handleCreateBuilding,
		handleUpdateBuildingRecipeAmount,
		handleDeleteBuildingRecipe,
		handleAddBuildingRecipe,
		handleChangeBuildingRecipe,
		handleChangePlanName,
		handleUpdateAutoOptimizeHabs,
	} = calculation;

	const planetData: IPlanet = await getPlanet(props.planData.planet_id);

	const refMaterialIOShowBasked: Ref<boolean> = ref(false);
	const refMaterialIOSplitted: Ref<boolean> = ref(false);

	/**
	 * Handle initial empire uuid assignment
	 *
	 * Option A: no empire list => undefined
	 * Option B: planData has empires in list, use first uuid
	 * Option C: empire list => use first element
	 * Fallback: undefined
	 */
	if (!props.empireList) {
		refEmpireUuid.value = undefined;
	} else if (planEmpires.value.length > 0) {
		refEmpireUuid.value = planEmpires.value[0].uuid;
		// update cx uuid
		refCXUuid.value = findEmpireCXUuid(refEmpireUuid.value);
	} else if (props.empireList && props.empireList.length > 0) {
		refEmpireUuid.value = props.empireList[0].uuid;
		refCXUuid.value = findEmpireCXUuid(refEmpireUuid.value);
	}

	/**
	 * Tool Setup
	 */

	type toolOptions =
		| "configuration"
		| "visitation-frequency"
		| "repair-analysis"
		| "popr"
		| "optimize-habitation"
		| "supply-cart"
		| "construction-cart"
		| null;
	const refShowTool: Ref<toolOptions> = ref(null);
	if (!refPlanData.value.uuid) {
		refShowTool.value = "configuration";
	}

	function toggleTool(key: toolOptions): void {
		const isVisisble = refShowTool.value === key;
		refShowTool.value = null;
		if (isVisisble) return;

		trackEvent("plan_tool_view", { name: key });
		nextTick(() => {
			key != refShowTool.value
				? (refShowTool.value = key)
				: (refShowTool.value = null);
		});
	}

	/*
	 * NOTE: This is somewhat hacky to prevent a loaded tool component to re-render on prop change.
	 * As most of the props depend on calculation data they're anyway changing with every change
	 * to the plan. v-memo does not work as it would prevent all tool components from only being
	 * rendered once and not receiving a prop update afterwards.
	 * Splitting the component from its actual data, does work and allows any logic or re-execution
	 * solely being handled in the loaded child component that holds the tool. However, two computed
	 * properties are needed instead of one.
	 */

	const compViewToolComponent = computed(() => {
		switch (refShowTool.value) {
			case "visitation-frequency":
				return defineAsyncComponent(
					() =>
						import(
							"@/features/planning/components/tools/PlanVisitationFrequency.vue"
						)
				);
			case "repair-analysis":
				return defineAsyncComponent(
					() =>
						import(
							"@/features/planning/components/tools/PlanRepairAnalysis.vue"
						)
				);

			case "popr":
				return defineAsyncComponent(
					() =>
						import(
							"@/features/planning/components/tools/PlanPOPR.vue"
						)
				);
			case "supply-cart":
				return defineAsyncComponent(
					() =>
						import(
							"@/features/planning/components/tools/PlanSupplyCart.vue"
						)
				);
			case "optimize-habitation":
				return defineAsyncComponent(
					() =>
						import(
							"@/features/planning/components/tools/PlanOptimizeHabitation.vue"
						)
				);
			case "construction-cart":
				return defineAsyncComponent(
					() =>
						import(
							"@/features/planning/components/tools/PlanConstructionCart.vue"
						)
				);
			default:
				return null;
		}
	});

	const compViewToolMeta = computed(() => {
		switch (refShowTool.value) {
			case "visitation-frequency":
				return {
					props: {
						stoAmount: result.value.infrastructure["STO"],
						materialIO: result.value.materialio,
						disabled: props.disabled,
						planUuid: refPlanData.value.uuid,
					},
					listeners: {},
				};
			case "repair-analysis":
				return {
					props: {
						data: result.value.production.buildings.map((b) => {
							return {
								name: b.name,
								amount: b.amount,
								dailyRevenue: b.dailyRevenue,
								constructionMaterials: b.constructionMaterials,
							};
						}),
						cxUuid: refCXUuid.value,
						planetNaturalId: planetData.PlanetNaturalId,
					},
					listeners: {},
				};
			case "popr":
				return {
					props: {
						planetNaturalId: planetData.PlanetNaturalId,
						workforceData: result.value.workforce,
					},
					listeners: {},
				};
			case "supply-cart":
				return {
					props: {
						planetNaturalId: planetData.PlanetNaturalId,
						materialIO: result.value.materialio,
						workforceMaterialIO: result.value.workforceMaterialIO,
						productionMaterialIO: result.value.productionMaterialIO,
					},
					listeners: {},
				};
			case "optimize-habitation":
				return {
					props: {
						workforceData: result.value.workforce,
						habitationCost: result.value.infrastructureCosts,
					},
					listeners: {
						"update:habitation": (d: {
							infrastructure: INFRASTRUCTURE_TYPE;
							value: number;
						}) =>
							handleUpdateInfrastructure(
								d.infrastructure,
								d.value
							),
					},
				};
			case "construction-cart":
				return {
					props: {
						planetNaturalId: planetData.PlanetNaturalId,
						cxUuid: refCXUuid.value,
						constructionData: result.value.constructionMaterials,
						productionBuildingData:
							result.value.production.buildings,
						infrastructureData: result.value.infrastructure,
					},
					listeners: {},
				};
			default:
				return null;
		}
	});

	/*
	 * Plan Saving & Reloading
	 */

	const refIsSaving: Ref<boolean> = ref(false);

	async function save(): Promise<void> {
		refIsSaving.value = true;

		// plan exists, trigger a save
		if (existing.value) {
			await saveExistingPlan(refPlanData.value.uuid!, backendData.value);

			await patchMaterialIO(
				refPlanData.value.uuid!,
				planetData.PlanetNaturalId,
				result.value.materialio
			);

			// reset modified state
			handleResetModified();

			trackEvent("plan_save", {
				planetNaturalId: planetData.PlanetNaturalId,
			});

			refIsSaving.value = false;
		} else {
			await createNewPlan(backendData.value).then(
				async (newUuid: string | undefined) => {
					if (newUuid) {
						refIsSaving.value = false;
						refPlanData.value.uuid = newUuid;

						await patchMaterialIO(
							refPlanData.value.uuid!,
							planetData.PlanetNaturalId,
							result.value.materialio
						);

						// reset modified state
						handleResetModified();
						trackEvent("plan_create", {
							planetNaturalId: planetData.PlanetNaturalId,
						});

						router.push(
							`/plan/${planetData.PlanetNaturalId}/${newUuid}`
						);
					}
				}
			);
			refIsSaving.value = false;
		}
	}

	const refIsReloading: Ref<boolean> = ref(false);

	async function reloadPlan(): Promise<void> {
		if (!existing.value || !refPlanData.value.uuid) {
			throw new Error(`Unable to reload plan without uuid.`);
		}

		refIsReloading.value = true;

		await reloadExistingPlan(refPlanData.value.uuid).then(
			(result: IPlan) => (refPlanData.value = result)
		);

		trackEvent("plan_reload", {
			planetNaturalId: planetData.PlanetNaturalId,
		});
		refIsReloading.value = false;
	}

	// clone shared plan as logged in user
	const sharedWasCloned: Ref<boolean> = ref(false);

	async function cloneShared(): Promise<void> {
		if (!props.sharedPlanUuid) return;

		sharedWasCloned.value = await cloneSharedPlan(props.sharedPlanUuid);
		trackEvent("plan_shared_cloned", {
			planetNaturalId: planetData.PlanetNaturalId,
			sharedUuid: props.sharedPlanUuid,
		});
	}

	// Unhead
	import { useHead } from "@unhead/vue";
	useHead({
		title: computed(() =>
			planName.value
				? `${planName.value} | PRUNplanner`
				: `${props.planData.planet_id} | PRUNplanner`
		),
	});

	// Route Guard
	onBeforeRouteLeave(() => {
		if (modified.value) {
			trackEvent("plan_leave_changed", {
				planetNaturalId: planetData.PlanetNaturalId,
			});

			const answer = confirm(
				"Do you really want to leave? Unsaved changes will be lost."
			);

			if (!answer) return false;
		}
	});

	// Auto Optimize Habitation on Workforce Change
	const availableHabArea: ComputedRef<number> = computed(() => {
		return calculateAvailableArea(
			result.value.area.areaTotal,
			result.value.area.areaUsed,
			result.value.infrastructure
		);
	});

	watch(
		[
			() => result.value.workforce.pioneer.required,
			() => result.value.workforce.settler.required,
			() => result.value.workforce.technician.required,
			() => result.value.workforce.engineer.required,
			() => result.value.workforce.scientist.required,
			() => result.value.infrastructureCosts,
		],
		() => {
			//TODO: if (result.value.autoOptimizeHabs) {
			if (true) {
				const solution = optimizeHabs(
					"auto",
					result.value.infrastructureCosts,
					result.value.workforce,
					availableHabArea.value
				);
				if (solution.status === "optimal") {
					for (const [hab, count] of solution.variables) {
						handleUpdateInfrastructure(
							hab as INFRASTRUCTURE_TYPE,
							count
						);
					}
				} else {
					console.error(
						`Unable to optimize habitation: ${solution.status}`
					);
				}
			}
		}
	);
</script>

<template>
	<div class="@container grid grid-cols-1">
		<div class="border-b border-white/10 p-3">
			<div class="flex flex-row">
				<div class="flex flex-grow flex-wrap gap-3 justify-between">
					<div class="flex flex-row flex-wrap gap-3">
						<div>
							<h1 class="text-2xl font-bold text-white">
								{{ planName }}
							</h1>
							<span class="text-white/60">
								{{
									planetData.PlanetName !=
									planetData.PlanetNaturalId
										? planetData.PlanetName + " - "
										: ""
								}}
								{{ planetData.PlanetNaturalId }}
							</span>
						</div>
					</div>
					<div class="flex flex-row flex-wrap gap-1">
						<PButtonGroup v-if="userStore.isLoggedIn">
							<PButton
								v-if="disabled"
								:disabled="sharedWasCloned"
								:type="!sharedWasCloned ? 'primary' : 'success'"
								@click="cloneShared">
								<template #icon>
									<ContentCopySharp />
								</template>
								<span v-if="!sharedWasCloned">
									Clone Plan
								</span>
								<span v-else> Cloning Complete </span>
							</PButton>
							<PButton
								v-if="saveable"
								:loading="refIsSaving"
								:type="modified ? 'error' : 'success'"
								:disabled="disabled"
								@click="save">
								<template #icon>
									<SaveSharp />
								</template>
								{{ existing ? "Save" : "Create" }}
							</PButton>
							<PButton
								v-if="existing"
								:disabled="disabled"
								:loading="refIsReloading"
								@click="reloadPlan">
								<template #icon>
									<ChangeCircleOutlined />
								</template>
								Reload
							</PButton>

							<ShareButton
								v-if="!disabled && refPlanData.uuid"
								:plan-uuid="refPlanData.uuid" />

							<HelpDrawer file-name="plan" />
						</PButtonGroup>
					</div>
				</div>
			</div>
		</div>
		<div class="border-b border-white/10 p-3">
			<div class="flex flex-wrap grow lg:justify-end gap-3 my-auto">
				<PButton
					:type="
						refShowTool === 'configuration'
							? 'primary'
							: 'secondary'
					"
					@click="toggleTool('configuration')">
					Configuration
				</PButton>
				<PButton
					:type="refShowTool === 'popr' ? 'primary' : 'secondary'"
					@click="toggleTool('popr')">
					POPR
				</PButton>
				<PButton
					:type="
						refShowTool === 'visitation-frequency'
							? 'primary'
							: 'secondary'
					"
					@click="toggleTool('visitation-frequency')">
					Visitation Frequency
				</PButton>
				<PButton
					:type="
						refShowTool === 'construction-cart'
							? 'primary'
							: 'secondary'
					"
					@click="toggleTool('construction-cart')">
					Construction Cart
				</PButton>
				<PButton
					:type="
						refShowTool === 'supply-cart' ? 'primary' : 'secondary'
					"
					@click="toggleTool('supply-cart')">
					Supply Cart
				</PButton>
				<PButton
					:type="
						refShowTool === 'repair-analysis'
							? 'primary'
							: 'secondary'
					"
					@click="toggleTool('repair-analysis')">
					Repair Analysis
				</PButton>
				<PButton
					:type="
						refShowTool === 'optimize-habitation'
							? 'primary'
							: 'secondary'
					"
					@click="toggleTool('optimize-habitation')">
					Habitation Optimization
				</PButton>
			</div>
		</div>
		<div
			:class="
				!refShowTool
					? 'opacity-0 overflow-hidden !h-0'
					: 'px-6 py-3 opacity-100 border-b border-white/10'
			"
			class="transition-discrete transition-opacity duration-500">
			<div
				v-if="refShowTool === 'configuration'"
				class="flex flex-wrap gap-6">
				<div class="flex flex-col gap-3">
					<div class="min-w-[300px]">
						<h2 class="text-white/80 font-bold text-lg pb-3">
							Configuration
						</h2>

						<PlanConfiguration
							:disabled="disabled"
							:plan-name="planName"
							:empire-options="refEmpireList"
							:active-empire="computedActiveEmpire"
							:plan-empires="planEmpires"
							@update:active-empire="
								(empireUuid: string) => {
									refEmpireUuid = empireUuid;
									refCXUuid = findEmpireCXUuid(empireUuid);
								}
							"
							@update:plan-name="handleChangePlanName" />
					</div>

					<div>
						<h2 class="text-white/80 font-bold text-lg pb-3">
							Area
						</h2>
						<PlanArea
							:disabled="disabled"
							:area-data="result.area"
							:planet-natural-id="planetData.PlanetNaturalId"
							@update:permits="handleUpdatePermits" />
					</div>

					<div>
						<h2 class="text-white/80 font-bold text-lg pb-3">
							Bonuses
						</h2>

						<PlanBonuses
							:disabled="disabled"
							:corphq="result.corphq"
							:cogc="result.cogc"
							:planet-natural-id="planetData.PlanetNaturalId"
							@update:corphq="handleUpdateCorpHQ"
							@update:cogc="handleUpdateCOGC" />
					</div>
				</div>
				<div>
					<h2 class="text-white/80 font-bold text-lg pb-3">
						Infrastructure
					</h2>
					<PlanInfrastructure
						:disabled="disabled"
						:infrastructure-data="result.infrastructure"
						:auto-optimize-habs="true"
						:planet-natural-id="planetData.PlanetNaturalId"
						@update:infrastructure="handleUpdateInfrastructure"
						@update:auto-optimize-habs="
							handleUpdateAutoOptimizeHabs
						" />
				</div>
				<div>
					<h2 class="text-white/80 font-bold text-lg pb-3">
						Experts
					</h2>
					<PlanExperts
						:disabled="disabled"
						:expert-data="result.experts"
						:planet-natural-id="planetData.PlanetNaturalId"
						@update:expert="handleUpdateExpert" />
				</div>
			</div>
			<Suspense v-else-if="refShowTool && compViewToolMeta">
				<template #default>
					<component
						:is="compViewToolComponent"
						v-bind="compViewToolMeta.props"
						v-on="compViewToolMeta.listeners"
						@close="() => (refShowTool = null)" />
				</template>
				<template #fallback>
					<div class="w-full text-center py-5">
						<PSpin />
					</div>
				</template>
			</Suspense>
		</div>
		<div
			class="p-3 grid grid-cols-1 @[1350px]:grid-cols-[auto_450px] gap-3">
			<div>
				<div class="flex flex-row flex-wrap gap-6">
					<div class="shrink-0">
						<h2 class="text-white/80 font-bold text-lg pb-3">
							Workforce
						</h2>
						<PlanWorkforce
							:disabled="disabled"
							:workforce-data="result.workforce"
							:planet-natural-id="planetData.PlanetNaturalId"
							@update:lux="handleUpdateWorkforceLux" />
					</div>
					<div class="grow shink-0">
						<PlanOverview
							:visitation-data="visitationData"
							:overview-data="overviewData">
							<template #heading="{ text }">
								<h2
									class="text-white/80 font-bold text-lg pb-3">
									{{ text }}
								</h2>
							</template>
						</PlanOverview>
					</div>
				</div>
				<div class="pt-6">
					<PlanProduction
						:disabled="disabled"
						:production-data="result.production"
						:planet-resources="planetData.Resources"
						:cogc="result.cogc"
						:cx-uuid="refCXUuid"
						:planet-id="planetData.PlanetNaturalId"
						@update:building:amount="handleUpdateBuildingAmount"
						@delete:building="handleDeleteBuilding"
						@create:building="handleCreateBuilding"
						@update:building:recipe:amount="
							handleUpdateBuildingRecipeAmount
						"
						@delete:building:recipe="handleDeleteBuildingRecipe"
						@add:building:recipe="handleAddBuildingRecipe"
						@update:building:recipe="handleChangeBuildingRecipe" />
				</div>
			</div>
			<div>
				<div class="sticky top-3">
					<h2
						class="text-white/80 font-bold text-lg pb-3 flex justify-between child:my-auto">
						<div>Material I/O</div>
						<div class="flex gap-x-3">
							<PTooltip>
								<template #trigger>
									<PButton
										size="sm"
										secondary
										@click="
											refMaterialIOShowBasked =
												!refMaterialIOShowBasked
										">
										<template #icon>
											<ShoppingBasketSharp
												v-if="
													!refMaterialIOShowBasked
												" />
											<AttachMoneySharp v-else />
										</template>
									</PButton>
								</template>
								Toggle Weight & Volume
							</PTooltip>

							<PTooltip>
								<template #trigger>
									<PButton
										size="sm"
										secondary
										@click="
											refMaterialIOSplitted =
												!refMaterialIOSplitted
										">
										<template #icon>
											<DataObjectRound
												v-if="!refMaterialIOSplitted" />
											<DataSaverOffSharp v-else />
										</template>
									</PButton>
								</template>
								Toggle Production & Workforce Split
							</PTooltip>
						</div>
					</h2>
					<template v-if="!refMaterialIOSplitted">
						<PlanMaterialIO
							:material-i-o-data="result.materialio"
							:show-basked="refMaterialIOShowBasked" />
					</template>
					<template v-else>
						<h3 class="font-bold pb-3">Production</h3>
						<PlanMaterialIO
							:material-i-o-data="result.productionMaterialIO"
							:show-basked="refMaterialIOShowBasked" />
						<h3 class="font-bold py-3">Workforce</h3>
						<PlanMaterialIO
							:material-i-o-data="result.workforceMaterialIO"
							:show-basked="refMaterialIOShowBasked" />
					</template>
				</div>
			</div>
		</div>
	</div>
</template>
