import { Uint256String, Uint, Uint256 } from '../int';

export function mulDiv(
	a: Uint256String,
	b: Uint256String,
	denominator: Uint256String,
): Uint256String {
	if (denominator === '0') throw new Error('Denominator must be greater than zero');
	if (Uint.from(a).mul(b).div(denominator).gt(Uint256.MAX)) throw new Error('overflow');

	if (a === '0' || b === '0') return '0';
	return Uint.from(a).mul(b).div(denominator).toString();
}

export function mulDivRoundingUp(
	a: Uint256String,
	b: Uint256String,
	denominator: Uint256String,
): Uint256String {
	let result: Uint256 = Uint256.from(mulDiv(a, b, denominator));

	if (Uint.from(a).mul(b).mod(denominator).gt(0)) {
		if (result.gte(Uint256.MAX)) {
			throw new Error('Result exceeds the maximum value for uint256');
		}
		result = result.add(1);
	}

	return result.toString();
}
