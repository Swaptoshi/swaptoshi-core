/* eslint-disable class-methods-use-this */

import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { PoolStore } from '../stores/pool';
import { commandSwapContext } from '../stores/context';
import { exactInputCommandSchema } from '../schema';
import { ExactInputParams } from '../types';
import { verifyExactInputParam } from '../utils';

export class ExactInputCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: CommandVerifyContext<ExactInputParams>): Promise<VerificationResult> {
		try {
			verifyExactInputParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ExactInputParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const router = poolStore.getMutableRouter(context);
		await router.exactInput(_context.params);
	}

	public schema = exactInputCommandSchema;
}
