import Decimal from 'decimal.js';
import { ADDRESS_LENGTH } from '../constants';

export function verifyPositiveNumber(name: string, number: bigint | number | string) {
	if (new Decimal(Number(number)).lt(0)) {
		throw new Error(`${name}, must be a positive number`);
	}
}

export function verifyNumberString(name: string, value: string) {
	try {
		BigInt(value);
	} catch {
		throw new Error(`${name} needs to be in number string format`);
	}
}

export function verifyAddress(name: string, address: Buffer) {
	if (address.length !== ADDRESS_LENGTH) {
		throw new Error(`${name}, needs to be exactly ${ADDRESS_LENGTH} bytes`);
	}
}
