export interface ICOExactOutputParams {
	path: Buffer;
	tokenOut: Buffer;
	amountOut: bigint;
	deadline: number;
	amountInMaximum: bigint;
}
