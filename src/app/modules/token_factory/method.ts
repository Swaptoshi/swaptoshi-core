/* eslint-disable import/no-cycle */
import {
	BaseMethod,
	FeeMethod,
	ImmutableMethodContext,
	MethodContext,
	NamedRegistry,
	TokenMethod,
	Transaction,
	codec,
} from 'lisk-sdk';
import { ICOPool } from './stores/instances/ico_pool';
import { Airdrop } from './stores/instances/airdrop';
import { Factory } from './stores/instances/factory';
import {
	AirdropCreateParams,
	ICOExactInputParams,
	ICOExactInputSingleParams,
	ICOExactOutputParams,
	ICOExactOutputSingleParams,
	NextAvailableTokenIdStoreData,
	StoreInstance,
	TokenCreateParams,
	TokenFactoryModuleConfig,
} from './types';
import { VestingUnlock } from './stores/instances/vesting_unlock';
import { ICOStore } from './stores/ico';
import { immutableMethodFactoryContext, methodFactoryContext } from './stores/context';
import { AirdropStore } from './stores/airdrop';
import { FactoryStore } from './stores/factory';
import { VestingUnlockStore } from './stores/vesting_unlock';
import { NextAvailableTokenIdStore } from './stores/next_available_token_id';
import { ICORouter } from './stores/instances/ico_router';
import { ICOQuoter } from './stores/instances/ico_quoter';
import { DexMethod } from '../dex/method';
import { isSwapByTransfer } from './hooks';
import {
	icoExactInputCommandSchema,
	icoExactInputSingleCommandSchema,
	icoExactOutputCommandSchema,
	icoExactOutputSingleCommandSchema,
} from './schema';
import { TOKEN_ID_LENGTH } from './constants';

const FEE_CONVERSION_SUPPORTED_COMMANDS = [
	'icoExactInput',
	'icoExactInputSingle',
	'icoExactOutput',
	'icoExactOutputSingle',
];

export class TokenFactoryMethod extends BaseMethod {
	public constructor(stores: NamedRegistry, events: NamedRegistry, name: string) {
		super(stores, events);
		this.moduleName = name;
	}

	public init(config: TokenFactoryModuleConfig) {
		this.config = config;
	}

	public addDependencies(tokenMethod: TokenMethod, feeMethod: FeeMethod, dexMethod: DexMethod) {
		this.tokenMethod = tokenMethod;
		this.feeMethod = feeMethod;
		this.dexMethod = dexMethod;
	}

	public async createICOPool(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		tokenIn: Buffer,
		tokenOut: Buffer,
		price: string,
		providerAddress: Buffer,
		amount: bigint,
	) {
		const icoStore = this.stores.get(ICOStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		const ico = await icoStore.getMutableEmptyICOPool(_context);
		await ico.create({
			tokenIn,
			tokenOut,
			providerAddress,
			price,
			amount,
		});
	}

	public async createAirdrop(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		tokenId: Buffer,
		providerAddress: Buffer,
		recipients: AirdropCreateParams['recipients'],
	) {
		const airdropStore = this.stores.get(AirdropStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		const airdrop = await airdropStore.getMutableEmptyAirdrop(_context);
		await airdrop.create({
			tokenId,
			providerAddress,
			recipients,
		});
	}

	public async createTokenFactory(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		distribution: TokenCreateParams['distribution'],
	) {
		const factoryStore = this.stores.get(FactoryStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		const factory = await factoryStore.getMutableEmptyFactory(_context);
		await factory.create({
			distribution,
		});
	}

	public async getICOPool(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		tokenIn: Buffer,
		tokenOut: Buffer,
	): Promise<StoreInstance<ICOPool>> {
		const icoStore = this.stores.get(ICOStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return icoStore.getMutableICOPool(_context, tokenIn, tokenOut);
	}

	public async getICORouter(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
	): Promise<StoreInstance<ICORouter>> {
		const icoStore = this.stores.get(ICOStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return icoStore.getMutableICORouter(_context);
	}

	public async getICOQuoter(
		context: ImmutableMethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
	): Promise<StoreInstance<ICOQuoter>> {
		const icoStore = this.stores.get(ICOStore);
		const _context = immutableMethodFactoryContext(context, senderAddress, timestamp, height);
		return icoStore.getImmutableICOQuoter(_context);
	}

	public async getAirdrop(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		tokenId: Buffer,
		providerAddress: Buffer,
	): Promise<StoreInstance<Airdrop>> {
		const airdropStore = this.stores.get(AirdropStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return airdropStore.getMutableAirdrop(_context, tokenId, providerAddress);
	}

	public async getFactory(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
		tokenId: Buffer,
	): Promise<StoreInstance<Factory>> {
		const factoryStore = this.stores.get(FactoryStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return factoryStore.getMutableFactory(_context, tokenId);
	}

	public async getVestingUnlock(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		height: number,
	): Promise<StoreInstance<VestingUnlock>> {
		const vestingUnlockStore = this.stores.get(VestingUnlockStore);
		const _context = methodFactoryContext(context, senderAddress, timestamp, height);
		return vestingUnlockStore.getInstance(_context);
	}

	public async getNextAvailableTokenId(
		context: MethodContext,
	): Promise<NextAvailableTokenIdStoreData> {
		const nextAvailableTokenIdStore = this.stores.get(NextAvailableTokenIdStore);
		return nextAvailableTokenIdStore.getOrDefault(context);
	}

	public async isFeeConversion(
		context: ImmutableMethodContext,
		transaction: Transaction,
		timestamp: number,
		height: number,
	) {
		if (!this.config || !this.tokenMethod || !this.feeMethod || !this.dexMethod) {
			throw new Error('tokenFactory methods dependencies not configured');
		}

		const swapTransferCheck = await isSwapByTransfer.bind({
			stores: this.stores,
			events: this.events,
		})(context, transaction);
		if (swapTransferCheck.status && swapTransferCheck.payload) {
			const tokenOut = this.feeMethod.getFeeTokenID();
			const sender = transaction.senderAddress;
			const senderFeeBalance = await this.tokenMethod.getAvailableBalance(
				context,
				sender,
				tokenOut,
			);
			const feeDifference = senderFeeBalance - transaction.fee;

			if (feeDifference < BigInt(0)) {
				let availableFee: string | undefined;
				const amount = (feeDifference * BigInt(-1)).toString();

				const dexQuoter = await this.dexMethod.getQuoter(
					context,
					transaction.senderAddress,
					timestamp,
				);

				const dexConfig = await this.dexMethod.getConfig();

				for (const feeTickSpaingMap of dexConfig.feeAmountTickSpacing) {
					const [fee] = feeTickSpaingMap;
					if (
						await this.dexMethod.poolExists(
							context,
							swapTransferCheck.payload.tokenID,
							tokenOut,
							fee,
						)
					) {
						availableFee = fee;
						break;
					}
				}

				if (availableFee !== undefined) {
					const { amountIn } = await dexQuoter.quoteExactOutputSingle({
						tokenIn: swapTransferCheck.payload.tokenID.toString('hex'),
						tokenOut: tokenOut.toString('hex'),
						amount,
						fee: availableFee,
						sqrtPriceLimitX96: '0',
					});
					return {
						status: true,
						payload: {
							tokenIn: swapTransferCheck.payload.tokenID,
							tokenOut,
							fee: availableFee,
							swapAmount: swapTransferCheck.payload.amount,
							amountIn,
							amountOut: amount,
						},
					};
				}
			}
		}

		if (
			this.config.icoFeeConversionEnabled &&
			transaction.module === this.moduleName &&
			FEE_CONVERSION_SUPPORTED_COMMANDS.includes(transaction.command)
		) {
			const tokenOut = this.feeMethod.getFeeTokenID();
			const sender = transaction.senderAddress;
			const senderFeeBalance = await this.tokenMethod.getAvailableBalance(
				context,
				sender,
				tokenOut,
			);
			const feeDifference = senderFeeBalance - transaction.fee;

			const ctx = immutableMethodFactoryContext(
				context,
				transaction.senderAddress,
				timestamp,
				height,
			);
			const quoter = await this.stores.get(ICOStore).getImmutableICOQuoter(ctx);

			if (feeDifference < BigInt(0)) {
				let tokenIn = Buffer.alloc(0);
				let swapAmount = BigInt(0);
				let params:
					| ICOExactInputParams
					| ICOExactOutputParams
					| ICOExactInputSingleParams
					| ICOExactOutputSingleParams;
				switch (transaction.command) {
					case 'icoExactInput':
						params = codec.decode<ICOExactInputParams>(
							icoExactInputCommandSchema,
							transaction.params,
						);
						tokenIn = params.path.subarray(0, TOKEN_ID_LENGTH);
						swapAmount = params.amountIn;
						break;
					case 'icoExactOutput':
						params = codec.decode<ICOExactOutputParams>(
							icoExactOutputCommandSchema,
							transaction.params,
						);
						tokenIn = params.path.subarray(
							params.path.length - TOKEN_ID_LENGTH,
							params.path.length,
						);
						swapAmount = await quoter.quoteExactOutput(params);
						break;
					case 'icoExactInputSingle':
						params = codec.decode<ICOExactInputSingleParams>(
							icoExactInputSingleCommandSchema,
							transaction.params,
						);
						tokenIn = params.tokenIn;
						swapAmount = params.amountIn;
						break;
					case 'icoExactOutputSingle':
						params = codec.decode<ICOExactOutputSingleParams>(
							icoExactOutputSingleCommandSchema,
							transaction.params,
						);
						tokenIn = params.tokenIn;
						swapAmount = await quoter.quoteExactOutputSingle(params);
						break;
					default:
						break;
				}

				const dexConfig = await this.dexMethod.getConfig();

				for (const feeTickSpaingMap of dexConfig.feeAmountTickSpacing) {
					const [fee] = feeTickSpaingMap;

					if (await this.dexMethod.poolExists(context, tokenIn, tokenOut, fee)) {
						const amount = (feeDifference * BigInt(-1)).toString();

						const dexQuoter = await this.dexMethod.getQuoter(
							context,
							transaction.senderAddress,
							timestamp,
						);
						const { amountIn } = await dexQuoter.quoteExactOutputSingle({
							tokenIn: tokenIn.toString('hex'),
							tokenOut: tokenOut.toString('hex'),
							amount: amount.toString(),
							fee,
							sqrtPriceLimitX96: '0',
						});
						return {
							status: true,
							payload: {
								tokenIn,
								tokenOut,
								fee,
								swapAmount,
								amountIn,
								amountOut: amount,
							},
						};
					}
				}
			}
		}
		return {
			status: false,
			payload: undefined,
		};
	}

	private readonly moduleName: string;

	private config: TokenFactoryModuleConfig | undefined;
	private tokenMethod: TokenMethod | undefined;
	private feeMethod: FeeMethod | undefined;
	private dexMethod: DexMethod | undefined;
}
