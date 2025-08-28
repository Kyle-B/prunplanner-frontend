import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick } from "vue";
import { useDB } from "@/database/composables/useDB";

// Define a fake type for testing
interface TestItem {
	id: string;
	name: string;
}

describe("useDB composable", () => {
	let fakeStore: {
		keyPath: string;
		getAll: ReturnType<typeof vi.fn>;
		get: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		// fresh fake store before each test
		fakeStore = {
			keyPath: "id",
			getAll: vi.fn(),
			get: vi.fn(),
		};
	});

	it("preload() loads all data and fills cache", async () => {
		const items: TestItem[] = [
			{ id: "1", name: "Alpha" },
			{ id: "2", name: "Beta" },
		];
		fakeStore.getAll.mockResolvedValue(items);

		const { preload, allData } = useDB<TestItem, "id">(
			fakeStore as any,
			"id"
		);

		expect(allData.value).toEqual([]);

		await preload();

		expect(fakeStore.getAll).toHaveBeenCalledOnce();
		expect(allData.value).toEqual(items);
	});

	it("preload() skips reload if already loaded", async () => {
		fakeStore.getAll.mockResolvedValue([{ id: "1", name: "Alpha" }]);

		const { preload, allData } = useDB<TestItem, "id">(
			fakeStore as any,
			"id"
		);

		// First call loads
		await preload();
		expect(fakeStore.getAll).toHaveBeenCalledTimes(1);

		// Second call without force = skip
		await preload();
		expect(fakeStore.getAll).toHaveBeenCalledTimes(1);

		// With force = reload
		await preload(true);
		expect(fakeStore.getAll).toHaveBeenCalledTimes(2);
	});

	it("get() returns cached item if available", async () => {
		const item: TestItem = { id: "1", name: "Alpha" };
		fakeStore.getAll.mockResolvedValue([item]);
		fakeStore.get.mockResolvedValue(item);

		const { preload, get } = useDB<TestItem, "id">(fakeStore as any, "id");

		await preload();

		// should be cached now
		const result = await get("1");
		expect(result).toEqual(item);

		// get() should not call store.get because it’s cached
		expect(fakeStore.get).not.toHaveBeenCalled();
	});

	it("get() fetches from store if not cached", async () => {
		const item: TestItem = { id: "1", name: "Alpha" };
		fakeStore.getAll.mockResolvedValue([]);
		fakeStore.get.mockResolvedValue(item);

		const { get } = useDB<TestItem, "id">(fakeStore as any, "id");

		const result = await get("1");
		expect(result).toEqual(item);

		// Now it should be cached
		const cached = await get("1");
		expect(cached).toEqual(item);

		expect(fakeStore.get).toHaveBeenCalledTimes(1);
	});

	it("get() returns undefined if item not found", async () => {
		fakeStore.get.mockResolvedValue(undefined);

		const { get } = useDB<TestItem, "id">(fakeStore as any, "id");

		const result = await get("404");
		expect(result).toBeUndefined();
	});
});
