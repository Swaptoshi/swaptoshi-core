/* eslint-disable */
import { Modules, StateMachine } from 'klayr-sdk';
import { factorySetAttributesCommandSchema } from '../schema';
import { FactorySetAttributesParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';

export class FactorySetAttributesCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<FactorySetAttributesParams>): Promise<StateMachine.VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores.get(FactoryStore).getImmutableFactory(context, _context.params.tokenId);
			await factory.verifySetAttributes(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<FactorySetAttributesParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores.get(FactoryStore).getMutableFactory(context, _context.params.tokenId);
		await factory.setAttributes(_context.params, false);
	}

	public schema = factorySetAttributesCommandSchema;
}
