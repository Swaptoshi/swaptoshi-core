/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-cycle */

import { MutableFactoryContext, StoreInstance, VestingUnlockStoreData } from '../types';
import { vestingUnlockStoreSchema } from '../schema';
import { numberToBytes } from '../utils';
import { VestingUnlock } from './instances/vesting_unlock';
import { BaseStoreWithInstance } from './base';

export class VestingUnlockStore extends BaseStoreWithInstance<VestingUnlockStoreData> {
	public async getInstance(ctx: MutableFactoryContext): Promise<StoreInstance<VestingUnlock>> {
		this._checkDependencies();

		const vestingUnlockData = await this.getOrDefault(ctx.context, numberToBytes(ctx.height));

		const vestingUnlock = new VestingUnlock(
			this.stores,
			this.events,
			this.genesisConfig!,
			this.factoryConfig!,
			this.moduleName,
			vestingUnlockData,
			ctx.height,
		);

		vestingUnlock.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
		});

		return vestingUnlock;
	}

	public schema = vestingUnlockStoreSchema;
	protected readonly default = { toBeUnlocked: [] };
}
