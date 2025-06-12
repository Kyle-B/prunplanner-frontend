import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, it, expect, vi } from "vitest";

import {
	callUserLogin,
	callRefreshToken,
	callGetProfile,
} from "@/features/api/userData.api";
import { useUserStore } from "@/stores/userStore";

describe("User Store", () => {
	beforeEach(() => {
		setActivePinia(createPinia());

		vi.mock("@/features/api/userData.api", () => ({
			callUserLogin: vi.fn(),
			callRefreshToken: vi.fn(),
			callGetProfile: vi.fn(),
		}));
	});

	it("Initial store tokens and status", () => {
		const userStore = useUserStore();

		expect(userStore.accessToken).toBeUndefined();
		expect(userStore.refreshToken).toBeUndefined();
		expect(userStore.isLoggedIn).toBeFalsy();
	});

	it("Tokens set, logged in", () => {
		const userStore = useUserStore();

		userStore.setToken("foo", "moo");

		expect(userStore.isLoggedIn).toBeTruthy();
	});

	it("Logout", () => {
		const userStore = useUserStore();

		userStore.logout();

		expect(userStore.accessToken).toBeUndefined();
		expect(userStore.refreshToken).toBeUndefined();
		expect(userStore.isLoggedIn).toBeFalsy();
	});

	it("Perform Login and set token: ok", async () => {
		const userStore = useUserStore();

		const mockUsername = "testuser";
		const mockPassword = "testpassword";
		const mockTokenData = {
			access_token: "mockAccessToken",
			refresh_token: "mockRefreshToken",
		};
		(
			callUserLogin as unknown as ReturnType<typeof vi.fn>
		).mockResolvedValue(mockTokenData);
		(
			callGetProfile as unknown as ReturnType<typeof vi.fn>
		).mockResolvedValue({});

		const result = await userStore.performLogin(mockUsername, mockPassword);

		expect(callUserLogin).toHaveBeenCalledWith(mockUsername, mockPassword);

		expect(result).toBe(true);
	});

	it("Perform Login and set token: error response", async () => {
		const userStore = useUserStore();

		const mockUsername = "testuser";
		const mockPassword = "testpassword";

		(
			callUserLogin as unknown as ReturnType<typeof vi.fn>
		).mockRejectedValue(new Error("Mock login error"));
		(
			callGetProfile as unknown as ReturnType<typeof vi.fn>
		).mockResolvedValue({});

		const result = await userStore.performLogin(mockUsername, mockPassword);
		expect(callUserLogin).toHaveBeenCalledWith(mockUsername, mockPassword);

		expect(result).toBe(false);
	});

	it("Perform Token Refresh", async () => {
		const userStore = useUserStore();

		const mockToken = "testtoken";
		const mockTokenData = {
			access_token: "mockAccessToken",
			refresh_token: "mockRefreshToken",
		};

		userStore.refreshToken = mockToken;

		(
			callRefreshToken as unknown as ReturnType<typeof vi.fn>
		).mockReturnValueOnce(mockTokenData);
		(
			callGetProfile as unknown as ReturnType<typeof vi.fn>
		).mockResolvedValue({});

		expect(userStore.refreshToken).toBe(mockToken);
		const result = await userStore.performTokenRefresh();
		expect(callRefreshToken).toHaveBeenCalledWith(mockToken);

		expect(result).toBe(true);
		expect(userStore.accessToken).toBe(mockTokenData.access_token);
		expect(userStore.refreshToken).toBe(mockTokenData.refresh_token);
	});

	it("Perform Token Refresh, no refresh token", async () => {
		const userStore = useUserStore();

		userStore.refreshToken = undefined;

		(
			callGetProfile as unknown as ReturnType<typeof vi.fn>
		).mockResolvedValue({});

		const result = await userStore.performTokenRefresh();
		expect(result).toBe(false);
	});

	it("Perform Token Refresh: API Error", async () => {
		const userStore = useUserStore();

		const mockToken = "testtoken";

		userStore.refreshToken = mockToken;

		(
			callRefreshToken as unknown as ReturnType<typeof vi.fn>
		).mockRejectedValue(new Error("Mock login error"));
		(
			callGetProfile as unknown as ReturnType<typeof vi.fn>
		).mockResolvedValue({});

		const result = await userStore.performTokenRefresh();
		expect(callRefreshToken).toHaveBeenCalledWith(mockToken);

		expect(result).toBe(false);
	});

	describe("hasFIO", async () => {
		const hasFIOCases = [
			{
				profile: {
					user_id: 1,
					username: "test",
					email: null,
					email_verified: false,
					fio_apikey: "foo",
					prun_username: "moo",
				},
				expected: true,
				description: "Proper values, true",
			},
			{
				profile: undefined,
				expected: false,
				description: "Undefined profile, false",
			},
			{
				profile: {
					user_id: 1,
					username: "test",
					email: null,
					email_verified: false,
					fio_apikey: "",
					prun_username: "",
				},
				expected: false,
				description: "Empty strings, false",
			},
			{
				profile: {
					user_id: 1,
					username: "test",
					email: null,
					email_verified: false,
					fio_apikey: "test",
					prun_username: "",
				},
				expected: false,
				description: "Username missing, false",
			},
			{
				profile: {
					user_id: 1,
					username: "test",
					email: null,
					email_verified: false,
					fio_apikey: "",
					prun_username: "moo",
				},
				expected: false,
				description: "Apikey missing, false",
			},
			{
				profile: {
					user_id: 1,
					username: "test",
					email: null,
					email_verified: false,
					fio_apikey: null,
					prun_username: null,
				},
				expected: false,
				description: "Nulls, false",
			},
		];

		it.each(hasFIOCases)(
			"Test $description",
			async ({ profile, expected, description }) => {
				const userStore = useUserStore();
				userStore.profile = profile;

				expect(userStore.hasFIO).toBe(expected);
			}
		);
	});
});
