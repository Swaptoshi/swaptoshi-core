/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { icoExactOutputSingleCommandSchema } from '../schema';
import { ICOExactOutputSingleParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';

export class IcoExactOutputSingleCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<ICOExactOutputSingleParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const ico = await this.stores.get(ICOStore).getImmutableICORouter(context);
			await ico.verifyExactOuputSingle(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<ICOExactOutputSingleParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const ico = await this.stores.get(ICOStore).getMutableICORouter(context);
		await ico.exactOutputSingle(_context.params, false);
	}

	public schema = icoExactOutputSingleCommandSchema;
}
