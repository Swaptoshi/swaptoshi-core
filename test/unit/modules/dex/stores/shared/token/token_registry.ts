import { Token } from './token';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TokenRegistry {
	public static createToken(id: Buffer, token: Token) {
		TokenRegistry.instance.delete(id.toString('hex'));
		TokenRegistry.instance.set(id.toString('hex'), token);
	}

	public static reset() {
		TokenRegistry.instance = new Map();
	}

	public static instance: Map<string, Token> = new Map();
}
