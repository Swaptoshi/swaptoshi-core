/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
} from 'klayr-sdk';
import { mintCommandSchema } from '../schema/commands/mint_command';
import { PositionManagerStore } from '../stores/position_manager';
import { commandSwapContext } from '../stores/context';
import { PoolAddress } from '../stores/library/periphery';
import { MintParams } from '../types';
import { verifyMintParam } from '../utils/verify';

export class MintCommand extends BaseCommand {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(_context: CommandVerifyContext<MintParams>): Promise<VerificationResult> {
		try {
			verifyMintParam(_context.params);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<MintParams>): Promise<void> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const context = commandSwapContext(_context);
		const positionManager = await positionManagerStore.getMutablePositionManager(
			context,
			PoolAddress.computeAddress(
				PoolAddress.getPoolKey(_context.params.token0, _context.params.token1, _context.params.fee),
			),
		);
		await positionManager.mint(_context.params);
	}

	public schema = mintCommandSchema;
}
