import { ref, computed } from "vue";

/*
 * Hooks into user activity and keeps track of last action
 * Will be used to delay / skip actions if the user is inactive
 * and only has the browser tab open.
 */

export function useUserActivity(
	inactivityThreshold: number = 300_000, // 5 min
	maxDelay: number = 3_600_000 // 1hour
) {
	const lastActivity = ref(Date.now());
	const lastForcedActivity = ref(Date.now());

	// events to track
	const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

	events.forEach((event) =>
		window.addEventListener(event, updateLastActivity)
	);

	// throttle updates
	let timeout: number | null = null;

	function updateLastActivity() {
		if (timeout) return;

		// debounce 200ms, mousemove/scroll
		timeout = window.setTimeout(() => {
			lastActivity.value = Date.now();
			timeout = null;
		}, 200);
	}

	function updateForcedActivity() {
		lastForcedActivity.value = Date.now();
	}

	const timeSinceLastActivity = computed(
		() => Date.now() - lastActivity.value
	);

	function shouldDelay(): boolean {
		// user active
		if (timeSinceLastActivity.value < inactivityThreshold) {
			return false;
		}

		// max inactivity reached, reset + allow
		if (lastForcedActivity.value > maxDelay) {
			updateForcedActivity();
			return false;
		}

		return true;
	}

	return {
		lastActivity,
		lastForcedActivity,
		shouldDelay,
	};
}
