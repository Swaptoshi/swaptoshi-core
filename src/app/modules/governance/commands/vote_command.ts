/* eslint-disable */
import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { VoteParams } from '../types';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { ProposalStore } from '../stores/proposal';
import { voteCommandSchema } from '../schema';

export class VoteCommand extends BaseCommand {
	public async verify(_context: CommandVerifyContext<VoteParams>): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const proposalStore = await this.stores.get(ProposalStore).getImmutableProposal(context, _context.params.proposalId);
			await proposalStore.verifyVote(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<VoteParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const proposalStore = await this.stores.get(ProposalStore).getMutableProposal(context, _context.params.proposalId);
		await proposalStore.vote(_context.params, false);
	}

	public schema = voteCommandSchema;
}
