/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { exactOutputSingleCommandSchema } from '../schema/commands/exact_output_single_command';
import { PoolStore } from '../stores/pool';
import { commandSwapContext } from '../stores/context';
import { ExactOutputSingleParams } from '../types';
import { verifyExactOutputSingleParam } from '../utils/verify';

export class ExactOutputSingleCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<ExactOutputSingleParams>,
	): Promise<VerificationResult> {
		try {
			verifyExactOutputSingleParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ExactOutputSingleParams>): Promise<void> {
		const poolStore = this.stores.get(PoolStore);
		const context = commandSwapContext(_context);
		const router = poolStore.getMutableRouter(context);
		await router.exactOutputSingle(_context.params);
	}

	public schema = exactOutputSingleCommandSchema;
}
