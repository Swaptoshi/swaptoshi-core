/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BaseStore, GenesisConfig, NamedRegistry } from 'klayr-sdk';
import { DexModuleConfig, MutableContext, TokenSymbol } from '../types';
import { tokenSymbolStoreSchema } from '../schema';
import { TokenRegisteredEvent } from '../events/token_registered';
import { getDEXToken, getMainchainToken } from '../utils';

export class TokenSymbolStore extends BaseStore<TokenSymbol> {
	public constructor(moduleName: string, index: number, events: NamedRegistry) {
		super(moduleName, index);
		this.events = events;
	}

	public init(genesisConfig: GenesisConfig, dexConfig: DexModuleConfig) {
		this.genesisConfig = genesisConfig;
		this.dexConfig = dexConfig;
		this.dependencyReady = true;
	}

	public getKey(tokenId: Buffer) {
		return tokenId;
	}

	public async registerSymbol(ctx: MutableContext, tokenId: Buffer, symbol: string, decimal: number) {
		this._checkDependencies();
		if (await this.has(ctx, this.getKey(tokenId))) return;

		let _symbol = symbol;
		let _decimal = decimal;

		if (this._isInvalidMainchainToken(tokenId, symbol, decimal)) throw new Error('invalid mainchain token parameter');

		if (this._isInvalidDEXToken(tokenId, symbol, decimal)) throw new Error('invalid dex token parameter');

		const mainchain = getMainchainToken(this.genesisConfig!, this.dexConfig!);
		const dex = getDEXToken(this.genesisConfig!, this.dexConfig!);

		if (this.getKey(tokenId).compare(mainchain.tokenId) === 0) {
			_symbol = mainchain.symbol;
			_decimal = mainchain.decimal;
		} else if (this.getKey(tokenId).compare(dex.tokenId) === 0) {
			_symbol = mainchain.symbol;
			_decimal = mainchain.decimal;
		}

		await this.set(ctx, this.getKey(tokenId), { symbol: _symbol, decimal: _decimal });

		const events = this.events.get(TokenRegisteredEvent);
		events.add(
			ctx,
			{
				tokenId,
				symbol: _symbol,
				decimal: _decimal,
			},
			[tokenId],
		);
	}

	private _isInvalidMainchainToken(tokenId: Buffer, symbol: string, decimal: number) {
		const mainchain = getMainchainToken(this.genesisConfig!, this.dexConfig!);
		const isMainchainToken = this.getKey(tokenId).compare(mainchain.tokenId) === 0;

		return (isMainchainToken && (symbol !== mainchain.symbol || decimal !== mainchain.decimal)) || (symbol === mainchain.symbol && (!isMainchainToken || decimal !== mainchain.decimal));
	}

	private _isInvalidDEXToken(tokenId: Buffer, symbol: string, decimal: number) {
		const dex = getDEXToken(this.genesisConfig!, this.dexConfig!);
		const isDEXToken = this.getKey(tokenId).compare(dex.tokenId) === 0;

		return (isDEXToken && (symbol !== dex.symbol || decimal !== dex.decimal)) || (symbol === dex.symbol && (!isDEXToken || decimal !== dex.decimal));
	}

	private _checkDependencies() {
		if (!this.dependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	public schema = tokenSymbolStoreSchema;

	private readonly events: NamedRegistry;

	private dexConfig: DexModuleConfig | undefined = undefined;
	private genesisConfig: GenesisConfig | undefined = undefined;

	private dependencyReady = false;
}
