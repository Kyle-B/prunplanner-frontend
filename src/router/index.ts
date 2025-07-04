import {
	createWebHistory,
	createRouter,
	NavigationGuardNext,
	RouteLocationRaw,
} from "vue-router";

// Stores
import { useUserStore } from "@/stores/userStore";

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			name: "homepage",
			path: "/",
			component: () => import("@/views/HomepageView.vue"),
			props: true,
		},
		{
			name: "empire",
			path: "/empire/:empireUuid?",
			meta: { requiresAuth: true },
			component: () => import("@/views/EmpireView.vue"),
			props: true,
		},
		{
			name: "manage",
			path: "/manage",
			meta: { requiresAuth: true },
			component: () => import("@/views/ManageView.vue"),
		},
		{
			name: "none",
			path: "/none",
			meta: { requiresAuth: true },
			component: import("@/views/EmpireView.vue"),
		},
		{
			name: "plan",
			path: "/plan/:planetNaturalId/:planUuid?",
			meta: { requiresAuth: true },
			component: () => import("@/views/PlanLoadView.vue"),
			props: true,
		},
		{
			name: "shared-plan",
			path: "/shared/:sharedPlanUuid",
			meta: { showHeaderName: true },
			component: () => import("@/views/PlanLoadView.vue"),
			props: true,
		},
	],
});

router.beforeEach((to, _, next: NavigationGuardNext) => {
	const userStore = useUserStore();

	if (to.meta.requiresAuth && !userStore.isLoggedIn) {
		const redirectTo: RouteLocationRaw = {
			name: "homepage",
			state: { showLogin: "true" },
		};
		next(redirectTo);
	} else if (to.name === "homepage" && userStore.isLoggedIn) {
		const redirectTo: RouteLocationRaw = {
			name: "empire",
		};
		next(redirectTo);
	} else {
		next();
	}
});

export default router;
