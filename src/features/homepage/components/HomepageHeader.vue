<script setup lang="ts">
    import { ref, Ref } from "vue";
    import { useRoute } from "vue-router";

    // UI
    import { NCollapseTransition } from "naive-ui";

    // Components
    import LoginComponent from "@/features/account/components/LoginComponent.vue";

    const refShowLogin: Ref<boolean> = ref(false);
    const refShowRegistration: Ref<boolean> = ref(false);

    function toggleLogin(): void {
        refShowRegistration.value = false;
        refShowLogin.value = !refShowLogin.value;
    }

    function toggleRegistration(): void {
        refShowLogin.value = false;
        refShowRegistration.value = !refShowRegistration.value;
    }

    const routeData = useRoute();
</script>

<template>
	<div class="mx-auto w-full max-w-7xl mt-10 px-5 md:px-10 lg:px-0">
		<div
			class="flex flex-row justify-between gap-x-7 child:text-white child:cursor-pointer child:my-auto"
		>
			<div>
				<RouterLink to="/">
					<h2
						v-if="routeData.name != 'homepage'"
						class="text-3xl text-prunplanner font-light"
					>
						<span class="font-bold">PRUN</span>planner
					</h2>
				</RouterLink>
			</div>
			<div
				class="flex flex-row gap-x-7 child:px-3 child:py-1 child:text-lg child:font-light child:hover:bg-white/10 child:hover:rounded-lg"
			>
				<div @click="toggleRegistration">Create Account</div>
				<div @click="toggleLogin">Login</div>
			</div>
		</div>
	</div>
	<div>
		<n-collapse-transition :show="refShowLogin">
			<div
				class="mt-5 md:px-10 lg:px-0 bg-white/5 border-t border-b border-white/10"
			>
				<div class="mx-auto max-w-7xl py-10">
					<LoginComponent />
				</div>
			</div>
		</n-collapse-transition>
		<n-collapse-transition :show="refShowRegistration">
			<div class="max-w-7xl bg-white/5">Registration</div>
		</n-collapse-transition>
	</div>
</template>
