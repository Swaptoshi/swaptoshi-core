/* eslint-disable class-methods-use-this */

import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { PoolStore } from '../stores/pool';
import { commandSwapContext } from '../stores/context';
import { exactInputSingleCommandSchema } from '../schema';
import { ExactInputSingleParams } from '../types';
import { verifyExactInputSingleParam } from '../utils';

export class ExactInputSingleCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: CommandVerifyContext<ExactInputSingleParams>): Promise<VerificationResult> {
		try {
			verifyExactInputSingleParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ExactInputSingleParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const router = poolStore.getMutableRouter(context);
		await router.exactInputSingle(_context.params);
	}

	public schema = exactInputSingleCommandSchema;
}
