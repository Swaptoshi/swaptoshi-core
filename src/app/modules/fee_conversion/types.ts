import { FeeMethod, JSONObject, TokenMethod } from 'klayr-sdk';
import { FeeConvertedEventData } from './events/fee_converted';
import { DexMethod } from '../dex/method';
import { GovernanceMethod } from '../governance';

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

export interface FeeConversionModuleDependencies {
	tokenMethod: TokenMethod;
	feeMethod: FeeMethod;
	dexMethod: DexMethod;
	governanceMethod?: GovernanceMethod;
}
