export function slice(_bytes: Buffer, _start: number, _length: number): Buffer {
	if (_length + 31 < _length || _start + _length < _start) {
		throw new Error('slice_overflow');
	}

	if (_bytes.length < _start + _length) {
		throw new Error('slice_outOfBounds');
	}

	return _bytes.subarray(_start, _length + _start);
}

export function toAddress(_bytes: Buffer, _start: number): Buffer {
	if (_start + 8 < _start) {
		throw new Error('toAddress_overflow');
	}

	if (_bytes.length < _start + 8) {
		throw new Error('toAddress_outOfBounds');
	}

	const tempAddressBytes = _bytes.subarray(_start, _start + 8);
	return tempAddressBytes;
}

export function toUint24(_bytes: Buffer, _start: number): number {
	if (_start + 3 < _start) {
		throw new Error('toUint24_overflow');
	}

	if (_bytes.length < _start + 3) {
		throw new Error('toUint24_outOfBounds');
	}

	const tempUintBytes = _bytes.subarray(_start, _start + 3);
	const tempUint = tempUintBytes.readUIntBE(0, 3);

	return tempUint;
}
