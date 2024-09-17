/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { ICOCreateParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';
import { icoCreateCommandSchema } from '../schema';

export class IcoCreateCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<ICOCreateParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const ico = await this.stores.get(ICOStore).getImmutableEmptyICOPool(context);
			await ico.verifyCreate(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<ICOCreateParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const ico = await this.stores.get(ICOStore).getMutableEmptyICOPool(context);
		await ico.create(_context.params, false);
	}

	public schema = icoCreateCommandSchema;
}
