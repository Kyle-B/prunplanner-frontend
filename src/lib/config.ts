class Config {
	public readonly APP_VERSION: string;
	public readonly API_BASE_URL: string;
	public readonly SHARE_BASE_URL: string;

	public readonly GAME_DATA_STALE_MINUTES_BUILDINGS: number;
	public readonly GAME_DATA_STALE_MINUTES_RECIPES: number;
	public readonly GAME_DATA_STALE_MINUTES_MATERIALS: number;
	public readonly GAME_DATA_STALE_MINUTES_EXCHANGES: number;
	public readonly GAME_DATA_STALE_MINUTES_PLANETS: number;

	constructor() {
		this.API_BASE_URL =
			import.meta.env.VITE_API_BASE_URL || "https://api.prunplanner.org";
		this.SHARE_BASE_URL =
			import.meta.env.VITE_SHARE_BASE_URL ||
			"https://prunplanner.org/shared";
		this.APP_VERSION = import.meta.env.VITE_APP_VERSION || "undefined";

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
	}
}

const config = new Config();
export default config;
