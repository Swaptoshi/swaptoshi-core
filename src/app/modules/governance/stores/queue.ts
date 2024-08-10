/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { proposalQueueStoreSchema } from '../schema';
import { MutableGovernanceContext, ProposalQueueStoreData, StoreInstance } from '../types';
import { numberToBytes } from '../utils';
import { BaseStoreWithInstance } from './base';
import { ProposalQueue } from './instances/queue';

export class ProposalQueueStore extends BaseStoreWithInstance<ProposalQueueStoreData> {
	public async getInstance(ctx: MutableGovernanceContext): Promise<StoreInstance<ProposalQueue>> {
		this._checkDependencies();

		const proposalQueueData = await this.getOrDefault(ctx.context, numberToBytes(ctx.height));

		const queue = new ProposalQueue(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, this.governableConfigRegistry!, proposalQueueData, ctx.height);

		queue.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
		});

		return queue;
	}

	public schema = proposalQueueStoreSchema;
	protected readonly default = { start: [], quorum: [], ends: [], execute: [] };
}
