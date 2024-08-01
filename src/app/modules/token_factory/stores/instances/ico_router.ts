/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { GenesisConfig, JSONObject, NamedRegistry, utils } from 'klayr-sdk';
import { ICOExactInputParams, ICOExactInputSingleParams, ICOExactOutputParams, ICOExactOutputSingleParams, ICOStoreData, ImmutableFactoryContext, MutableFactoryContext } from '../../types';
import { AddDependenciesParam, BaseInstance } from './base';
import { ICOStore } from '../ico';
import { serializer, verifyPositiveNumber, verifyToken } from '../../utils';
import { computeICOPoolAddress } from '../library';
import { IcoSwapEvent } from '../../events/ico_swap';
import { TOKEN_ID_LENGTH } from '../../constants';
import { ICOQuoter } from './ico_quoter';
import { TokenFactoryGovernableConfig } from '../../config';

export class ICORouter extends BaseInstance<ICOStoreData, ICOStore> implements ICOStoreData {
	public constructor(stores: NamedRegistry, events: NamedRegistry, config: TokenFactoryGovernableConfig, genesisConfig: GenesisConfig, moduleName: string) {
		super(ICOStore, stores, events, config, genesisConfig, moduleName, Buffer.alloc(0));
		this.quoter = new ICOQuoter(stores, events, config, genesisConfig, moduleName);
	}

	public addImmutableDependencies(param: AddDependenciesParam<ImmutableFactoryContext>): void {
		super.addImmutableDependencies(param);
		this.quoter.addImmutableDependencies(param);
	}

	public addMutableDependencies(param: AddDependenciesParam<MutableFactoryContext>): void {
		super.addMutableDependencies(param);
		this.quoter.addMutableDependencies(param);
	}

	public toJSON() {
		return utils.objects.cloneDeep(
			serializer<ICOStoreData>({
				price: this.price,
				providerAddress: this.providerAddress,
			}),
		) as JSONObject<ICOStoreData>;
	}

	public toObject() {
		return utils.objects.cloneDeep({
			price: this.price,
			providerAddress: this.providerAddress,
		} as ICOStoreData) as ICOStoreData;
	}

	public async verifyExactInput(params: ICOExactInputParams) {
		this._checkImmutableDependencies();

		const config = await this.getConfig(this.immutableContext!.context);

		if (!config.icoDexPathEnabled || !this.dexMethod) {
			throw new Error('exactInput is disabled, since config.icoDexPathEnabled is false or dexMethod dependencies is not configured');
		}

		verifyToken('tokenOut', params.tokenOut);
		verifyPositiveNumber('amountIn', params.amountIn);

		await this._checkICOPathExists(params.path, params.tokenOut, true);
	}

	public async exactInput(params: ICOExactInputParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyExactInput(params);

		const swapRouter = await this.dexMethod!.getRouter(this.mutableContext!.context, this.mutableContext!.senderAddress, Number(this.mutableContext!.timestamp));

		let icoAmountIn = params.amountIn.toString();

		if (params.path.length > TOKEN_ID_LENGTH) {
			icoAmountIn = await swapRouter.exactInput({
				amountIn: params.amountIn.toString(),
				amountOutMinimum: params.pathAmountOutMinimum.toString(),
				deadline: params.deadline.toString(),
				path: params.path,
				recipient: this.mutableContext!.senderAddress,
			});
		}

		const tokenIn = params.path.subarray(params.path.length - TOKEN_ID_LENGTH, params.path.length);
		await this._updateInstance(tokenIn, params.tokenOut);

		const icoAmountOut = await this.quoter.quoteExactInputSingle({
			amountIn: BigInt(icoAmountIn),
			tokenIn,
			tokenOut: params.tokenOut,
		});

		await this._icoSwapInternal(params.recipient, BigInt(icoAmountIn), icoAmountOut, tokenIn, params.tokenOut);
	}

	public async verifyExactInputSingle(params: ICOExactInputSingleParams) {
		this._checkImmutableDependencies();
		verifyToken('tokenIn', params.tokenIn);
		verifyToken('tokenOut', params.tokenOut);
		verifyPositiveNumber('amountIn', params.amountIn);

		await this._checkICOExists(computeICOPoolAddress(params));
	}

	public async exactInputSingle(params: ICOExactInputSingleParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyExactInputSingle(params);

		await this._updateInstance(params.tokenIn, params.tokenOut);

		const amountOut = await this.quoter.quoteExactInputSingle({
			amountIn: params.amountIn,
			tokenIn: params.tokenIn,
			tokenOut: params.tokenOut,
		});
		await this._icoSwapInternal(params.recipient, params.amountIn, amountOut, params.tokenIn, params.tokenOut);
	}

	public async verifyExactOutput(params: ICOExactOutputParams) {
		this._checkImmutableDependencies();

		const config = await this.getConfig(this.immutableContext!.context);

		if (!config.icoDexPathEnabled || !this.dexMethod) {
			throw new Error('exactOutput is disabled, since config.icoDexPathEnabled is false or dexMethod dependencies is not configured');
		}

		verifyToken('tokenOut', params.tokenOut);
		verifyPositiveNumber('amountOut', params.amountOut);

		await this._checkICOPathExists(params.path, params.tokenOut, false);
	}

	public async exactOutput(params: ICOExactOutputParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyExactOutput(params);

		const swapRouter = await this.dexMethod!.getRouter(this.mutableContext!.context, this.mutableContext!.senderAddress, Number(this.mutableContext!.timestamp));

		const tokenIn = params.path.subarray(0, TOKEN_ID_LENGTH);
		await this._updateInstance(tokenIn, params.tokenOut);

		const swapAmountOut = await this.quoter.quoteExactOutputSingle({
			amountOut: params.amountOut,
			tokenIn,
			tokenOut: params.tokenOut,
		});

		if (params.path.length > TOKEN_ID_LENGTH) {
			await swapRouter.exactOutput({
				amountOut: swapAmountOut.toString(),
				amountInMaximum: params.pathAmountInMaximum.toString(),
				deadline: params.deadline.toString(),
				path: params.path,
				recipient: this.mutableContext!.senderAddress,
			});
		}

		await this._icoSwapInternal(params.recipient, swapAmountOut, params.amountOut, tokenIn, params.tokenOut);
	}

	public async verifyExactOuputSingle(params: ICOExactOutputSingleParams) {
		this._checkImmutableDependencies();
		verifyToken('tokenIn', params.tokenIn);
		verifyToken('tokenOut', params.tokenOut);
		verifyPositiveNumber('amountOut', params.amountOut);

		await this._checkICOExists(computeICOPoolAddress(params));
	}

	public async exactOutputSingle(params: ICOExactOutputSingleParams, verify = true) {
		this._checkMutableDependencies();

		if (verify) await this.verifyExactOuputSingle(params);

		await this._updateInstance(params.tokenIn, params.tokenOut);

		const amountIn = await this.quoter.quoteExactOutputSingle({
			amountOut: params.amountOut,
			tokenIn: params.tokenIn,
			tokenOut: params.tokenOut,
		});
		await this._icoSwapInternal(params.recipient, amountIn, params.amountOut, params.tokenIn, params.tokenOut);
	}

	private async _updateInstance(tokenIn: Buffer, tokenOut: Buffer) {
		const poolAddress = computeICOPoolAddress({ tokenIn, tokenOut });
		const icoData = await this.instanceStore.getOrDefault(this.mutableContext!.context, poolAddress);
		this._setKey(poolAddress);
		Object.assign(this, utils.objects.cloneDeep(icoData));
	}

	private async _icoSwapInternal(recipient: Buffer, amountIn: bigint, amountOut: bigint, tokenIn: Buffer, tokenOut: Buffer) {
		await this.tokenMethod!.transfer(this.mutableContext!.context, this.mutableContext!.senderAddress, this.key, tokenIn, amountIn);

		await this.tokenMethod!.transfer(this.mutableContext!.context, this.key, this.providerAddress, tokenIn, amountIn);

		await this.tokenMethod!.transfer(this.mutableContext!.context, this.key, recipient, tokenOut, amountOut);

		const events = this.events.get(IcoSwapEvent);
		events.add(
			this.mutableContext!.context,
			{
				amountIn,
				amountOut,
				poolAddress: this.key,
			},
			[this.key, this.providerAddress, recipient],
		);
	}

	private async _checkICOExists(poolAddress: Buffer) {
		if (!(await this.instanceStore.has(this.immutableContext!.context, poolAddress))) {
			throw new Error('ICO pool doesnt exists');
		}
	}

	private async _checkICOPathExists(path: Buffer, tokenOut: Buffer, exactIn: boolean) {
		let pathTokenOut: Buffer;

		if (path.length < TOKEN_ID_LENGTH) {
			throw new Error(`minimum path length is ${TOKEN_ID_LENGTH} bytes`);
		}

		if (exactIn) {
			pathTokenOut = path.subarray(path.length - TOKEN_ID_LENGTH, path.length);
		} else {
			pathTokenOut = path.subarray(0, TOKEN_ID_LENGTH);
		}

		if (!(await this.instanceStore.has(this.immutableContext!.context, computeICOPoolAddress({ tokenIn: pathTokenOut, tokenOut })))) {
			throw new Error('params.path leads to non existent ICO pool');
		}
	}

	public price: string = '0';
	public providerAddress: Buffer = Buffer.alloc(0);

	private readonly quoter: ICOQuoter;
}
