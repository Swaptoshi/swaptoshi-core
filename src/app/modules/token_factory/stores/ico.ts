/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-cycle */
import { ICOStoreData, ImmutableFactoryContext, MutableFactoryContext, StoreInstance } from '../types';
import { icoStoreSchema } from '../schema';
import { ICOPool } from './instances/ico_pool';
import { BaseStoreWithInstance } from './base';
import { computeICOPoolAddress } from './library';
import { ICORouter } from './instances/ico_router';
import { ICOQuoter } from './instances/ico_quoter';

export class ICOStore extends BaseStoreWithInstance<ICOStoreData> {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async getMutableEmptyICOPool(ctx: MutableFactoryContext) {
		this._checkDependencies();
		const ico = new ICOPool(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.default, Buffer.alloc(0));
		ico.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});
		return ico;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getImmutableEmptyICOPool(ctx: ImmutableFactoryContext) {
		this._checkDependencies();
		const ico = new ICOPool(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.default, Buffer.alloc(0));
		ico.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});
		return ico;
	}

	public async getMutableICOPool(ctx: MutableFactoryContext, tokenIn: Buffer, tokenOut: Buffer): Promise<StoreInstance<ICOPool>> {
		this._checkDependencies();

		const icoData = await this.get(ctx.context, this._getKey(tokenIn, tokenOut));

		const ico = new ICOPool(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, icoData, this._getKey(tokenIn, tokenOut));

		ico.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});

		return ico;
	}

	public async getImmutableICOPool(ctx: ImmutableFactoryContext, tokenIn: Buffer, tokenOut: Buffer): Promise<StoreInstance<ICOPool>> {
		this._checkDependencies();

		const icoData = await this.get(ctx.context, this._getKey(tokenIn, tokenOut));

		const ico = new ICOPool(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, icoData, this._getKey(tokenIn, tokenOut));

		ico.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});

		return ico;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getMutableICORouter(ctx: MutableFactoryContext): Promise<StoreInstance<ICORouter>> {
		this._checkDependencies();

		const ico = new ICORouter(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName);

		ico.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
			dexMethod: this.dexMethod!,
		});

		return ico;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getImmutableICORouter(ctx: ImmutableFactoryContext): Promise<StoreInstance<ICORouter>> {
		this._checkDependencies();

		const ico = new ICORouter(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName);

		ico.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
			dexMethod: this.dexMethod!,
		});

		return ico;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getImmutableICOQuoter(ctx: ImmutableFactoryContext): Promise<StoreInstance<ICOQuoter>> {
		this._checkDependencies();

		const quoter = new ICOQuoter(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName);

		quoter.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
			dexMethod: this.dexMethod!,
		});

		return quoter;
	}

	private _getKey(tokenIn: Buffer, tokenOut: Buffer) {
		return computeICOPoolAddress({ tokenIn, tokenOut });
	}

	public schema = icoStoreSchema;
	protected readonly default = { price: '0', providerAddress: Buffer.alloc(0) };
}
