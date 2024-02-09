/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable import/no-cycle */
/* eslint-disable no-constant-condition */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NamedRegistry, TokenMethod, cryptography, utils } from 'lisk-sdk';
import {
	Uint24String,
	Uint256String,
	Uint160String,
	Uint256,
	Int256String,
	Int256,
	Uint160,
	Uint8,
} from '../library/int';
import { PoolStore } from '../pool';
import {
	MutableSwapContext,
	ExactInputParams,
	ExactInputSingleParams,
	ExactOutputParams,
	ExactOutputSingleParams,
	DexModuleConfig,
} from '../../types';
import { DEXPool } from './pool';
import { ROUTER_ADDRESS } from '../../constants';

import * as TickMath from '../library/core/tick_math';
import * as Path from '../library/periphery/path';

interface SwapCallbackData {
	path: string;
	payer: string;
}

export class SwapRouter {
	public constructor(stores: NamedRegistry, config: DexModuleConfig, moduleName: string) {
		this.moduleName = moduleName;
		this._amountInCached = this._DEFAULT_AMOUNT_IN_CACHED;
		this.poolStore = stores.get(PoolStore);
		this.setConfig(config);
	}

	public addDependencies(context: MutableSwapContext, tokenMethod: TokenMethod) {
		if (this.mutableDependencyReady) {
			throw new Error('this instance dependencies already been configured');
		}
		this.mutableContext = context;
		this.tokenMethod = tokenMethod;
		this.mutableDependencyReady = true;
	}

	public setSender(senderAddress: Buffer) {
		if (this.mutableContext) {
			this.mutableContext.senderAddress = senderAddress;
		}
	}

	public setConfig(config: DexModuleConfig) {
		this.feeProtocol = config.feeProtocol ?? 0;

		this.feeProtocolPool = config.feeProtocolPool
			? cryptography.address.getAddressFromLisk32Address(
					config.feeProtocolPool,
					config.feeProtocolPool.substring(0, 3),
			  )
			: undefined;

		this._validateFeeProtocol();
	}

	public async exactInputSingle(params: ExactInputSingleParams): Promise<Uint256String> {
		this._checkDependencies();
		this._checkDeadline(params.deadline);
		const amountOut = Uint256.from(
			await this._exactInputInternal(
				params.amountIn,
				params.recipient,
				params.sqrtPriceLimitX96,
				this._createPayload(
					params.tokenIn,
					params.tokenOut,
					params.fee,
					this.mutableContext!.senderAddress,
				),
			),
		);

		if (amountOut.lt(params.amountOutMinimum)) throw new Error('Too little received');
		await this._checkRemainingBalance(
			Buffer.from(
				this._createPayload(
					params.tokenIn,
					params.tokenOut,
					params.fee,
					this.mutableContext!.senderAddress,
				).path,
				'hex',
			),
		);

		return amountOut.toString();
	}

	public async exactInput(_params: ExactInputParams): Promise<Uint256String> {
		this._checkDependencies();
		this._checkDeadline(_params.deadline);

		let payer = this.mutableContext!.senderAddress;
		const params = utils.objects.cloneDeep(_params) as ExactInputParams;
		let amountOut = Uint256.from(0);
		const tokenList = new Set<Buffer>();

		while (true) {
			const hasMultiplePools = Path.hasMultiplePools(params.path);
			params.amountIn = await this._exactInputInternal(
				params.amountIn,
				hasMultiplePools ? this.address : params.recipient,
				'0',
				{
					path: Path.getFirstPool(params.path).toString('hex'),
					payer: payer.toString('hex'),
				},
			);

			const [tokenIn, tokenOut] = Path.decodeFirstPool(params.path);
			tokenList.add(tokenIn);
			tokenList.add(tokenOut);

			if (hasMultiplePools) {
				payer = this.address;
				params.path = Path.skipToken(params.path);
			} else {
				amountOut = Uint256.from(params.amountIn);
				break;
			}
		}

		if (amountOut.lt(params.amountOutMinimum)) throw new Error('Too little received');
		await this._checkRemainingBalance(_params.path);
		return amountOut.toString();
	}

	public async exactOutputSingle(params: ExactOutputSingleParams): Promise<Uint256String> {
		this._checkDependencies();
		this._checkDeadline(params.deadline);

		const amountIn = await this._exactOutputInternal(
			params.amountOut,
			params.recipient,
			params.sqrtPriceLimitX96,
			this._createPayload(
				params.tokenOut,
				params.tokenIn,
				params.fee,
				this.mutableContext!.senderAddress,
			),
		);

		if (Uint256.from(amountIn).gt(params.amountInMaximum)) throw new Error('Too much requested');
		await this._checkRemainingBalance(
			Buffer.from(
				this._createPayload(
					params.tokenOut,
					params.tokenIn,
					params.fee,
					this.mutableContext!.senderAddress,
				).path,
				'hex',
			),
		);
		this._amountInCached = this._DEFAULT_AMOUNT_IN_CACHED;

		return amountIn;
	}

	public async exactOutput(params: ExactOutputParams): Promise<Uint256String> {
		this._checkDependencies();
		this._checkDeadline(params.deadline);

		await this._exactOutputInternal(params.amountOut, params.recipient, '0', {
			path: params.path.toString('hex'),
			payer: this.mutableContext!.senderAddress.toString('hex'),
		});

		const amountIn = this._amountInCached;
		if (Uint256.from(amountIn).gt(params.amountInMaximum)) throw new Error('Too much requested');
		await this._checkRemainingBalance(params.path);
		this._amountInCached = this._DEFAULT_AMOUNT_IN_CACHED;

		return amountIn;
	}

	private _checkDependencies() {
		if (!this.mutableDependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	private _checkDeadline(deadline: Uint256String) {
		if (Uint256.from(this.mutableContext!.timestamp).gt(deadline))
			throw new Error('Transaction too old');
	}

	private async _pay(token: Buffer, payer: Buffer, recipient: Buffer, value: Uint256String) {
		await this.tokenMethod!.transfer(
			this.mutableContext!.context,
			payer,
			recipient,
			token,
			BigInt(value),
		);
	}

	private _createPayload(
		tokenIn: Buffer,
		tokenOut: Buffer,
		fee: Uint24String,
		payer: Buffer,
	): SwapCallbackData {
		const feeBuff = Buffer.allocUnsafe(3);
		feeBuff.writeUIntBE(parseInt(fee, 10), 0, 3);
		return {
			path: Buffer.concat([tokenIn, feeBuff, tokenOut]).toString('hex'),
			payer: payer.toString('hex'),
		};
	}

	private async _getPool(tokenA: Buffer, tokenB: Buffer, fee: Uint24String): Promise<DEXPool> {
		return this.poolStore!.getMutablePool(this.mutableContext!, tokenA, tokenB, fee);
	}

	private async _swapCallback(
		amount0Delta: Int256String,
		amount1Delta: Int256String,
		_data: string,
	) {
		if (Int256.from(amount0Delta).lte(0) && Int256.from(amount1Delta).lte(0))
			throw new Error('invalid amount0Delta and/or amount1Delta');

		const data = JSON.parse(_data) as SwapCallbackData;
		const [tokenIn, tokenOut, fee] = Path.decodeFirstPool(Buffer.from(data.path, 'hex'));

		const [isExactInput, amountToPay] = Int256.from(amount0Delta).gt(0)
			? [tokenIn.compare(tokenOut) < 0, Uint256.from(0).add(amount0Delta)]
			: [tokenOut.compare(tokenIn) < 0, Uint256.from(0).add(amount1Delta)];

		const pool = await this._getPool(tokenIn, tokenOut, fee);

		if (isExactInput) {
			await this._pay(
				tokenIn,
				Buffer.from(data.payer, 'hex'),
				pool.address,
				amountToPay.toString(),
			);
		} else {
			// eslint-disable-next-line no-lonely-if
			if (Path.hasMultiplePools(Buffer.from(data.path, 'hex'))) {
				data.path = Path.skipToken(Buffer.from(data.path, 'hex')).toString('hex');
				await this._exactOutputInternal(amountToPay.toString(), pool.address, '0', data);
			} else {
				this._amountInCached = amountToPay.toString();
				await this._pay(
					tokenOut,
					Buffer.from(data.payer, 'hex'),
					pool.address,
					amountToPay.toString(),
				);
			}
		}
	}

	private async _exactInputInternal(
		amountIn: Uint256String,
		_recipient: Buffer,
		sqrtPriceLimitX96: Uint160String,
		data: SwapCallbackData,
	): Promise<Uint256String> {
		let recipient = _recipient;
		if (recipient.compare(Buffer.alloc(20)) === 0) recipient = this.address;

		const [tokenIn, tokenOut, fee] = Path.decodeFirstPool(Buffer.from(data.path, 'hex'));
		const zeroForOne = tokenIn.compare(tokenOut) < 0;

		const pool = await this._getPool(tokenIn, tokenOut, fee);
		const [amount0, amount1] = await pool.swap(
			recipient,
			zeroForOne,
			Int256.from(amountIn).toString(),
			sqrtPriceLimitX96 === '0'
				? zeroForOne
					? Uint160.from(TickMath.MIN_SQRT_RATIO).add(1).toString()
					: Uint160.from(TickMath.MAX_SQRT_RATIO).sub(1).toString()
				: sqrtPriceLimitX96,
			JSON.stringify(data),
			this._swapCallback.bind(this),
		);

		return Uint256.from(0)
			.sub(zeroForOne ? amount1 : amount0)
			.toString();
	}

	private async _exactOutputInternal(
		amountOut: Uint256String,
		_recipient: Buffer,
		sqrtPriceLimitX96: Uint160String,
		data: SwapCallbackData,
	): Promise<Uint256String> {
		let recipient = _recipient;
		if (recipient.compare(Buffer.alloc(20)) === 0) recipient = this.address;

		const [tokenOut, tokenIn, fee] = Path.decodeFirstPool(Buffer.from(data.path, 'hex'));
		const zeroForOne = tokenIn.compare(tokenOut) < 0;

		const pool = await this._getPool(tokenIn, tokenOut, fee);
		const [amount0Delta, amount1Delta] = await pool.swap(
			recipient,
			zeroForOne,
			Int256.from(0).sub(amountOut).toString(),
			sqrtPriceLimitX96 === '0'
				? zeroForOne
					? Uint160.from(TickMath.MIN_SQRT_RATIO).add(1).toString()
					: Uint160.from(TickMath.MAX_SQRT_RATIO).sub(1).toString()
				: sqrtPriceLimitX96,
			JSON.stringify(data),
			this._swapCallback.bind(this),
		);

		const [amountIn, amountOutReceived] = zeroForOne
			? [Uint256.from(amount0Delta).toString(), Uint256.from(0).sub(amount1Delta).toString()]
			: [Uint256.from(amount1Delta).toString(), Uint256.from(0).sub(amount0Delta).toString()];

		if (sqrtPriceLimitX96 === '0' && amountOutReceived !== amountOut)
			throw new Error('sqrtPriceLimitX96 and amountOut error');

		return amountIn;
	}

	private async _checkRemainingBalance(path: Buffer) {
		let _path = path;
		const tokenList = new Set<Buffer>();

		while (true) {
			const [tokenIn, tokenOut] = Path.decodeFirstPool(_path);
			tokenList.add(tokenIn);
			tokenList.add(tokenOut);

			if (Path.hasMultiplePools(_path)) {
				_path = Path.skipToken(_path);
			} else {
				break;
			}
		}

		for (const token of tokenList) {
			const balance = await this.tokenMethod!.getAvailableBalance(
				this.mutableContext!.context,
				this.address,
				token,
			);
			if (balance > BigInt(0)) {
				if (this._checkFeeProtocol()) {
					await this.tokenMethod!.transfer(
						this.mutableContext!.context,
						this.address,
						this.feeProtocolPool!,
						token,
						balance,
					);
				} else {
					await this.tokenMethod!.lock(
						this.mutableContext!.context,
						this.address,
						this.moduleName,
						token,
						balance,
					);
				}
			}
		}
	}

	private _checkFeeProtocol() {
		return this.feeProtocol > 0 && this.feeProtocolPool && this.feeProtocolPool.length === 20;
	}

	private _validateFeeProtocol() {
		if (this._checkFeeProtocol()) {
			const feeProtocol0 = Uint8.from(this.feeProtocol).mod(16);
			const feeProtocol1 = Uint8.from(this.feeProtocol).shr(4);
			if (
				!(
					Uint8.from(feeProtocol0).eq(0) ||
					(Uint8.from(feeProtocol0).gte(4) && Uint8.from(feeProtocol0).lte(10))
				) ||
				!(
					Uint8.from(feeProtocol1).eq(0) ||
					(Uint8.from(feeProtocol1).gte(4) && Uint8.from(feeProtocol1).lte(10))
				)
			) {
				throw new Error('setFeeeProtocol failed');
			}
		}
	}

	public readonly address = ROUTER_ADDRESS;

	private readonly _DEFAULT_AMOUNT_IN_CACHED = Uint256.MAX;
	private readonly poolStore: PoolStore | undefined;
	private readonly moduleName: string;

	private feeProtocol: number = 0;
	private feeProtocolPool: Buffer | undefined;

	private _amountInCached = '0';
	private mutableContext: MutableSwapContext | undefined;
	private tokenMethod: TokenMethod | undefined;

	private mutableDependencyReady = false;
}
