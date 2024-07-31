/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-ordering */
import { BaseMethod, GenesisBlockExecuteContext, GenesisConfig, MethodContext, TokenMethod, TransactionExecuteContext, codec } from 'klayr-sdk';
import BigNumber from 'bignumber.js';
import { LiquidPosModuleConfig, StakeTransactionParams } from './types';
import { POS_MODULE_NAME, POS_STAKE_COMMAND_NAME } from './constants';
import { stakeCommandParamsSchema } from './schema';
import { LiquidStakingTokenMintEvent } from './events/lst_mint';
import { LiquidStakingTokenBurnEvent } from './events/lst_burn';
import { LiquidPosGovernableConfig } from './config';

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });

export class InternalLiquidPosMethod extends BaseMethod {
	private _chainID: Buffer | undefined;
	private _tokenMethod: TokenMethod | undefined;
	private _lstTokenID: Buffer | undefined;

	public async init(moduleConfig: LiquidPosModuleConfig, genesisConfig: GenesisConfig) {
		this._chainID = Buffer.from(genesisConfig.chainID, 'hex');
		await this._assignLstTokenID(moduleConfig);
	}

	public addDependencies(tokenMethod: TokenMethod) {
		this._tokenMethod = tokenMethod;
	}

	public getLstTokenID() {
		return this._lstTokenID;
	}

	public async handleInitGenesisState(context: GenesisBlockExecuteContext) {
		this.checkDependencies();

		const isTokenIDAvailable = await this._tokenMethod!.isTokenIDAvailable(context, this._lstTokenID!);
		if (!isTokenIDAvailable) throw new Error('specified tokenID on liquid_pos config is not available');
	}

	public async handleAfterCommandExecute(context: TransactionExecuteContext) {
		this.checkDependencies();

		if (context.transaction.module === POS_MODULE_NAME && context.transaction.command === POS_STAKE_COMMAND_NAME) {
			let totalStake = BigInt(0);
			const stakeParams = codec.decode<StakeTransactionParams>(stakeCommandParamsSchema, context.transaction.params);
			for (const stakes of stakeParams.stakes) totalStake += stakes.amount;

			if (totalStake > BigInt(0)) {
				await this.mint(context, context.transaction.senderAddress, totalStake);
			} else if (totalStake < BigInt(0)) {
				await this.burn(context, context.transaction.senderAddress, totalStake * BigInt(-1));
			}
		}
	}

	public async mint(context: MethodContext, address: Buffer, baseAmount: bigint) {
		this.checkDependencies();
		if (baseAmount < BigInt(0)) throw new Error("baseAmount minted can't be negative");

		const configStore = this.stores.get(LiquidPosGovernableConfig);
		const config = await configStore.getConfig(context);

		const isTokenIDAvailable = await this._tokenMethod!.isTokenIDAvailable(context, this._lstTokenID!);
		if (isTokenIDAvailable) await this._tokenMethod!.initializeToken(context, this._lstTokenID!);

		const mintedAmount = BigInt(new BigNumber(baseAmount.toString()).multipliedBy(config.ratio).toFixed(0));

		await this._tokenMethod!.mint(context, address, this._lstTokenID!, mintedAmount);
		const events = this.events.get(LiquidStakingTokenMintEvent);
		events.add(context, { address, tokenID: this._lstTokenID!, amount: mintedAmount }, [address]);
	}

	public async burn(context: MethodContext, address: Buffer, baseBurned: bigint) {
		this.checkDependencies();
		if (baseBurned < BigInt(0)) throw new Error("baseBurned burned can't be negative");

		const configStore = this.stores.get(LiquidPosGovernableConfig);
		const config = await configStore.getConfig(context);

		const isTokenIDAvailable = await this._tokenMethod!.isTokenIDAvailable(context, this._lstTokenID!);
		if (isTokenIDAvailable) await this._tokenMethod!.initializeToken(context, this._lstTokenID!);

		const burnedAmount = BigInt(new BigNumber(baseBurned.toString()).multipliedBy(config.ratio).toFixed(0));

		await this._tokenMethod!.burn(context, address, this._lstTokenID!, burnedAmount);
		const events = this.events.get(LiquidStakingTokenBurnEvent);
		events.add(context, { address, tokenID: this._lstTokenID!, amount: burnedAmount }, [address]);
	}

	public checkDependencies() {
		if (!this._chainID || !this._tokenMethod || !this._lstTokenID) {
			throw new Error('liquid_pos module dependencies is not configured, make sure LiquidPos.addDependencies() is called before module registration');
		}
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async _assignLstTokenID(config: LiquidPosModuleConfig) {
		const { tokenID } = config;
		const chainID = this._chainID!;

		if (tokenID.length === 16) {
			this._lstTokenID = Buffer.from(tokenID, 'hex');
		} else if (tokenID.length === 8) {
			const buff = Buffer.from(tokenID, 'hex');
			this._lstTokenID = Buffer.concat([chainID, buff]);
		}
	}
}
