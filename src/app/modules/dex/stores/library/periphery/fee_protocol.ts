import { Uint8, Uint8String } from '../int';

export function calculateFeeProtocol(feeProtocol0: Uint8String, feeProtocol1: Uint8String) {
	if (
		!(Uint8.from(feeProtocol0).eq(0) || (Uint8.from(feeProtocol0).gte(4) && Uint8.from(feeProtocol0).lte(10))) ||
		!(Uint8.from(feeProtocol1).eq(0) || (Uint8.from(feeProtocol1).gte(4) && Uint8.from(feeProtocol1).lte(10)))
	) {
		throw new Error('setFeeeProtocol failed');
	}

	return Uint8.from(feeProtocol0).add(Uint8.from(feeProtocol1).shl(4)).toNumber();
}
