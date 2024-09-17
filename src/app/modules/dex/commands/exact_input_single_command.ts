/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { PoolStore } from '../stores/pool';
import { commandSwapContext } from '../stores/context';
import { exactInputSingleCommandSchema } from '../schema';
import { ExactInputSingleParams } from '../types';
import { verifyExactInputSingleParam } from '../utils';

export class ExactInputSingleCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<ExactInputSingleParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyExactInputSingleParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<ExactInputSingleParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const router = await poolStore.getMutableRouter(context);
		await router.exactInputSingle(_context.params);
	}

	public schema = exactInputSingleCommandSchema;
}
