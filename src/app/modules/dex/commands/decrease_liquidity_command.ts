/* eslint-disable class-methods-use-this */

import { Modules, StateMachine } from 'klayr-sdk';
import { PositionManagerStore } from '../stores/position_manager';
import { commandSwapContext } from '../stores/context';
import { decreaseLiquidityCommandSchema } from '../schema';
import { DecreaseLiquidityParams } from '../types';
import { verifyDecreaseLiquidityParam } from '../utils';

export class DecreaseLiquidityCommand extends Modules.BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: StateMachine.CommandVerifyContext<DecreaseLiquidityParams>): Promise<StateMachine.VerificationResult> {
		try {
			verifyDecreaseLiquidityParam(_context.params);
		} catch (error: unknown) {
			return {
				status: StateMachine.VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: StateMachine.VerifyStatus.OK };
	}

	public async execute(_context: StateMachine.CommandExecuteContext<DecreaseLiquidityParams>): Promise<void> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const context = commandSwapContext(_context);
		const positionManager = await positionManagerStore.getMutablePositionManager(context, _context.params.poolAddress);
		await positionManager.decreaseLiquidity(_context.params);
	}

	public schema = decreaseLiquidityCommandSchema;
}
