import { Uint128String, Int128String, Uint128, Int128 } from '../int';

export function addDelta(_x: Uint128String, _y: Int128String): Uint128String {
	const x = Uint128.from(_x);
	const y = Int128.from(_y);

	if (y.lt(0)) {
		const z = x.sub(y.abs());
		if (z.gte(x)) {
			throw new Error('LS');
		}
		return z.toString();
	}

	const z = x.add(y);

	if (z.lt(x)) {
		throw new Error('LA');
	}

	return z.toString();
}
