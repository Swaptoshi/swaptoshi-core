export interface ICOExactInputParams {
	path: Buffer;
	tokenOut: Buffer;
	amountIn: bigint;
	deadline: number;
	amountOutMinimum: bigint;
}
