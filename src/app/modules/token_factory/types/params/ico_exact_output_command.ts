export interface ICOExactOutputParams {
	path: Buffer;
	tokenOut: Buffer;
	amountOut: bigint;
	recipient: Buffer;
	deadline: number;
	pathAmountInMaximum: bigint;
}
