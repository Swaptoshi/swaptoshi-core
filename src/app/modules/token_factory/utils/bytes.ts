export function numberToBytes(num: number) {
	if (!Number.isSafeInteger(num)) {
		throw new Error('Number is out of range');
	}

	const size = num === 0 ? 0 : Math.ceil((Math.floor(Math.log2(num)) + 1) / 8);
	const bytes = new Uint8Array(size);

	let x = num;
	for (let i = size - 1; i >= 0; i -= 1) {
		// eslint-disable-next-line no-bitwise
		const rightByte = x & 0xff;
		bytes[i] = rightByte;
		x = Math.floor(x / 0x100);
	}

	return Buffer.from(bytes);
}

export function bytesToNumber(buffer: Buffer) {
	const bytes = new Uint8ClampedArray(buffer);
	const size = bytes.byteLength;
	let x = 0;
	for (let i = 0; i < size; i += 1) {
		const byte = bytes[i];
		x *= 0x100;
		x += byte;
	}
	return x;
}
