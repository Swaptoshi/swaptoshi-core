/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-cycle */
import { FactoryStoreData, ImmutableFactoryContext, MutableFactoryContext, StoreInstance } from '../types';
import { factoryStoreSchema } from '../schema';
import { TOKEN_ID_LENGTH } from '../constants';
import { Factory } from './instances/factory';
import { BaseStoreWithInstance } from './base';

export class FactoryStore extends BaseStoreWithInstance<FactoryStoreData> {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async getMutableEmptyFactory(ctx: MutableFactoryContext) {
		this._checkDependencies();
		const factory = new Factory(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.default, Buffer.alloc(0));
		factory.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});
		return factory;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getImmutableEmptyFactory(ctx: ImmutableFactoryContext) {
		this._checkDependencies();
		const factory = new Factory(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.default, Buffer.alloc(0));
		factory.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});
		return factory;
	}

	public async getMutableFactory(ctx: MutableFactoryContext, tokenId: Buffer): Promise<StoreInstance<Factory>> {
		this._checkDependencies();

		const factoryData = await this.get(ctx.context, this._getKey(tokenId));

		const factory = new Factory(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, factoryData, tokenId);

		factory.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});

		return factory;
	}

	public async getImmutableFactory(ctx: ImmutableFactoryContext, tokenId: Buffer): Promise<StoreInstance<Factory>> {
		this._checkDependencies();

		const factoryData = await this.get(ctx.context, this._getKey(tokenId));

		const factory = new Factory(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, factoryData, tokenId);

		factory.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});

		return factory;
	}

	private _getKey(key: Buffer) {
		if (key.length !== TOKEN_ID_LENGTH) {
			throw new Error('invalid token id');
		}
		return key;
	}

	public schema = factoryStoreSchema;
	protected readonly default = { owner: Buffer.alloc(0), attributesArray: [] };
}
