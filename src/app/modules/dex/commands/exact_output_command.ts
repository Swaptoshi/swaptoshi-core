/* eslint-disable class-methods-use-this */

import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { exactOutputCommandSchema } from '../schema';
import { PoolStore } from '../stores/pool';
import { commandSwapContext } from '../stores/context';
import { ExactOutputParams } from '../types';
import { verifyExactOutputParam } from '../utils';

export class ExactOutputCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: CommandVerifyContext<ExactOutputParams>): Promise<VerificationResult> {
		try {
			verifyExactOutputParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ExactOutputParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const router = poolStore.getMutableRouter(context);
		await router.exactOutput(_context.params);
	}

	public schema = exactOutputCommandSchema;
}
