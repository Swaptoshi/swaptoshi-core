/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { tokenCreateCommandSchema } from '../schema';
import { TokenCreateParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';

export class TokenCreateCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<TokenCreateParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores.get(FactoryStore).getImmutableEmptyFactory(context);
			await factory.verifyCreate(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<TokenCreateParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores.get(FactoryStore).getMutableEmptyFactory(context);
		await factory.create(_context.params, false);
	}

	public schema = tokenCreateCommandSchema;
}
