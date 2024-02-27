export interface ICOCreateParams {
	tokenIn: Buffer;
	tokenOut: Buffer;
	price: string;
	amount: bigint;
	providerAddress: Buffer;
}
