/* eslint-disable */
import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { RevokeDelegatedVoteParams } from '../types';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { DelegatedVoteStore } from '../stores/delegated_vote';
import { revokeDelegatedVoteCommandSchema } from '../schema';

export class RevokeDelegatedVoteCommand extends BaseCommand {
	public async verify(_context: CommandVerifyContext<RevokeDelegatedVoteParams>): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const delegatedVote = await this.stores.get(DelegatedVoteStore).getImmutableDelegatedVote(context);
			await delegatedVote.verifyRevokeDelegatedVote(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<RevokeDelegatedVoteParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const delegatedVote = await this.stores.get(DelegatedVoteStore).getMutableDelegatedVote(context);
		await delegatedVote.revokeDelegatedVote(_context.params, false);
	}

	public schema = revokeDelegatedVoteCommandSchema;
}
