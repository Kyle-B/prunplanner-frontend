export interface IMaterial {
	MaterialId: string;
	CategoryName: string;
	CategoryId: string;
	Name: string;
	Ticker: string;
	Weight: number;
	Volume: number;
}

export interface IExchange {
	TickerId: string;
	MaterialTicker: string;
	ExchangeCode: string;
	Ask: number | null;
	Bid: number | null;
	PriceAverage: number;
	Supply: number | null;
	Demand: number | null;
	Traded: number | null;
}

export interface IRecipeMaterial {
	Ticker: string;
	Amount: number;
}

export interface IRecipe {
	RecipeId: string;
	BuildingTicker: string;
	RecipeName: string;
	TimeMs: number;
	Inputs: IRecipeMaterial[];
	Outputs: IRecipeMaterial[];
}

export interface IBuildingCost {
	CommodityTicker: string;
	Weight: number;
	Volume: number;
	Amount: number;
}

export interface IBuildingHabitation {
	Pioneer: number;
	Settler: number;
	Technician: number;
	Engineer: number;
	Scientist: number;
	Area: number;
}

export type BUILDING_EXPERTISE_TYPE =
	| "AGRICULTURE"
	| "CHEMISTRY"
	| "CONSTRUCTION"
	| "ELECTRONICS"
	| "FOOD_INDUSTRIES"
	| "FUEL_REFINING"
	| "MANUFACTURING"
	| "METALLURGY"
	| "RESOURCE_EXTRACTION";

export type BUILDING_TYPE = "INFRASTRUCTURE" | "PLANETARY" | "PRODUCTION";

export interface IBuilding {
	Name: string;
	Ticker: string;
	Pioneers: number;
	Settlers: number;
	Technicians: number;
	Engineers: number;
	Scientists: number;
	AreaCost: number;
	BuildingCosts: IBuildingCost[];
	Habitation: IBuildingHabitation | null;
	Expertise: BUILDING_EXPERTISE_TYPE | null;
	Type: BUILDING_TYPE;

	[key: string]:
		| string
		| number
		| null
		| IBuildingCost[]
		| IBuildingHabitation
		| BUILDING_TYPE;
}

export type PLANET_RESOURCETYPE_TYPE = "MINERAL" | "GASEOUS" | "LIQUID";
export type PLANET_DISTANCE_NAMES =
	| "Moria Station"
	| "Antares Station"
	| "Benten Station"
	| "Hortus Station";

export interface IPlanetResource {
	MaterialId: string;
	ResourceType: PLANET_RESOURCETYPE_TYPE;
	Factor: number;
	DailyExtraction: number;
	MaterialTicker: string;
	ExtractionMax: number;
}

export interface IPlanetDistance {
	name: PLANET_DISTANCE_NAMES;
	distance: number;
}

export interface IPlanetCheckDistance {
	SystemIdStart: string;
	SystemIdTarget: string;
	SystemName: string;
	Distance: number;
}

export type PLANET_COGCPROGRAM_TYPE =
	| "Invalid"
	| "ADVERTISING_AGRICULTURE"
	| "ADVERTISING_CHEMISTRY"
	| "ADVERTISING_CONSTRUCTION"
	| "ADVERTISING_ELECTRONICS"
	| "ADVERTISING_FOOD_INDUSTRIES"
	| "ADVERTISING_FUEL_REFINING"
	| "ADVERTISING_MANUFACTURING"
	| "ADVERTISING_METALLURGY"
	| "ADVERTISING_RESOURCE_EXTRACTION"
	| "WORKFORCE_PIONEERS"
	| "WORKFORCE_SETTLERS"
	| "WORKFORCE_TECHNICIANS"
	| "WORKFORCE_ENGINEERS"
	| "WORKFORCE_SCIENTISTS";

export interface IPlanetCOGCProgram {
	ProgramType: PLANET_COGCPROGRAM_TYPE | null;
	StartEpochMs: number;
	EndEpochMs: number;
}

export type PLANET_COGCPROGRAM_STATUS_TYPE = "ACTIVE" | "ON_STRIKE" | "PLANNED";

export interface IPlanet {
	PlanetId: string;
	PlanetNaturalId: string;
	PlanetName: string;
	SystemId: string;
	HasLocalMarket: boolean;
	HasChamberOfCommerce: boolean;
	HasWarehouse: boolean;
	HasAdministrationCenter: boolean;
	HasShipyard: boolean;
	Pressure: number;
	Surface: boolean;
	Temperature: number;
	Fertility: number;
	Gravity: number;
	FactionCode: string | null;
	FactionName: string | null;
	GovernorUserName: string | null;
	COGCProgramStatus: PLANET_COGCPROGRAM_STATUS_TYPE | null;

	Resources: IPlanetResource[];
	Distances: IPlanetDistance[];
	COGCPrograms: IPlanetCOGCProgram[];
	COGCProgramActive: PLANET_COGCPROGRAM_TYPE | null;
	CheckDistances: IPlanetCheckDistance | null;
}
