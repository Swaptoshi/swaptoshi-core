/* eslint-disable */
import { BaseCommand, CommandVerifyContext, CommandExecuteContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { factorySetAttributesCommandSchema } from '../schema';
import { FactorySetAttributesParams } from '../types';
import { commandFactoryContext, immutableTransactionHookFactoryContext } from '../stores/context';
import { FactoryStore } from '../stores/factory';

export class FactorySetAttributesCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: CommandVerifyContext<FactorySetAttributesParams>): Promise<VerificationResult> {
		try {
			const context = immutableTransactionHookFactoryContext(_context);
			const factory = await this.stores.get(FactoryStore).getImmutableFactory(context, _context.params.tokenId);
			await factory.verifySetAttributes(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<FactorySetAttributesParams>): Promise<void> {
		const context = commandFactoryContext(_context);
		const factory = await this.stores.get(FactoryStore).getMutableFactory(context, _context.params.tokenId);
		await factory.setAttributes(_context.params, false);
	}

	public schema = factorySetAttributesCommandSchema;
}
