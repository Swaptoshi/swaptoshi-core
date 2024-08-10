/* eslint-disable */
import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { DelegateVoteParams } from '../types';
import { DelegatedVoteStore } from '../stores/delegated_vote';
import { delegateVoteCommandSchema } from '../schema';

export class DelegateVoteCommand extends BaseCommand {
	public async verify(_context: CommandVerifyContext<DelegateVoteParams>): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const delegatedVote = await this.stores.get(DelegatedVoteStore).getImmutableDelegatedVote(context);
			await delegatedVote.verifyDelegateVote(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<DelegateVoteParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const delegatedVote = await this.stores.get(DelegatedVoteStore).getMutableDelegatedVote(context);
		await delegatedVote.delegateVote(_context.params, false);
	}

	public schema = delegateVoteCommandSchema;
}
