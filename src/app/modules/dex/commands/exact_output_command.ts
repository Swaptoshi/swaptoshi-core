/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { exactOutputCommandSchema } from '../schema';
import { PoolStore } from '../stores/pool';
import { commandSwapContext } from '../stores/context';
import { ExactOutputParams } from '../types';
import { verifyExactOutputParam } from '../utils';

export class ExactOutputCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<ExactOutputParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyExactOutputParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<ExactOutputParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const router = await poolStore.getMutableRouter(context);
		await router.exactOutput(_context.params);
	}

	public schema = exactOutputCommandSchema;
}
