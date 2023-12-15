import { Uint256String, Uint256 } from '../int';

export function divRoundingUp(x: Uint256String, y: Uint256String): Uint256String {
	const z: Uint256 = Uint256.from(x)
		.div(y)
		.add(Uint256.from(x).mod(y).gt(0) ? 1 : 0);
	return z.toString();
}
