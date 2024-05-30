/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'klayr-sdk';
import { icoExactOutputSingleCommandSchema } from '../schema';
import { ICOExactOutputSingleParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';

export class IcoExactOutputSingleCommand extends BaseCommand {
	public async verify(
		_context: CommandVerifyContext<ICOExactOutputSingleParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const ico = await this.stores.get(ICOStore).getImmutableICORouter(context);
			await ico.verifyExactOuputSingle(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ICOExactOutputSingleParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const ico = await this.stores.get(ICOStore).getMutableICORouter(context);
		await ico.exactOutputSingle(_context.params, false);
	}

	public schema = icoExactOutputSingleCommandSchema;
}
