/* eslint-disable */
import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { SetProposalAttributesParams } from '../types';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { ProposalStore } from '../stores/proposal';
import { setProposalAttributesCommandSchema } from '../schema';

export class SetProposalAttributesCommand extends BaseCommand {
	public async verify(_context: CommandVerifyContext<SetProposalAttributesParams>): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const proposalStore = await this.stores.get(ProposalStore).getImmutableProposal(context, _context.params.proposalId);
			await proposalStore.verifySetAttributes(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<SetProposalAttributesParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const proposalStore = await this.stores.get(ProposalStore).getMutableProposal(context, _context.params.proposalId);
		await proposalStore.setAttributes(_context.params, false);
	}

	public schema = setProposalAttributesCommandSchema;
}
