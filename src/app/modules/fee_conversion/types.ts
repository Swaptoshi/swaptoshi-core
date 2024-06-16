export enum FeeConversionVerifyStatus {
	WITH_CONVERSION = 1,
	NO_CONVERSION = 0,
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
	tokenIn: Buffer;
	tokenOut: Buffer;
	fee: string;
	txAmount: bigint;
	amountIn: string;
	amountOut: string;
}

export interface RegisteredMethodResponse {
	handlers: RegisteredMethod[];
}

export interface RegisteredMethod {
	module: string;
	method: string[];
}
