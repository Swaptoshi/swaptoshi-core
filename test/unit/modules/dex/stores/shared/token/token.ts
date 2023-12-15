export class Token {
	public supply: bigint = BigInt(0);
	public balance: Map<string, bigint> = new Map();
	public locked: Map<string, bigint> = new Map();
}
