/* eslint-disable */
import { Modules, StateMachine } from 'klayr-sdk';
import { RevokeDelegatedVoteParams } from '../types';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { DelegatedVoteStore } from '../stores/delegated_vote';
import { revokeDelegatedVoteCommandSchema } from '../schema';

export class RevokeDelegatedVoteCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<RevokeDelegatedVoteParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const delegatedVote = await this.stores.get(DelegatedVoteStore).getImmutableDelegatedVote(context);
			await delegatedVote.verifyRevokeDelegatedVote(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<RevokeDelegatedVoteParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const delegatedVote = await this.stores.get(DelegatedVoteStore).getMutableDelegatedVote(context);
		await delegatedVote.revokeDelegatedVote(_context.params, false);
	}

	public schema = revokeDelegatedVoteCommandSchema;
}
