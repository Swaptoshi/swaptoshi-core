/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { boostedAccountStoreSchema } from '../schema';
import { ImmutableGovernanceContext, MutableGovernanceContext, BoostedAccountStoreData, StoreInstance } from '../types';
import { BaseStoreWithInstance } from './base';
import { BoostedAccount } from './instances';

export class BoostedAccountStore extends BaseStoreWithInstance<BoostedAccountStoreData> {
	public async getMutableBoostedAccount(ctx: MutableGovernanceContext): Promise<StoreInstance<BoostedAccount>> {
		this._checkDependencies();

		const boostedAccountData = await this.getOrDefault(ctx.context, ctx.senderAddress);

		const boostedAccount = new BoostedAccount(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, boostedAccountData, ctx.senderAddress);

		boostedAccount.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			internalMethod: this.internalMethod,
		});

		return boostedAccount;
	}

	public async getImmutableBoostedAccount(ctx: ImmutableGovernanceContext): Promise<StoreInstance<BoostedAccount>> {
		this._checkDependencies();

		const boostedAccountData = await this.getOrDefault(ctx.context, ctx.senderAddress);

		const boostedAccount = new BoostedAccount(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, boostedAccountData, ctx.senderAddress);

		boostedAccount.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			internalMethod: this.internalMethod,
		});

		return boostedAccount;
	}

	public schema = boostedAccountStoreSchema;
	protected readonly default = { targetHeight: 0 };
}
