/* eslint-disable */
import { Modules, StateMachine } from 'klayr-sdk';
import { SetProposalAttributesParams } from '../types';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { ProposalStore } from '../stores/proposal';
import { setProposalAttributesCommandSchema } from '../schema';

export class SetProposalAttributesCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<SetProposalAttributesParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const proposalStore = await this.stores.get(ProposalStore).getImmutableProposal(context, _context.params.proposalId);
			await proposalStore.verifySetAttributes(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<SetProposalAttributesParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const proposalStore = await this.stores.get(ProposalStore).getMutableProposal(context, _context.params.proposalId);
		await proposalStore.setAttributes(_context.params, false);
	}

	public schema = setProposalAttributesCommandSchema;
}
