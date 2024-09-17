/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { TokenBurnParams } from '../types';
import { tokenBurnCommandSchema } from '../schema';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';

export class TokenBurnCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<TokenBurnParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores.get(FactoryStore).getImmutableFactory(context, _context.params.tokenId);
			await factory.verifyBurn(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<TokenBurnParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores.get(FactoryStore).getMutableFactory(context, _context.params.tokenId);
		await factory.burn(_context.params, false);
	}

	public schema = tokenBurnCommandSchema;
}
