export function numberToBytes(num: number) {
	const buff = Buffer.allocUnsafe(4);
	buff.writeUIntBE(num, 0, 4);
	return buff;
}

export function bytesToNumber(buffer: Buffer) {
	return buffer.readUIntBE(0, 4);
}
