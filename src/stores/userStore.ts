import { defineStore } from "pinia";
import { computed, ComputedRef, Reactive, reactive, ref, Ref } from "vue";
import merge from "lodash/merge";

// API
import {
	callGetProfile,
	callRefreshToken,
	callUserLogin,
} from "@/features/api/userData.api";

// Stores
import { useGameDataStore } from "@/stores/gameDataStore";
import { usePlanningStore } from "@/stores/planningStore";
import { useQueryStore } from "@/lib/query_cache/queryStore";

// Composables
import { usePostHog } from "@/lib/usePostHog";

// Types & Interfaces
import {
	IUserProfile,
	IUserTokenResponse,
} from "@/features/api/userData.types";
import {
	IPreference,
	IPreferencePerPlan,
} from "@/features/preferences/userPreferences.types";
import { preferenceDefaults } from "@/features/preferences/userDefaults";

export const useUserStore = defineStore(
	"prunplanner_user",
	() => {
		// state
		const accessToken: Ref<string | undefined> = ref(undefined);
		const refreshToken: Ref<string | undefined> = ref(undefined);
		const profile: Ref<IUserProfile | undefined> = ref(undefined);

		const preferences: Reactive<IPreference> =
			reactive<IPreference>(preferenceDefaults);

		// state reset
		function $reset(): void {
			accessToken.value = undefined;
			refreshToken.value = undefined;
			profile.value = undefined;
		}

		// user preference handling

		type PreferenceType = typeof preferences;

		// generic setter for top-level preferences
		function setPreference<K extends keyof IPreference>(
			key: K,
			value: PreferenceType[K]
		): void {
			preferences[key] = value;
		}

		// per plan override setter
		function setPlanPreference(
			planUuid: string,
			patch: Partial<IPreferencePerPlan>
		): void {
			const current = preferences.planOverrides[planUuid] || {};
			preferences.planOverrides[planUuid] = { ...current, ...patch };
		}

		function getPlanPreference(planUuid: string): IPreferencePerPlan {
			return merge(
				{},
				preferenceDefaults.planDefaults,
				preferences.planOverrides[planUuid] || {}
			);
		}

		function clearPlanPreference(planUuid: string): void {
			delete preferences.planOverrides[planUuid];
		}

		// getters
		const isLoggedIn: ComputedRef<boolean> = computed(
			() =>
				accessToken.value !== undefined &&
				refreshToken.value !== undefined
		);

		const hasFIO: ComputedRef<boolean> = computed(
			() =>
				profile.value !== undefined &&
				profile.value.fio_apikey !== "" &&
				profile.value.fio_apikey !== null &&
				profile.value.prun_username !== "" &&
				profile.value.prun_username !== null
		);

		// functions

		/**
		 * Sets access and refresh token
		 * @author jplacht
		 *
		 * @param {string} access Access Token
		 * @param {string} refresh Refresh Token
		 */
		function setToken(access: string, refresh: string): void {
			accessToken.value = access;
			refreshToken.value = refresh;

			// trigger profile refresh non-blocking
			performGetProfile();
		}

		/**
		 * Logs user out by clearing data
		 * @author jplacht
		 */
		function logout(): void {
			// reset user store
			$reset();

			// reset posthog users
			const { posthog } = usePostHog();
			posthog.reset();

			// reset related stores
			const gameDataStore = useGameDataStore();
			gameDataStore.$reset();

			const planningStore = usePlanningStore();
			planningStore.$reset();

			const queryStore = useQueryStore();
			queryStore.$reset();
		}

		/**
		 * Performs a login
		 * @author jplacht
		 *
		 * @async
		 * @param {string} username
		 * @param {string} password
		 * @returns {Promise<boolean>}
		 */
		async function performLogin(
			username: string,
			password: string
		): Promise<boolean> {
			try {
				const tokenData: IUserTokenResponse = await callUserLogin(
					username,
					password
				);

				setToken(tokenData.access_token, tokenData.refresh_token);

				return true;
			} catch (err) {
				console.error(err);
				return false;
			}
		}

		/**
		 * Performs a token refresh
		 * @author jplacht
		 *
		 * @async
		 * @returns {Promise<boolean>}
		 */
		async function performTokenRefresh(): Promise<boolean> {
			if (refreshToken.value) {
				try {
					const tokenData: IUserTokenResponse =
						await callRefreshToken(refreshToken.value);

					setToken(tokenData.access_token, tokenData.refresh_token);
					return true;
				} catch (error) {
					console.error(error);
					return false;
				}
			} else {
				return false;
			}
		}

		/**
		 * Loads the users profile
		 * @author jplacht
		 *
		 * @async
		 * @returns {Promise<void>} None
		 */
		async function performGetProfile(): Promise<void> {
			// only perform if the user is logged in
			if (isLoggedIn.value) {
				try {
					await callGetProfile().then((result: IUserProfile) => {
						// identify users for posthog
						const { posthog } = usePostHog();
						posthog.identify(result.user_id.toString(), {
							username: result.username,
						});

						profile.value = result;
					});
				} catch (error) {
					console.error(error);
				}
			}
		}

		return {
			accessToken,
			refreshToken,
			profile,
			// reset
			$reset,
			// getters
			isLoggedIn,
			hasFIO,
			// preferences
			preferences,
			setPreference,
			setPlanPreference,
			clearPlanPreference,
			getPlanPreference,
			// functions
			setToken,
			logout,
			performLogin,
			performTokenRefresh,
			performGetProfile,
		};
	},
	{
		persist: {
			pick: ["accessToken", "refreshToken", "profile", "preferences"],
		},
	}
);
