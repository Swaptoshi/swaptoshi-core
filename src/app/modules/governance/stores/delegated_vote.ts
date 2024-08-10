/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { delegatedVoteStoreSchema } from '../schema';
import { ImmutableGovernanceContext, MutableGovernanceContext, StoreInstance, DelegatedVoteStoreData } from '../types';
import { BaseStoreWithInstance } from './base';
import { DelegatedVote } from './instances';

export class DelegatedVoteStore extends BaseStoreWithInstance<DelegatedVoteStoreData> {
	public async getMutableDelegatedVote(ctx: MutableGovernanceContext): Promise<StoreInstance<DelegatedVote>> {
		this._checkDependencies();

		const delegatedVoteData = await this.getOrDefault(ctx.context, ctx.senderAddress);

		const delegatedVote = new DelegatedVote(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, delegatedVoteData, ctx.senderAddress);

		delegatedVote.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			internalMethod: this.internalMethod,
		});

		return delegatedVote;
	}

	public async getImmutableDelegatedVote(ctx: ImmutableGovernanceContext): Promise<StoreInstance<DelegatedVote>> {
		this._checkDependencies();

		const delegatedVoteData = await this.getOrDefault(ctx.context, ctx.senderAddress);

		const delegatedVote = new DelegatedVote(this.stores, this.events, this.config!, this.genesisConfig!, this.moduleName, delegatedVoteData, ctx.senderAddress);

		delegatedVote.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			internalMethod: this.internalMethod,
		});

		return delegatedVote;
	}

	public schema = delegatedVoteStoreSchema;
	protected readonly default = { outgoingDelegation: Buffer.alloc(0), incomingDelegation: [] };
}
