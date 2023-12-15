import { COLLECTION_ID_LENGTH, POOL_ADDRESS_LENGTH, TOKEN_ID_LENGTH } from '../../constants/verify';

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

export function verifyCollectionId(name: string, collectionId: Buffer) {
	if (collectionId.length !== COLLECTION_ID_LENGTH) {
		throw new Error(`${name}, needs to be exactly ${COLLECTION_ID_LENGTH} bytes`);
	}
}

export function verifyAddress(name: string, address: Buffer) {
	if (address.length !== POOL_ADDRESS_LENGTH) {
		throw new Error(`${name}, needs to be exactly ${POOL_ADDRESS_LENGTH} bytes`);
	}
}

export function verifyNumberString(name: string, value: string) {
	try {
		BigInt(value);
	} catch {
		throw new Error(`${name} needs to be in number string format`);
	}
}
