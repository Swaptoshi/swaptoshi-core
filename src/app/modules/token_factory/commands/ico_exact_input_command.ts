/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { ICOExactInputParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';
import { icoExactInputCommandSchema } from '../schema';

export class IcoExactInputCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<ICOExactInputParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const ico = await this.stores.get(ICOStore).getImmutableICORouter(context);
			await ico.verifyExactInput(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<ICOExactInputParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const ico = await this.stores.get(ICOStore).getMutableICORouter(context);
		await ico.exactInput(_context.params, false);
	}

	public schema = icoExactInputCommandSchema;
}
