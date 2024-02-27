import Decimal from 'decimal.js';
import { ADDRESS_LENGTH, TOKEN_ID_LENGTH } from '../constants';

export function verifyString(name: string, string: string) {
	if (string.length === 0) {
		throw new Error(`${name}, cant be an empty string`);
	}
}

export function verifyToken(name: string, token: Buffer) {
	if (token.length !== TOKEN_ID_LENGTH) {
		throw new Error(`${name}, needs to be exactly ${TOKEN_ID_LENGTH} bytes`);
	}
}

export function verifyAddress(name: string, address: Buffer) {
	if (address.length !== ADDRESS_LENGTH) {
		throw new Error(`${name}, needs to be exactly ${ADDRESS_LENGTH} bytes`);
	}
}

export function verifyPositiveNumber(name: string, number: bigint | number | string) {
	if (new Decimal(Number(number)).lt(0)) {
		throw new Error(`${name}, must be a positive number`);
	}
}
