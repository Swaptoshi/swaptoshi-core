/* eslint-disable */
import { Modules, StateMachine } from 'klayr-sdk';
import { BoostVoteParams } from '../types';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { BoostedAccountStore } from '../stores/boosted_account';
import { boostVoteCommandSchema } from '../schema';

export class BoostVoteCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<BoostVoteParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const boostedAccount = await this.stores.get(BoostedAccountStore).getImmutableBoostedAccount(context);
			await boostedAccount.verifyBoostVote(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<BoostVoteParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const boostedAccount = await this.stores.get(BoostedAccountStore).getMutableBoostedAccount(context);
		await boostedAccount.boostVote(_context.params, false);
	}

	public schema = boostVoteCommandSchema;
}
