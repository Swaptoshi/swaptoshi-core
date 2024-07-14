import Decimal from 'decimal.js';
import { cryptography } from 'klayr-sdk';
import { ADDRESS_LENGTH, TOKEN_ID_LENGTH } from '../constants';

export function verifyString(name: string, string: string) {
	if (string.length === 0) {
		throw new Error(`${name}, cant be an empty string`);
	}
}

export function verifyBuffer(name: string, buffer: Buffer) {
	if (buffer.length === 0) {
		throw new Error(`${name}, cant be an empty buffer`);
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

export function verifyNumberString(name: string, value: string) {
	try {
		BigInt(value);
	} catch {
		throw new Error(`${name} needs to be in number string format`);
	}
}

export function verifyKlayer32Address(name: string, value: string) {
	try {
		cryptography.address.validateKlayr32Address(value);
	} catch {
		throw new Error(`${name} needs to be in Klayr32 string format`);
	}
}

export function verifyNumber(name: string, value: number) {
	if (typeof value !== 'number') {
		throw new Error(`${name}, needs to be a number`);
	}
}

export function verifyBoolean(name: string, value: boolean) {
	if (typeof value !== 'boolean') {
		throw new Error(`${name}, needs to be a boolean`);
	}
}
