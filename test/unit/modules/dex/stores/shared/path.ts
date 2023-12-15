const ADDR_SIZE = 8;
const FEE_SIZE = 3;
const OFFSET = ADDR_SIZE + FEE_SIZE;
const DATA_SIZE = OFFSET + ADDR_SIZE;

export function encodePath(path: Buffer[], fees: string[]): Buffer {
	if (path.length !== fees.length + 1) {
		throw new Error('path/fee lengths do not match');
	}

	let encoded = '';
	for (let i = 0; i < fees.length; i += 1) {
		// 20 byte encoding of the address
		encoded += path[i].toString('hex');
		// 3 byte encoding of the fee
		encoded += parseInt(fees[i], 10)
			.toString(16)
			.padStart(2 * FEE_SIZE, '0');
	}
	// encode the final token
	encoded += path[path.length - 1].toString('hex');

	return Buffer.from(encoded, 'hex');
}

function decodeOne(tokenFeeToken: Buffer): [[Buffer, Buffer], string] {
	// reads the first 20 bytes for the token address
	const tokenABuf = tokenFeeToken.subarray(0, ADDR_SIZE);
	const tokenA = tokenABuf;

	// reads the next 2 bytes for the fee
	const feeBuf = tokenFeeToken.subarray(ADDR_SIZE, OFFSET);
	const fee = feeBuf.readUIntBE(0, FEE_SIZE);

	// reads the next 20 bytes for the token address
	const tokenBBuf = tokenFeeToken.subarray(OFFSET, DATA_SIZE);
	const tokenB = tokenBBuf;

	return [[tokenA, tokenB], fee.toString()];
}

export function decodePath(path: Buffer): [Buffer[], string[]] {
	let data = path;

	let tokens: Buffer[] = [];
	let fees: string[] = [];
	let i = 0;
	let finalToken: Buffer = Buffer.alloc(0);
	while (data.length >= DATA_SIZE) {
		const [[tokenA, tokenB], fee] = decodeOne(data);
		finalToken = tokenB;
		tokens = [...tokens, tokenA];
		fees = [...fees, fee];
		data = data.subarray((i + 1) * OFFSET);
		i += 1;
	}
	tokens = [...tokens, finalToken];

	return [tokens, fees];
}
