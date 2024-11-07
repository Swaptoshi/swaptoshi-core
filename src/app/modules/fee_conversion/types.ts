/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-cycle */
/* eslint-disable import/no-extraneous-dependencies */
import { Types, Modules } from 'klayr-sdk';

import { FeeConvertedEventData } from './events/fee_converted';
import { DexMethod } from '../dex/method';
import { GovernanceMethod } from '../governance';

export type TokenMethod = Modules.Token.TokenMethod;
export type FeeMethod = Modules.Fee.FeeMethod;

export enum FeeConversionVerifyStatus {
	WITH_CONVERSION = 1,
	NO_CONVERSION = 0,
	ERROR = -1,
}

export interface FeeConversionVerificationPayload {
	tokenId: Buffer;
	txAmount: bigint;
}

export interface FeeConversionVerificationResult {
	status: FeeConversionVerifyStatus;
	payload?: FeeConversionVerificationPayload;
}

export interface FeeConversionPayload {
	path: Buffer;
	txAmount: bigint;
	amountIn: string;
	amountOut: string;
}

export interface RegisteredMethodResponse {
	handlers: RegisteredMethod[];
}

export interface DryRunTransactionResponse {
	status: FeeConversionVerifyStatus;
	data: Types.JSONObject<FeeConvertedEventData>;
	errorMessage: string;
}

export interface RegisteredMethod {
	module: string;
	method: string[];
}

export interface FeeConversionModuleConfig {
	conversionPath: string[];
}

export interface HandlerExecutionResult {
	status: FeeConversionVerifyStatus;
	payload?: FeeConversionPayload;
}

export interface FeeConversionModuleDependencies {
	tokenMethod: TokenMethod;
	feeMethod: FeeMethod;
	dexMethod: DexMethod;
	governanceMethod?: GovernanceMethod;
}

export type ConfigPathKeys<T> = T extends object
	? {
			[K in keyof T]: K extends string
				? T[K] extends any[]
					? `${K}` | `${K}.${number}` | `${K}[${number}]` | `${K}.${number}.${ConfigPathKeys<T[K][number]>}` | `${K}[${number}].${ConfigPathKeys<T[K][number]>}`
					: T[K] extends object
					? `${K}` | `${K}.${ConfigPathKeys<T[K]>}`
					: `${K}`
				: never;
	  }[keyof T]
	: never;

export type ConfigPathType<T, P extends string> = P extends `${infer K}.${infer Rest}`
	? K extends keyof T
		? Rest extends `${infer N}.${infer SubRest}`
			? N extends `${number}`
				? T[K] extends any[]
					? ConfigPathType<T[K][number], SubRest>
					: never
				: ConfigPathType<T[K], Rest>
			: Rest extends `${number}`
			? T[K] extends any[]
				? T[K][number]
				: never
			: ConfigPathType<T[K], Rest>
		: never
	: P extends keyof T
	? T[P]
	: never;

export interface UpdatedProperty {
	path: string;
	old: string;
	new: string;
	type: string;
}
