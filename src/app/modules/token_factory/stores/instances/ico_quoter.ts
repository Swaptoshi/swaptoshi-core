/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { GenesisConfig, NamedRegistry } from 'lisk-sdk';
import Decimal from 'decimal.js';
import { ICOStoreData, TokenFactoryModuleConfig } from '../../types';
import { BaseInstance } from './base';
import { ICOStore } from '../ico';
import { computeICOPoolAddress } from '../library';
import { TOKEN_ID_LENGTH } from '../../constants';

interface QuoteExactInputParams {
	path: Buffer;
	tokenOut: Buffer;
	amountIn: bigint;
}

interface QuoteExactInputSingleParams {
	tokenIn: Buffer;
	tokenOut: Buffer;
	amountIn: bigint;
}

interface QuoteExactOutputParams {
	path: Buffer;
	tokenOut: Buffer;
	amountOut: bigint;
}

interface QuoteExactOutputSingleParams {
	tokenIn: Buffer;
	tokenOut: Buffer;
	amountOut: bigint;
}

export class ICOQuoter extends BaseInstance<ICOStoreData, ICOStore> {
	public constructor(
		stores: NamedRegistry,
		events: NamedRegistry,
		genesisConfig: GenesisConfig,
		config: TokenFactoryModuleConfig,
		moduleName: string,
	) {
		super(ICOStore, stores, events, genesisConfig, config, moduleName, Buffer.alloc(0));
	}

	public async quoteExactInputSingle(params: QuoteExactInputSingleParams) {
		this._checkImmutableDependencies();

		const poolAddress = computeICOPoolAddress(params);
		await this._checkICOExists(poolAddress);

		const ico = await this.instanceStore.get(this.immutableContext!.context, poolAddress);

		return BigInt(new Decimal(Number(params.amountIn)).mul(ico.price).toFixed(0));
	}

	public async quoteExactOutputSingle(params: QuoteExactOutputSingleParams) {
		this._checkImmutableDependencies();

		const poolAddress = computeICOPoolAddress(params);
		await this._checkICOExists(poolAddress);

		const ico = await this.instanceStore.get(this.immutableContext!.context, poolAddress);

		return BigInt(new Decimal(Number(params.amountOut)).div(ico.price).toFixed(0));
	}

	public async quoteExactInput(params: QuoteExactInputParams) {
		this._checkImmutableDependencies();

		await this._checkICOPathExists(params.path, params.tokenOut, true);

		const quoter = await this.dexMethod!.getQuoter(
			this.immutableContext!.context,
			this.immutableContext!.senderAddress,
			Number(this.immutableContext!.timestamp),
		);

		const quoteResult = await quoter.quoteExactInput(params.path, params.amountIn.toString());

		const icoAmountOut = this.quoteExactInputSingle({
			amountIn: BigInt(quoteResult.amountOut),
			tokenIn: params.path.subarray(params.path.length - TOKEN_ID_LENGTH, params.path.length),
			tokenOut: params.tokenOut,
		});

		return icoAmountOut;
	}

	public async quoteExactOutput(params: QuoteExactOutputParams) {
		this._checkImmutableDependencies();

		await this._checkICOPathExists(params.path, params.tokenOut, true);

		const quoter = await this.dexMethod!.getQuoter(
			this.immutableContext!.context,
			this.immutableContext!.senderAddress,
			Number(this.immutableContext!.timestamp),
		);

		const swapAmountOut = this.quoteExactOutputSingle({
			amountOut: BigInt(params.amountOut),
			tokenIn: params.path.subarray(params.path.length - TOKEN_ID_LENGTH, params.path.length),
			tokenOut: params.tokenOut,
		});

		const quoteResult = await quoter.quoteExactOutput(params.path, swapAmountOut.toString());

		return BigInt(quoteResult.amountIn);
	}

	private async _checkICOExists(poolAddress: Buffer) {
		if (!(await this.instanceStore.has(this.immutableContext!.context, poolAddress))) {
			throw new Error('ICO pool doesnt exists');
		}
	}

	private async _checkICOPathExists(path: Buffer, tokenOut: Buffer, exactIn: boolean) {
		let pathTokenOut: Buffer;

		if (exactIn) {
			pathTokenOut = path.subarray(path.length - TOKEN_ID_LENGTH, path.length);
		} else {
			pathTokenOut = path.subarray(0, TOKEN_ID_LENGTH);
		}

		if (
			!(await this.instanceStore.has(
				this.immutableContext!.context,
				computeICOPoolAddress({ tokenIn: pathTokenOut, tokenOut }),
			))
		) {
			throw new Error('params.path leads to non existent ICO pool');
		}
	}
}
