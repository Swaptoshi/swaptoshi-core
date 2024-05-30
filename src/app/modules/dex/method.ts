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
} from 'klayr-sdk';
import { PoolStore } from './stores/pool';
import { immutableMethodSwapContext, methodSwapContext } from './stores/context';
import { Uint24String } from './stores/library/int';
import { PositionManagerStore } from './stores/position_manager';
import { Quoter } from './stores/library/lens';
import { NonfungiblePositionManager, SwapRouter, DEXPool } from './stores/factory';
import {
	DexModuleConfig,
	ExactInputParams,
	ExactInputSingleParams,
	ExactOutputParams,
	ExactOutputSingleParams,
} from './types';
import { PoolAddress, Path } from './stores/library/periphery';
import { isSwapByTransfer } from './hooks';
import { exactInputCommandSchema } from './schema/commands/exact_input_command';
import { exactOutputCommandSchema } from './schema/commands/exact_output_command';
import { exactInputSingleCommandSchema } from './schema/commands/exact_input_single_command';
import { exactOutputSingleCommandSchema } from './schema/commands/exact_output_single_command';

const FEE_CONVERSION_SUPPORTED_COMMANDS = [
	'exactInput',
	'exactInputSingle',
	'exactOutput',
	'exactOutputSingle',
];

export class DexMethod extends BaseMethod {
	public constructor(stores: NamedRegistry, events: NamedRegistry, name: string) {
		super(stores, events);
		this.moduleName = name;
	}

	public init(config: DexModuleConfig) {
		this.config = config;
	}

	public addDependencies(tokenMethod: TokenMethod, feeMethod: FeeMethod) {
		this.tokenMethod = tokenMethod;
		this.feeMethod = feeMethod;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getConfig() {
		if (!this.config) throw new Error('config not initialized');
		return this.config;
	}

	public async createPool(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		tokenA: Buffer,
		tokenASymbol: string,
		tokenADecimal: number,
		tokenB: Buffer,
		tokenBSymbol: string,
		tokenBDecimal: number,
		fee: Uint24String,
	): Promise<DEXPool> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.createPool(
			_context,
			tokenA,
			tokenASymbol,
			tokenADecimal,
			tokenB,
			tokenBSymbol,
			tokenBDecimal,
			fee,
		);
	}

	public async getPool(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		tokenA: Buffer,
		tokenB: Buffer,
		fee: Uint24String,
	): Promise<DEXPool> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.getMutablePool(_context, tokenA, tokenB, fee);
	}

	public async poolExists(
		context: ImmutableMethodContext,
		tokenA: Buffer,
		tokenB: Buffer,
		fee: Uint24String,
	): Promise<boolean> {
		const poolStore = this.stores.get(PoolStore);
		const poolAddress = PoolAddress.computeAddress(PoolAddress.getPoolKey(tokenA, tokenB, fee));
		return poolStore.has(context, poolAddress);
	}

	public async getPositionManager(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		poolAddress: Buffer,
	): Promise<NonfungiblePositionManager> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return positionManagerStore.getMutablePositionManager(_context, poolAddress);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getRouter(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
	): Promise<SwapRouter> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.getMutableRouter(_context);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getQuoter(
		context: ImmutableMethodContext,
		senderAddress: Buffer,
		timestamp: number,
	): Promise<Quoter> {
		const _context = immutableMethodSwapContext(context, senderAddress, timestamp);
		return new Quoter(_context, this.stores);
	}

	public async isFeeConversion(
		context: ImmutableMethodContext,
		transaction: Transaction,
		timestamp: number,
	) {
		if (!this.config || !this.tokenMethod || !this.feeMethod) {
			throw new Error('dex methods dependencies not configured');
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
				const ctx = immutableMethodSwapContext(context, transaction.senderAddress, timestamp);
				const quoter = new Quoter(ctx, this.stores);

				const { fee } = PoolAddress.decodePoolAddress(swapTransferCheck.payload.recipientAddress);
				const amount = (feeDifference * BigInt(-1)).toString();
				const { amountIn } = await quoter.quoteExactOutputSingle({
					tokenIn: swapTransferCheck.payload.tokenID.toString('hex'),
					tokenOut: tokenOut.toString('hex'),
					amount,
					fee,
					sqrtPriceLimitX96: '0',
				});
				return {
					status: true,
					payload: {
						tokenIn: swapTransferCheck.payload.tokenID,
						tokenOut,
						fee,
						swapAmount: swapTransferCheck.payload.amount,
						amountIn,
						amountOut: amount,
					},
				};
			}
		}

		if (
			this.config.feeConversionEnabled &&
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

			const ctx = immutableMethodSwapContext(context, transaction.senderAddress, timestamp);
			const poolStore = this.stores.get(PoolStore);
			const quoter = new Quoter(ctx, this.stores);

			if (feeDifference < BigInt(0)) {
				let tokenIn = Buffer.alloc(0);
				let swapAmount = '0';
				let params:
					| ExactInputParams
					| ExactOutputParams
					| ExactInputSingleParams
					| ExactOutputSingleParams;
				switch (transaction.command) {
					case 'exactInput':
						params = codec.decode<ExactInputParams>(exactInputCommandSchema, transaction.params);
						[tokenIn] = Path.decodeFirstPool(Path.getFirstPool(params.path));
						swapAmount = params.amountIn;
						break;
					case 'exactOutput':
						params = codec.decode<ExactOutputParams>(exactOutputCommandSchema, transaction.params);
						[, tokenIn] = Path.decodeFirstPool(Path.getLastPool(params.path));
						({ amountIn: swapAmount } = await quoter.quoteExactOutput(
							params.path,
							params.amountOut,
						));
						break;
					case 'exactInputSingle':
						params = codec.decode<ExactInputSingleParams>(
							exactInputSingleCommandSchema,
							transaction.params,
						);
						tokenIn = params.tokenIn;
						swapAmount = params.amountIn;
						break;
					case 'exactOutputSingle':
						params = codec.decode<ExactOutputSingleParams>(
							exactOutputSingleCommandSchema,
							transaction.params,
						);
						tokenIn = params.tokenIn;
						({ amountIn: swapAmount } = await quoter.quoteExactOutputSingle({
							...params,
							tokenIn: params.tokenIn.toString('hex'),
							tokenOut: params.tokenOut.toString('hex'),
							amount: params.amountOut,
						}));
						break;
					default:
						break;
				}

				for (const feeTickSpaingMap of this.config.feeAmountTickSpacing) {
					const [fee] = feeTickSpaingMap;
					const poolAddress = PoolAddress.computeAddress(
						PoolAddress.getPoolKey(tokenIn, tokenOut, fee),
					);
					if (await poolStore.has(context, poolAddress)) {
						const amount = (feeDifference * BigInt(-1)).toString();
						const { amountIn } = await quoter.quoteExactOutputSingle({
							tokenIn: tokenIn.toString('hex'),
							tokenOut: tokenOut.toString('hex'),
							amount,
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

	private config: DexModuleConfig | undefined;
	private tokenMethod: TokenMethod | undefined;
	private feeMethod: FeeMethod | undefined;
}
