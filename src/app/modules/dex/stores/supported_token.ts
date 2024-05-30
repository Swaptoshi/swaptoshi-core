/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BaseStore, MethodContext, StoreGetter, TokenMethod } from 'klayr-sdk';
import { DexModuleConfig, MutableContext, SupportedTokenManager } from '../types';
import { supportedTokenStoreSchema } from '../schema/stores/supported_token';

export class SupportedTokenStore extends BaseStore<SupportedTokenManager> {
	public init(config: DexModuleConfig) {
		this.config = config;
		if (this.tokenMethod !== undefined) this.dependencyReady = true;
	}

	public addDependencies(tokenMethod: TokenMethod) {
		this.tokenMethod = tokenMethod;
		if (this.config !== undefined) this.dependencyReady = true;
	}

	public async apply(context: StoreGetter): Promise<void> {
		this._checkDependencies();

		if (await this.has(context, Buffer.alloc(0))) {
			const supportManager = await this.get(context, Buffer.alloc(0));
			if (supportManager.supportAll !== this.config!.supportAllTokens) {
				await this._applyConfig(context);
			}
		} else {
			await this._applyConfig(context);
			const supportManager: SupportedTokenManager = {
				supportAll: this.config!.supportAllTokens,
				supported: [],
			};
			await this.set(context, Buffer.alloc(0), supportManager);
		}
	}

	public async addSupport(context: MutableContext, tokenId: Buffer): Promise<void> {
		this._checkDependencies();
		const supportManager = await this.get(context, Buffer.alloc(0));
		if (!supportManager.supportAll) {
			await this.tokenMethod?.supportTokenID(context, tokenId);
		}
		if (!supportManager.supported.map(t => t.toString('hex')).includes(tokenId.toString('hex'))) {
			supportManager.supported.push(tokenId);
		}
		await this.set(context, Buffer.alloc(0), supportManager);
	}

	private async _applyConfig(context: StoreGetter): Promise<void> {
		if (this.config?.supportAllTokens) {
			await this.tokenMethod?.supportAllTokens(context as MethodContext);
		} else {
			await this.tokenMethod?.removeAllTokensSupport(context as MethodContext);
			const supportManager = await this.get(context, Buffer.alloc(0));
			for (const supportedToken of supportManager.supported) {
				await this.tokenMethod?.supportTokenID(context as MethodContext, supportedToken);
			}
		}
	}

	private _checkDependencies() {
		if (!this.dependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	public schema = supportedTokenStoreSchema;

	private tokenMethod: TokenMethod | undefined;
	private config: DexModuleConfig | undefined;
	private dependencyReady = false;
}
