/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'klayr-sdk';
import { factoryTransferOwnershipCommandSchema } from '../schema';
import { FactoryTransferOwnershipParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';

export class FactoryTransferOwnershipCommand extends BaseCommand {
	public async verify(
		_context: CommandVerifyContext<FactoryTransferOwnershipParams>,
	): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores
				.get(FactoryStore)
				.getImmutableFactory(context, _context.params.tokenId);
			await factory.verifyTransferOwnership(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(
		_context: CommandExecuteContext<FactoryTransferOwnershipParams>,
	): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores
			.get(FactoryStore)
			.getMutableFactory(context, _context.params.tokenId);
		await factory.transferOwnership(_context.params, false);
	}

	public schema = factoryTransferOwnershipCommandSchema;
}
