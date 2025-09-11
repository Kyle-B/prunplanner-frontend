class Config {
	public readonly API_BASE_URL: string;
	public readonly SHARE_BASE_URL: string;

	public readonly GAME_DATA_STALE_MINUTES_BUILDINGS: number;
	public readonly GAME_DATA_STALE_MINUTES_RECIPES: number;
	public readonly GAME_DATA_STALE_MINUTES_MATERIALS: number;
	public readonly GAME_DATA_STALE_MINUTES_EXCHANGES: number;
	public readonly GAME_DATA_STALE_MINUTES_PLANETS: number;
	public readonly POSTHOG_KEY: string;
	public readonly POSTHOG_NAME: string;

	public readonly INDEXEDDB_DBNAME: string;

	constructor() {
		this.API_BASE_URL =
			import.meta.env.VITE_API_BASE_URL || "https://api.prunplanner.org";
		this.SHARE_BASE_URL =
			import.meta.env.VITE_SHARE_BASE_URL ||
			"https://prunplanner.org/shared";

		this.GAME_DATA_STALE_MINUTES_BUILDINGS =
			import.meta.env.VITE_GAME_DATA_STALE_MINUTES_BUILDINGS || 24 * 60;
		this.GAME_DATA_STALE_MINUTES_RECIPES =
			import.meta.env.VITE_GAME_DATA_STALE_MINUTES_RECIPES || 24 * 60;
		this.GAME_DATA_STALE_MINUTES_MATERIALS =
			import.meta.env.VITE_GAME_DATA_STALE_MINUTES_MATERIALS || 24 * 60;
		this.GAME_DATA_STALE_MINUTES_EXCHANGES =
			import.meta.env.VITE_GAME_DATA_STALE_MINUTES_EXCHANGES || 30;
		this.GAME_DATA_STALE_MINUTES_PLANETS =
			import.meta.env.VITE_GAME_DATA_STALE_MINUTES_PLANETS || 3 * 60;

		this.INDEXEDDB_DBNAME =
			import.meta.env.VITE_INDEXEDDB_DBNANAME || "prunplanner";
		this.POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY || "";
		this.POSTHOG_NAME =
			import.meta.env.VITE_POSTHOG_NAME || "prunplanner_frontend";
	}
}

const config = new Config();
export default config;
