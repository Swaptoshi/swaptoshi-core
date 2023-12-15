/* eslint-disable no-bitwise */
const ALPHABET = '0123456789abcdef';

export function toHexString(value: number | bigint | string | Buffer, length: number): string {
	let _value = BigInt(0);

	if (typeof value === 'number') _value = BigInt(value);
	if (typeof value === 'string') _value = BigInt(value);
	if (typeof value === 'bigint') _value = value;
	if (Buffer.isBuffer(value)) _value = BigInt(bufferToUint256String(value));

	const buffer: string[] = new Array<string>(2 * length);

	for (let i = buffer.length; i > 0; i -= 1) {
		const index = BigInt(_value) & BigInt(0xf);
		buffer[i - 1] = ALPHABET[Number(index)];
		_value >>= BigInt(4);
	}

	return buffer.join('');
}

export function bufferToUint256String(value: Buffer) {
	return BigInt(`0x${value.toString('hex')}`).toString();
}
