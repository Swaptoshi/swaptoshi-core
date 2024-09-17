/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { exactOutputSingleCommandSchema } from '../schema';
import { PoolStore } from '../stores/pool';
import { commandSwapContext } from '../stores/context';
import { ExactOutputSingleParams } from '../types';
import { verifyExactOutputSingleParam } from '../utils';

export class ExactOutputSingleCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<ExactOutputSingleParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyExactOutputSingleParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<ExactOutputSingleParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const router = await poolStore.getMutableRouter(context);
		await router.exactOutputSingle(_context.params);
	}

	public schema = exactOutputSingleCommandSchema;
}
