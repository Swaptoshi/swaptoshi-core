/* eslint-disable */
import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { CreateProposalParams } from '../types';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { ProposalStore } from '../stores/proposal';
import { createProposalCommandSchema } from '../schema';

export class CreateProposalCommand extends BaseCommand {
	public async verify(_context: CommandVerifyContext<CreateProposalParams>): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			await this.stores.get(ProposalStore).verifyCreateProposal(context, _context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<CreateProposalParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		await this.stores.get(ProposalStore).createProposal(context, _context.params, false);
	}

	public schema = createProposalCommandSchema;
}