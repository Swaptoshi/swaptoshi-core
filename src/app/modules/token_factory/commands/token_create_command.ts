/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'klayr-sdk';
import { tokenCreateCommandSchema } from '../schema';
import { TokenCreateParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';

export class TokenCreateCommand extends BaseCommand {
	public async verify(
		_context: CommandVerifyContext<TokenCreateParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores.get(FactoryStore).getImmutableEmptyFactory(context);
			await factory.verifyCreate(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<TokenCreateParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores.get(FactoryStore).getMutableEmptyFactory(context);
		await factory.create(_context.params, false);
	}

	public schema = tokenCreateCommandSchema;
}
