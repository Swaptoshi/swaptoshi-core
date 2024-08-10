/* eslint-disable */
import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { BoostVoteParams } from '../types';
import { immutableTransactionHookGovernanceContext, mutableTransactionHookGovernanceContext } from '../stores/context';
import { BoostedAccountStore } from '../stores/boosted_account';
import { boostVoteCommandSchema } from '../schema';

export class BoostVoteCommand extends BaseCommand {
	public async verify(_context: CommandVerifyContext<BoostVoteParams>): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookGovernanceContext(_context);
			const boostedAccount = await this.stores.get(BoostedAccountStore).getImmutableBoostedAccount(context);
			await boostedAccount.verifyBoostVote(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<BoostVoteParams>): Promise<void> {
		const context = mutableTransactionHookGovernanceContext(_context);
		const boostedAccount = await this.stores.get(BoostedAccountStore).getMutableBoostedAccount(context);
		await boostedAccount.boostVote(_context.params, false);
	}

	public schema = boostVoteCommandSchema;
}
