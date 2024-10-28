/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-ordering */
import { Modules, StateMachine, Types, codec, validator } from 'klayr-sdk';
import { genesisStoreSchema } from 'klayr-framework/dist-node/modules/pos/schemas';
import { MethodContext } from 'klayr-framework/dist-node/state_machine';
import BigNumber from 'bignumber.js';
import { LiquidPosModuleConfig, PosModuleGenesisStakerSubstore, StakeTransactionParams, TokenMethod } from './types';
import { POS_MODULE_NAME, POS_STAKE_COMMAND_NAME } from './constants';
import { stakeCommandParamsSchema } from './schema';
import { LiquidStakingTokenMintEvent } from './events/lst_mint';
import { LiquidStakingTokenBurnEvent } from './events/lst_burn';
import { LiquidPosGovernableConfig } from './config';

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR });

export class InternalLiquidPosMethod extends Modules.BaseMethod {
	private _chainID: Buffer | undefined;
	private _tokenMethod: TokenMethod | undefined;
	private _lstTokenID: Buffer | undefined;
	private _config: LiquidPosGovernableConfig | undefined;

	public async init(moduleConfig: LiquidPosModuleConfig, genesisConfig: Types.GenesisConfig) {
		this._chainID = Buffer.from(genesisConfig.chainID, 'hex');
		await this._assignLstTokenID(moduleConfig);
	}

	public addDependencies(tokenMethod: TokenMethod) {
		this._tokenMethod = tokenMethod;
		this._config = this.stores.get(LiquidPosGovernableConfig);
	}

	public getLstTokenID() {
		return this._lstTokenID;
	}

	public async handleInitGenesisState(context: StateMachine.GenesisBlockExecuteContext) {
		this.checkDependencies();

		const isTokenIDAvailable = await this._tokenMethod!.isTokenIDAvailable(context, this._lstTokenID!);

		if (!isTokenIDAvailable) {
			const assetBytes = context.assets.getAsset(POS_MODULE_NAME);
			if (!assetBytes) return;

			const genesisStore = codec.decode<{ stakers: PosModuleGenesisStakerSubstore[] }>(genesisStoreSchema, assetBytes);
			validator.validator.validate(genesisStoreSchema, genesisStore);

			const totalPosStaked = genesisStore.stakers.reduce(
				(accumulator: bigint, stakerSubstore: PosModuleGenesisStakerSubstore) =>
					accumulator + stakerSubstore.stakes.reduce((stakerAccumulator: bigint, stakes: PosModuleGenesisStakerSubstore['stakes'][0]) => stakerAccumulator + stakes.amount, BigInt(0)),
				BigInt(0),
			);

			const totalSupply = await this._tokenMethod!.getTotalSupply(context as unknown as MethodContext);
			const lstTotalSupply = totalSupply.totalSupply.find(t => t.tokenID.equals(this._lstTokenID!))!.totalSupply;
			const computedLstTotalSupply = await this._multiplyByRatio(context as unknown as MethodContext, totalPosStaked);

			if (computedLstTotalSupply !== lstTotalSupply) throw new Error('lstTokenID supply doesnt match computed totalPosStaked');
		}
	}

	public async handleAfterCommandExecute(context: StateMachine.TransactionExecuteContext) {
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

	public async mint(context: StateMachine.MethodContext, address: Buffer, baseAmount: bigint) {
		this.checkDependencies();
		if (baseAmount < BigInt(0)) throw new Error("baseAmount minted can't be negative");

		const isTokenIDAvailable = await this._tokenMethod!.isTokenIDAvailable(context, this._lstTokenID!);
		if (isTokenIDAvailable) await this._tokenMethod!.initializeToken(context, this._lstTokenID!);

		const mintedAmount = await this._multiplyByRatio(context, baseAmount);

		await this._tokenMethod!.mint(context, address, this._lstTokenID!, mintedAmount);
		const events = this.events.get(LiquidStakingTokenMintEvent);
		events.add(context, { address, tokenID: this._lstTokenID!, amount: mintedAmount }, [address]);
	}

	public async burn(context: StateMachine.MethodContext, address: Buffer, baseBurned: bigint) {
		this.checkDependencies();
		if (baseBurned < BigInt(0)) throw new Error("baseBurned burned can't be negative");

		const isTokenIDAvailable = await this._tokenMethod!.isTokenIDAvailable(context, this._lstTokenID!);
		if (isTokenIDAvailable) await this._tokenMethod!.initializeToken(context, this._lstTokenID!);

		const burnedAmount = await this._multiplyByRatio(context, baseBurned);

		await this._tokenMethod!.burn(context, address, this._lstTokenID!, burnedAmount);
		const events = this.events.get(LiquidStakingTokenBurnEvent);
		events.add(context, { address, tokenID: this._lstTokenID!, amount: burnedAmount }, [address]);
	}

	public checkDependencies() {
		if (!this._chainID || !this._tokenMethod || !this._lstTokenID || !this._config) {
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

	private async _multiplyByRatio(context: StateMachine.MethodContext, amount: bigint): Promise<bigint> {
		this.checkDependencies();

		const config = await this._config!.getConfig(context);
		return BigInt(new BigNumber(amount.toString()).multipliedBy(config.ratio).toFixed(0));
	}
}
