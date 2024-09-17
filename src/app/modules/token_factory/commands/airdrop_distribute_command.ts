/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { airdropDistributeCommandSchema } from '../schema';
import { AirdropDistributeParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { AirdropStore } from '../stores/airdrop';

export class AirdropDistributeCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<AirdropDistributeParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const airdrop = await this.stores.get(AirdropStore).getImmutableAirdrop(context, _context.params.tokenId, _context.transaction.senderAddress);
			await airdrop.verifyDistribute(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<AirdropDistributeParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const airdrop = await this.stores.get(AirdropStore).getMutableAirdrop(context, _context.params.tokenId, _context.transaction.senderAddress);
		await airdrop.distribute(_context.params, false);
	}

	public schema = airdropDistributeCommandSchema;
}
