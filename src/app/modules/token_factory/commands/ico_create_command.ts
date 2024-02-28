/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { ICOCreateParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';
import { icoCreateCommandSchema } from '../schema';

export class IcoCreateCommand extends BaseCommand {
	public async verify(
		_context: CommandVerifyContext<ICOCreateParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const ico = await this.stores.get(ICOStore).getImmutableEmptyICOPool(context);
			await ico.verifyCreate(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<ICOCreateParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const ico = await this.stores.get(ICOStore).getMutableEmptyICOPool(context);
		await ico.create(_context.params, false);
	}

	public schema = icoCreateCommandSchema;
}
