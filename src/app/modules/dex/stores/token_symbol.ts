import { BaseStore, NamedRegistry } from 'lisk-sdk';
import { MutableContext, TokenSymbol } from '../types';
import {
	LSK_TOKEN_DECIMAL,
	LSK_TOKEN_ID,
	LSK_TOKEN_SYMBOL,
	SWT_TOKEN_DECIMAL,
	SWT_TOKEN_ID,
	SWT_TOKEN_SYMBOL,
} from '../constants';
import { tokenSymbolStoreSchema } from '../schema/stores/token_symbol';
import { TokenRegisteredEvent } from '../events/token_registered';

export class TokenSymbolStore extends BaseStore<TokenSymbol> {
	public constructor(moduleName: string, index: number, events: NamedRegistry) {
		super(moduleName, index);
		this.events = events;
	}

	public getKey(tokenId: Buffer) {
		return tokenId.subarray(1);
	}

	public async registerSymbol(
		ctx: MutableContext,
		tokenId: Buffer,
		symbol: string,
		decimal: number,
	) {
		if (await this.has(ctx, this.getKey(tokenId))) return;

		let _symbol = symbol;
		let _decimal = decimal;

		if (
			this._isInvalidLSKToken(tokenId, symbol, decimal) ||
			this._isInvalidSWTToken(tokenId, symbol, decimal)
		) {
			// throw new Error('invalid parameter');
			throw new Error(`${tokenId.toString('hex')} ${symbol} ${decimal}`);
		}

		if (this.getKey(tokenId).compare(LSK_TOKEN_ID) === 0) {
			_symbol = LSK_TOKEN_SYMBOL;
			_decimal = LSK_TOKEN_DECIMAL;
		} else if (this.getKey(tokenId).compare(SWT_TOKEN_ID) === 0) {
			_symbol = SWT_TOKEN_SYMBOL;
			_decimal = SWT_TOKEN_DECIMAL;
		}

		await this.set(ctx, this.getKey(tokenId), { symbol: _symbol, decimal: _decimal });

		const events = this.events.get(TokenRegisteredEvent);
		events.add(ctx, {
			tokenId,
			symbol: _symbol,
			decimal: _decimal,
		});
	}

	private _isInvalidLSKToken(tokenId: Buffer, symbol: string, decimal: number) {
		return (
			(this.getKey(tokenId).compare(LSK_TOKEN_ID) === 0 &&
				(symbol !== LSK_TOKEN_SYMBOL || decimal !== LSK_TOKEN_DECIMAL)) ||
			(symbol === LSK_TOKEN_SYMBOL &&
				(this.getKey(tokenId).compare(LSK_TOKEN_ID) !== 0 || decimal !== LSK_TOKEN_DECIMAL))
		);
	}

	private _isInvalidSWTToken(tokenId: Buffer, symbol: string, decimal: number) {
		return (
			(this.getKey(tokenId).compare(SWT_TOKEN_ID) === 0 &&
				(symbol !== SWT_TOKEN_SYMBOL || decimal !== SWT_TOKEN_DECIMAL)) ||
			(symbol === SWT_TOKEN_SYMBOL &&
				(this.getKey(tokenId).compare(SWT_TOKEN_ID) !== 0 || decimal !== SWT_TOKEN_DECIMAL))
		);
	}

	public schema = tokenSymbolStoreSchema;
	private readonly events: NamedRegistry;
}
