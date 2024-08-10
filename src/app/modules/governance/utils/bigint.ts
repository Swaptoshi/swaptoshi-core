import Decimal from 'decimal.js';

export function parseBigintOrPercentage(numberOrPercentageString: string, percentOf: bigint) {
	if (numberOrPercentageString.endsWith('%')) {
		return BigInt(
			new Decimal(percentOf.toString())
				.mul(numberOrPercentageString.slice(0, numberOrPercentageString.length - 1))
				.div(100)
				.toFixed(0),
		);
	}
	return BigInt(numberOrPercentageString);
}
