/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-ordering */
import { BaseMethod, GenesisConfig, MethodContext, TokenMethod, TransactionExecuteContext, codec } from 'klayr-sdk';
import { LiquidPosModuleConfig, StakeTransactionParams } from './types';
import { POS_MODULE_NAME, POS_STAKE_COMMAND_NAME } from './constants';
import { stakeCommandParamsSchema } from './schema';
import { LiquidStakingTokenMintEvent } from './events/lst_mint';
import { LiquidStakingTokenBurnEvent } from './events/lst_burn';

export class InternalLiquidPosMethod extends BaseMethod {
	private _chainID: Buffer | undefined;
	private _config: LiquidPosModuleConfig | undefined;
	private _tokenMethod: TokenMethod | undefined;
	private _lstTokenID: Buffer | undefined;

	public async init(genesisConfig: GenesisConfig, moduleConfig: LiquidPosModuleConfig) {
		this._config = moduleConfig;
		this._chainID = Buffer.from(genesisConfig.chainID, 'hex');
		await this._parseLstTokenID();
	}

	public addDependencies(tokenMethod: TokenMethod) {
		this._tokenMethod = tokenMethod;
	}

	public getLstTokenID() {
		return this._lstTokenID;
	}

	public async handleAfterCommandExecute(context: TransactionExecuteContext) {
		await this._checkDependencies();

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

	public async mint(context: MethodContext, address: Buffer, amount: bigint) {
		await this._checkDependencies();
		if (amount < BigInt(0)) throw new Error("amount minted can't be negative");

		await this._tokenMethod!.mint(context, address, this._lstTokenID!, amount);
		const events = this.events.get(LiquidStakingTokenMintEvent);
		events.add(context, { address, tokenID: this._lstTokenID!, amount }, [address]);
	}

	public async burn(context: MethodContext, address: Buffer, amount: bigint) {
		await this._checkDependencies();
		if (amount < BigInt(0)) throw new Error("amount burned can't be negative");

		await this._tokenMethod!.burn(context, address, this._lstTokenID!, amount);
		const events = this.events.get(LiquidStakingTokenBurnEvent);
		events.add(context, { address, tokenID: this._lstTokenID!, amount }, [address]);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _checkDependencies() {
		if (!this._chainID || !this._config || !this._tokenMethod || !this._lstTokenID) {
			throw new Error('InternalLiquidPosMethod dependencies is not configured');
		}
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _parseLstTokenID() {
		const { tokenID } = this._config!;
		const chainID = this._chainID!;

		if (typeof tokenID === 'number') {
			const buff = Buffer.allocUnsafe(4);
			buff.writeUIntBE(tokenID, 0, 4);
			this._lstTokenID = Buffer.concat([chainID, buff]);
		} else if (typeof tokenID === 'string') {
			if (tokenID.length === 16) {
				if (!tokenID.startsWith(chainID.toString('hex'))) throw new Error('invalid liquid_pos tokenID config chainID');
				this._lstTokenID = Buffer.from(tokenID, 'hex');
			} else if (tokenID.length === 8) {
				const buff = Buffer.from(tokenID, 'hex');
				this._lstTokenID = Buffer.concat([chainID, buff]);
			} else {
				throw new Error('invalid liquid_pos tokenID config string length');
			}
		} else {
			throw new Error('invalid liquid_pos tokenID config type');
		}
	}
}
