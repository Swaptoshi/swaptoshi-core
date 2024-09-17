/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { factoryTransferOwnershipCommandSchema } from '../schema';
import { FactoryTransferOwnershipParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';

export class FactoryTransferOwnershipCommand extends Modules.BaseCommand {
	public async verify(_context: StateMachine.CommandVerifyContext<FactoryTransferOwnershipParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores.get(FactoryStore).getImmutableFactory(context, _context.params.tokenId);
			await factory.verifyTransferOwnership(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<FactoryTransferOwnershipParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores.get(FactoryStore).getMutableFactory(context, _context.params.tokenId);
		await factory.transferOwnership(_context.params, false);
	}

	public schema = factoryTransferOwnershipCommandSchema;
}
