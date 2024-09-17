/* eslint-disable */
import { Modules, StateMachine, cryptography } from 'klayr-sdk';
import { collectTreasuryCommandSchema } from '../schema';
import { CollectParams, CollectTreasuryParams } from '../types';
import { verifyCollectTreasuryParam } from '../utils';
import { commandSwapContext } from '../stores/context';
import { PositionManagerStore } from '../stores/position_manager';
import { DexGovernableConfig } from '../config';
import { Uint128 } from '../stores/library/int';

export class CollectTreasuryCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<CollectTreasuryParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyCollectTreasuryParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<CollectTreasuryParams>): Promise<void> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const configStore = this.stores.get(DexGovernableConfig);
		const config = await configStore.getConfig(_context);

		if (config.feeProtocolPool) {
			const treasuryAddress = cryptography.address.getAddressFromKlayr32Address(config.feeProtocolPool);
			const params: CollectParams = {
				..._context.params,
				recipient: treasuryAddress,
				amount1Max: Uint128.MAX,
				amount0Max: Uint128.MAX,
			};

			const context = commandSwapContext(_context);
			context.senderAddress = treasuryAddress;

			const positionManager = await positionManagerStore.getMutablePositionManager(context, _context.params.poolAddress);
			await positionManager.collect(params);
		}
	}

	public schema = collectTreasuryCommandSchema;
}
