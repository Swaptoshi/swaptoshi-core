/* eslint-disable */
import { Modules, StateMachine } from 'klayr-sdk';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { DelegateVoteParams } from '../types';
import { DelegatedVoteStore } from '../stores/delegated_vote';
import { delegateVoteCommandSchema } from '../schema';

export class DelegateVoteCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<DelegateVoteParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const delegatedVote = await this.stores.get(DelegatedVoteStore).getImmutableDelegatedVote(context);
			await delegatedVote.verifyDelegateVote(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<DelegateVoteParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const delegatedVote = await this.stores.get(DelegatedVoteStore).getMutableDelegatedVote(context);
		await delegatedVote.delegateVote(_context.params, false);
	}

	public schema = delegateVoteCommandSchema;
}
