/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Modules, StateMachine } from 'klayr-sdk';
import { MutableContext, SupportedTokenManager, TokenMethod } from '../types';
import { supportedTokenStoreSchema } from '../schema';
import { DexGovernableConfig } from '../config';

export class SupportedTokenStore extends Modules.BaseStore<SupportedTokenManager> {
	public init(config: DexGovernableConfig) {
		this.config = config;
		if (this.tokenMethod !== undefined) this.dependencyReady = true;
	}

	public addDependencies(tokenMethod: TokenMethod) {
		this.tokenMethod = tokenMethod;
		if (this.config !== undefined) this.dependencyReady = true;
	}

	public async apply(context: Modules.StoreGetter): Promise<void> {
		this._checkDependencies();

		const config = await this.config!.getConfig(context);

		if (await this.has(context, Buffer.alloc(0))) {
			const supportManager = await this.get(context, Buffer.alloc(0));
			if (supportManager.supportAll !== config.supportAllTokens) {
				await this._applyConfig(context);
			}
		} else {
			await this._applyConfig(context);
			const supportManager: SupportedTokenManager = {
				supportAll: config.supportAllTokens,
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

	private async _applyConfig(context: Modules.StoreGetter): Promise<void> {
		const config = await this.config!.getConfig(context);

		if (config.supportAllTokens) {
			await this.tokenMethod?.supportAllTokens(context as StateMachine.MethodContext);
		} else {
			await this.tokenMethod?.removeAllTokensSupport(context as StateMachine.MethodContext);
			const supportManager = await this.get(context, Buffer.alloc(0));
			for (const supportedToken of supportManager.supported) {
				await this.tokenMethod?.supportTokenID(context as StateMachine.MethodContext, supportedToken);
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
	private config: DexGovernableConfig | undefined;
	private dependencyReady = false;
}
