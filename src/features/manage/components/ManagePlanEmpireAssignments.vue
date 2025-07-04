<script setup lang="ts">
	import { computed, ComputedRef, PropType, ref, Ref, watch } from "vue";

	// Stores
	import { usePlanningStore } from "@/stores/planningStore";
	const planningStore = usePlanningStore();

	// API
	import { callClonePlan, callDeletePlan } from "@/features/api/planData.api";
	import { callPatchEmpirePlanJunctions } from "@/features/api/empireData.api";

	// Composables
	import { usePlanetData } from "@/features/game_data/usePlanetData";
	const { getPlanetName } = usePlanetData();

	// Util
	import { inertClone } from "@/util/data";

	// Types & Interfaces
	import { IPlan, IPlanEmpireElement } from "@/stores/planningStore.types";
	import {
		IPlanEmpireJunction,
		IPlanEmpireJunctionBasePlanners,
		IPlanEmpireMatrix,
		IPlanEmpireMatrixEmpires,
	} from "@/features/manage/manage.types";

	// Components
	import SharingButton from "@/features/sharing/components/SharingButton.vue";

	// UI
	import { useDialog, NCheckbox, NSpace, NButton, NIcon } from "naive-ui";
	const dialog = useDialog();
	import { XNDataTable, XNDataTableColumn } from "@skit/x.naive-ui";
	import {
		ContentCopySharp,
		ClearSharp,
		SaveSharp,
		ChangeCircleOutlined,
		AddCircleOutlineSharp,
		CircleOutlined,
	} from "@vicons/material";

	const props = defineProps({
		empires: {
			type: Array as PropType<IPlanEmpireElement[]>,
			required: true,
		},
		plans: {
			type: Array as PropType<IPlan[]>,
			required: true,
		},
	});

	// Local Data & Watcher
	const localEmpires: Ref<IPlanEmpireElement[]> = ref(
		inertClone(props.empires)
	);
	const localPlans: Ref<IPlan[]> = ref(inertClone(props.plans));

	watch(
		() => props.empires,
		(newData: IPlanEmpireElement[]) => {
			localEmpires.value = inertClone(newData);
			generateMatrix();
		},
		{ deep: true }
	);

	watch(
		() => props.plans,
		(newData: IPlan[]) => {
			localPlans.value = inertClone(newData);
			generateMatrix();
		},
		{ deep: true }
	);

	const emit = defineEmits<{
		(e: "update:empireList", value: IPlanEmpireElement[]): void;
		(e: "update:planList", value: IPlan[]): void;
	}>();

	const matrixEmpires: Ref<IPlanEmpireMatrixEmpires[]> = ref([]);
	const matrix: Ref<IPlanEmpireMatrix[]> = ref([]);
	const refIsPatching: Ref<boolean> = ref(false);
	const refIsCloning: Ref<string | undefined> = ref(undefined);
	const refIsDeleting: Ref<string | undefined> = ref(undefined);

	// generate initial matrix upon props passing
	generateMatrix();

	function generateMatrix(): void {
		// reset matrix and empires
		matrix.value = [];
		matrixEmpires.value = [];

		matrixEmpires.value = localEmpires.value
			.map((e) => {
				return {
					empireUuid: e.uuid,
					empireName: e.name,
				};
			})
			.sort((a, b) => (a.empireName > b.empireName ? 1 : -1));

		// prepare flatmap of all plan uuids within an empire
		const empirePlans: Record<string, string[]> = localEmpires.value.reduce(
			(acc, item) => (
				(acc[item.uuid] = item.baseplanners.map((p) => p.uuid)), acc
			),
			{} as Record<string, string[]>
		);

		// prepare matrix based on plans
		localPlans.value.forEach((plan) => {
			matrix.value.push({
				// all plans coming from backend have a name and uuid, force it
				planName: plan.name!,
				planUuid: plan.uuid!,
				planetId: plan.planet_id,
				empires: localEmpires.value.reduce(
					(acc, item) => (
						(acc[item.uuid] = empirePlans[item.uuid].includes(plan.uuid!)), acc
					),
					{} as Record<string, boolean>
				),
			});
		});
	}

	function reload(): void {
		localEmpires.value = inertClone(props.empires);
		generateMatrix();
	}

	function changeAllToEmpire(empireUuid: string, value: boolean): void {
		matrix.value.forEach((mv) => {
			mv.empires[empireUuid] = value;
		});
	}

	// junction patch matrix
	const patchJunctionData: ComputedRef<IPlanEmpireJunction[]> = computed(() => {
		const junctions: IPlanEmpireJunction[] = [];

		matrixEmpires.value.forEach((me) => {
			const indJunction = {
				empire_uuid: me.empireUuid,
				baseplanners: [] as IPlanEmpireJunctionBasePlanners[],
			};

			matrix.value.forEach((mp) => {
				if (mp.empires[me.empireUuid]) {
					indJunction.baseplanners.push({
						baseplanner_uuid: mp.planUuid,
					});
				}
			});

			return junctions.push(indJunction);
		});

		return junctions;
	});

	async function patchJunctions(): Promise<void> {
		refIsPatching.value = true;

		try {
			// patch junctions, if success refresh data and emit
			try {
				await callPatchEmpirePlanJunctions(patchJunctionData.value);
			} finally {
				// forced reload of all Empires
				emit("update:empireList", await planningStore.getAllEmpires(true));
				// reload of all Plans
				emit("update:planList", await planningStore.getAllPlans());
			}
		} catch (err) {
			console.log(err);
		} finally {
			refIsPatching.value = false;
		}
	}

	async function clonePlan(planUuid: string, planName: string): Promise<void> {
		refIsCloning.value = planUuid;

		try {
			try {
				await callClonePlan(planUuid, `${planName} (Clone)`);
			} finally {
				// forced reload of all Empires
				emit("update:empireList", await planningStore.getAllEmpires(true));
				// reload of all Plans
				emit("update:planList", await planningStore.getAllPlans());
			}
		} catch (err) {
			console.error(err);
		} finally {
			refIsCloning.value = undefined;
		}
	}

	function handleDeleteConfirm(planUuid: string): void {
		dialog.warning({
			title: "Confirm Plan Deletion",
			content: "Are you sure? Deleting the Plan can't be reversed.",
			positiveText: "Delete",
			negativeText: "Cancel",
			onPositiveClick: () => {
				deletePlan(planUuid);
			},
		});
	}

	async function deletePlan(planUuid: string): Promise<void> {
		refIsDeleting.value = planUuid;
		try {
			const deletionStatus: boolean = await callDeletePlan(planUuid);
			if (deletionStatus) {
				// forced reload of all Empires
				emit("update:empireList", await planningStore.getAllEmpires(true));
				// reload of all Plans
				emit("update:planList", await planningStore.getAllPlans());
			}
		} catch (err) {
			console.error(err);
		} finally {
			refIsDeleting.value = undefined;
		}
	}
</script>

<template>
	<div class="flex justify-between">
		<h2 class="text-xl font-bold my-auto">Plan ↔ Empire Assignments</h2>
		<div class="flex gap-x-3">
			<n-button size="small" :loading="refIsPatching" @click="patchJunctions">
				<template #icon><SaveSharp /></template>
				Update Plan Assignments
			</n-button>
			<n-button size="small" @click="reload">
				<template #icon><ChangeCircleOutlined /></template>
				Reload
			</n-button>
		</div>
	</div>
	<div class="py-3 text-white/60">
		Every planned base can be assigned to multiple empires. This allows you to
		simultaneously keep track of your existing Prosperous Universe empire,
		corporation production chains or future expansion plans.
	</div>

	<x-n-data-table :data="matrix" striped>
		<x-n-data-table-column title="Plan" key="planName" sorter="default">
			<template #render-cell="{ rowData }">
				<div class="max-w-[250px]">
					<router-link
						:to="`/plan/${rowData.planetId}/${rowData.planUuid}`"
						class="text-link-primary font-bold hover:underline"
					>
						{{ rowData.planName }}
					</router-link>
				</div>
			</template>
		</x-n-data-table-column>
		<x-n-data-table-column title="Planet" key="planetId" sorter="default">
			<template #render-cell="{ rowData }">
				{{ getPlanetName(rowData.planetId) }}
			</template>
		</x-n-data-table-column>

		<x-n-data-table-column title="Configuration" key="options">
			<template #render-cell="{ rowData }">
				<div class="max-w-[150px]">
					<n-space>
						<n-button
							size="tiny"
							type="error"
							:loading="refIsDeleting === rowData.planUuid"
							@click="handleDeleteConfirm(rowData.planUuid)"
						>
							<template #icon><ClearSharp /></template>
						</n-button>
						<n-button
							size="tiny"
							:loading="refIsCloning === rowData.planUuid"
							@click="clonePlan(rowData.planUuid, rowData.planName)"
						>
							<template #icon><ContentCopySharp /></template>
						</n-button>
						<SharingButton :plan-uuid="rowData.planUuid" />
					</n-space>
				</div>
			</template>
		</x-n-data-table-column>

		<!-- Empire Columns -->
		<x-n-data-table-column v-for="e in matrixEmpires" :key="e.empireUuid">
			<template #title>
				<div class="text-center">
					<div class="text-center pb-1">{{ e.empireName }}</div>

					<div class="flex justify-center gap-x-1">
						<n-icon
							color="rgba(192,226,24,1)"
							size="16"
							@click="changeAllToEmpire(e.empireUuid, true)"
						>
							<AddCircleOutlineSharp />
						</n-icon>
						<n-icon
							color="rgba(199,0,57,1)"
							size="16"
							@click="changeAllToEmpire(e.empireUuid, false)"
						>
							<CircleOutlined />
						</n-icon>
					</div>
				</div>
			</template>
			<template #render-cell="{ rowData }">
				<div class="text-center">
					<n-checkbox v-model:checked="rowData.empires[e.empireUuid]" />
				</div>
			</template>
		</x-n-data-table-column>
	</x-n-data-table>
</template>
