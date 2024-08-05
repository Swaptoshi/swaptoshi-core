import Decimal from 'decimal.js';

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
