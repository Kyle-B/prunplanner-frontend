import { z } from "zod";

// Types & Interfaces
import {
	IUserLoginPayload,
	IUserRefreshPayload,
	IUserTokenResponse,
} from "@/features/api/userData.types";

export const LoginPayloadSchema: z.ZodType<IUserLoginPayload> = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

export const TokenResponseSchema: z.ZodType<IUserTokenResponse> = z.object({
	access_token: z.string().min(120),
	refresh_token: z.string().min(120),
});

export const RefreshPayloadSchema: z.ZodType<IUserRefreshPayload> = z.object({
	refresh_token: z.string().min(120),
});

export const UserProfilePayloadSchema = z.object({
	user_id: z.number(),
	username: z.string(),
	email: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.nullable(),
	email_verified: z.boolean(),
	fio_apikey: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.nullable(),
	prun_username: z
		.string()
		.transform((val) => (val === "" ? null : val))
		.nullable(),
	last_login: z.coerce.date().optional(),
	last_action: z.coerce.date().optional(),
});

export const UserProfilePatchSchema = z.object({
	fio_apikey: z
		.string()
		.transform((val) => (val === "" || !val ? null : val))
		.nullable(),
	prun_username: z
		.string()
		.transform((val) => (val === "" || !val ? null : val))
		.nullable(),
	email: z
		.string()
		.transform((val) => (val === "" || !val ? null : val))
		.nullable(),
});

export const UserChangePasswordPayloadSchema = z.object({
	old: z.string(),
	new: z.string(),
});

export const UserChangePasswordResponseSchema = z.object({
	message: z.string(),
});

export const UserVerifyEmailPayloadSchema = z.object({
	code: z.string(),
});

export const UserVerifyEmailResponseSchema = z.object({
	status_code: z.int(),
	message: z.string(),
});

export type LoginPayloadType = z.infer<typeof LoginPayloadSchema>;
export type TokenResponseType = z.infer<typeof TokenResponseSchema>;
export type RefreshPayloadType = z.infer<typeof RefreshPayloadSchema>;
export type UserProfilePayloadType = z.infer<typeof UserProfilePayloadSchema>;
export type UserProfilePatchPayloadType = z.infer<
	typeof UserProfilePatchSchema
>;
export type UserChangePasswordPayloadType = z.infer<
	typeof UserChangePasswordPayloadSchema
>;
export type UserChangePasswordResponseType = z.infer<
	typeof UserChangePasswordResponseSchema
>;
export type UserVerifyEmailPayloadType = z.infer<
	typeof UserVerifyEmailPayloadSchema
>;
export type UserVerifyEmailResponseType = z.infer<
	typeof UserVerifyEmailResponseSchema
>;
