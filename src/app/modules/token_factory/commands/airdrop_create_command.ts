/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { airdropCreateCommandSchema } from '../schema';
import { AirdropCreateParams } from '../types';
import { AirdropStore } from '../stores/airdrop';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';

export class AirdropCreateCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<AirdropCreateParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const airdrop = await this.stores.get(AirdropStore).getImmutableEmptyAirdrop(context);
			await airdrop.verifyCreate(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<AirdropCreateParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const airdrop = await this.stores.get(AirdropStore).getMutableEmptyAirdrop(context);
		await airdrop.create(_context.params, false);
	}

	public schema = airdropCreateCommandSchema;
}
