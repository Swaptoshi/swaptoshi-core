import { JSONObject } from 'klayr-sdk';
import { FeeConvertedEventData } from './events/fee_converted';

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
	data: JSONObject<FeeConvertedEventData>;
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
