import { Uint256String, Uint256 } from '../int';

export function toAsciiString(addr: Buffer, len: Uint256String): string {
	if (!Uint256.from(len).mod(2).eq(0) || Uint256.from(len).lte(0) || Uint256.from(len).gt(40)) throw new Error('AddressStringUtil: INVALID_LEN');

	return addr.toString('hex').substring(0, parseInt(len, 10)).toUpperCase();
}
