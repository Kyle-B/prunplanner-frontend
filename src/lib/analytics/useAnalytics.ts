import { usePostHog } from "@/lib/analytics/usePostHog";

// Types & Interfaces
import { Properties } from "posthog-js";
import {
	ANALYTICS_EVENT_TYPE,
	IAnalyticsEventProperties,
} from "@/lib/analytics/useAnalytics.types";

const { posthog, capture, setUserProp } = usePostHog();

export function trackEvent<E extends ANALYTICS_EVENT_TYPE>(
	event: E,
	props?: IAnalyticsEventProperties[E]
): void {
	if (
		event === "plan_tool_optimize_habitation" &&
		(props as IAnalyticsEventProperties["plan_tool_optimize_habitation"])
			?.applyType === "auto"
	)
		return;

	capture(event, props);
}

export function trackUser(props: Properties): void {
	setUserProp(props);
}

export function resetUser(): void {
	posthog.reset();
}

export function identifyUser(distinct_id: string, props?: Properties): void {
	posthog.identify(distinct_id, props);
}
