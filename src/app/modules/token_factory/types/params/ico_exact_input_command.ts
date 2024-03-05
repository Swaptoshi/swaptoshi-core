export interface ICOExactInputParams {
	path: Buffer;
	tokenOut: Buffer;
	amountIn: bigint;
	recipient: Buffer;
	deadline: number;
	pathAmountOutMinimum: bigint;
}
