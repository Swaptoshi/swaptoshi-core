/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable jest/expect-expect */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
	BaseModule,
	FeeMethod,
	MainchainInteroperabilityMethod,
	SidechainInteroperabilityMethod,
	TokenMethod,
	Transaction,
	TransactionExecuteContext,
	TransactionVerifyContext,
	TransferCommand,
	VerifyStatus,
	codec,
} from 'klayr-sdk';
import { DexModule } from '../../../../src/app/modules/dex/module';
import { DexEndpoint } from '../../../../src/app/modules/dex/endpoint';
import { DexMethod } from '../../../../src/app/modules/dex/method';
import { PoolStore } from '../../../../src/app/modules/dex/stores/pool';
import { PositionManagerStore } from '../../../../src/app/modules/dex/stores/position_manager';
import { moduleInitArgs } from './utils/config';
import { defaultConfig } from '../../../../src/app/modules/dex/constants';
import { hookContextFixture, tokenID } from './stores/shared/module';
import { poolAddress, senderPublicKey, senderAddress, token0, token1 } from './utils/account';
import { mutableHookSwapContext } from '../../../../src/app/modules/dex/stores/context';
import { FeeAmount, TICK_SPACINGS, encodePriceSqrt, getMaxTick, getMinTick } from './stores/shared/utilities';
import { PoolAddress } from '../../../../src/app/modules/dex/stores/library/periphery';
import { NATIVE_TOKEN_ID } from './stores/shared/pool';
import { TokenRegistry } from './stores/shared/token/token_registry';
import { Token } from './stores/shared/token/token';
import { eventResultContain, eventResultHaveLength } from '../../../utils/events';
import { SwapEvent } from '../../../../src/app/modules/dex/events/swap';
import { mock_token_transfer } from './stores/shared/token';
import { SupportedTokenStore } from '../../../../src/app/modules/dex/stores/supported_token';
import { TokenSymbolStore } from '../../../../src/app/modules/dex/stores/token_symbol';
import { fallbackTokenSymbol } from './utils/token';
import { TokenFactoryMethod } from '../../../../src/app/modules/token_factory/method';
import { NFTMethod } from '../../../../src/app/modules/nft';
import { FeeConversionMethod } from '../../../../src/app/modules/fee_conversion';

const baseTransaction = {
	module: '',
	command: '',
	senderPublicKey,
	nonce: BigInt(0),
	fee: BigInt(1000000000),
	signatures: [senderPublicKey],
	params: Buffer.alloc(0),
};

describe('DexModule', () => {
	let module: DexModule;
	let mockPoolStore;
	let mockPositionManagerStore;
	let mockSupportedTokenStore;
	let mockTokenSymbolStore;

	let poolStore: PoolStore;
	let positionManagerStore: PositionManagerStore;
	let tokenMethod: TokenMethod;
	let nftMethod: NFTMethod;
	let feeMethod: FeeMethod;
	let feeConversionMethod: FeeConversionMethod;
	let tokenFactoryMethod: TokenFactoryMethod;
	let interoperabilityMethod: SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;
	let verifyContext: TransactionVerifyContext;
	let executeContext: TransactionExecuteContext;
	let createTransactionExecuteContext: (transaction: Transaction) => TransactionExecuteContext;
	let createTransactionVerifyContext: (transcation: Transaction) => TransactionVerifyContext;

	beforeEach(async () => {
		const token0Ins = new Token();
		TokenRegistry.createToken(token0, token0Ins);
		const token1Ins = new Token();
		TokenRegistry.createToken(token1, token1Ins);
		const nativeTokenIns = new Token();
		TokenRegistry.createToken(NATIVE_TOKEN_ID, nativeTokenIns);

		({ module, createTransactionVerifyContext, createTransactionExecuteContext, poolStore, positionManagerStore, tokenMethod, nftMethod, feeMethod, feeConversionMethod, tokenFactoryMethod } =
			await hookContextFixture());
	});

	afterEach(() => {
		TokenRegistry.reset();
		jest.clearAllMocks();
	});

	const createPool = async (tokenA, tokenB) => {
		executeContext = createTransactionExecuteContext(new Transaction({ ...baseTransaction, module: module.name }));
		const context = mutableHookSwapContext(executeContext);

		const pool = await poolStore.createPool(context, tokenA, fallbackTokenSymbol(tokenA, 'TKNA'), 8, tokenB, fallbackTokenSymbol(tokenB, 'TKNB'), 8, FeeAmount.MEDIUM);
		await pool.initialize(encodePriceSqrt(1, 1).toString());
		return pool;
	};

	const mintNativeFee = async () => {
		await tokenMethod.mint(executeContext, senderAddress, tokenID, BigInt(1000000000));
	};

	const mintPosition = async (poolAddressToMint: Buffer, amountToMint: string) => {
		executeContext = createTransactionExecuteContext(new Transaction({ ...baseTransaction, module: module.name }));
		const context = mutableHookSwapContext(executeContext);
		const nft = await positionManagerStore.getMutablePositionManager(context, poolAddressToMint);

		const { token0: tokenA, token1: tokenB, fee: feePool } = PoolAddress.decodePoolAddress(poolAddressToMint);

		await tokenMethod.mint(executeContext, senderAddress, tokenA, BigInt(amountToMint));
		await tokenMethod.mint(executeContext, senderAddress, tokenB, BigInt(amountToMint));

		const liquidityParams = {
			token0: tokenA,
			token1: tokenB,
			fee: feePool,
			tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
			tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
			recipient: senderAddress,
			amount0Desired: amountToMint,
			amount1Desired: amountToMint,
			amount0Min: '0',
			amount1Min: '0',
			deadline: Date.now().toString(),
		};

		await nft.mint(liquidityParams);
		return nft;
	};

	it('should inherit from BaseModule', () => {
		expect(DexModule.prototype).toBeInstanceOf(BaseModule);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(module.name).toBeTruthy();
		});

		it('should expose endpoint', () => {
			expect(module).toHaveProperty('endpoint');
			expect(module.endpoint).toBeInstanceOf(DexEndpoint);
		});

		it('should expose Method', () => {
			expect(module).toHaveProperty('method');
			expect(module.method).toBeInstanceOf(DexMethod);
		});
	});

	describe('metadata', () => {
		it('should return module metadata', () => {
			const moduleMetadata = module.metadata();
			expect(typeof moduleMetadata).toBe('object');
			expect(Object.keys(moduleMetadata)).toEqual(['commands', 'events', 'stores', 'endpoints', 'assets']);
			expect(moduleMetadata.commands).toHaveLength(11);
			expect(moduleMetadata.endpoints).toHaveLength(12);
			expect(moduleMetadata.events).toHaveLength(16);
			expect(moduleMetadata.assets).toHaveLength(0);
			expect(moduleMetadata.stores).toHaveLength(8);
		});
	});

	describe('setup', () => {
		beforeEach(() => {
			mockPoolStore = {
				init: jest.fn(),
				addDependencies: jest.fn(),
			};
			mockPositionManagerStore = {
				init: jest.fn(),
				addDependencies: jest.fn(),
			};
			mockSupportedTokenStore = {
				init: jest.fn(),
				addDependencies: jest.fn(),
			};
			mockTokenSymbolStore = {
				init: jest.fn(),
				addDependencies: jest.fn(),
			};

			const mockStores = new Map();
			mockStores.set(PoolStore, mockPoolStore);
			mockStores.set(PositionManagerStore, mockPositionManagerStore);
			mockStores.set(SupportedTokenStore, mockSupportedTokenStore);
			mockStores.set(TokenSymbolStore, mockTokenSymbolStore);

			module.stores = mockStores as any;
		});

		describe('init', () => {
			it('should initialize poolStore', async () => {
				await module.init(moduleInitArgs as any);
				expect(mockPoolStore.init).toHaveBeenCalled();
			});

			it('should initialize positionManagerStore', async () => {
				await module.init(moduleInitArgs as any);
				expect(mockPositionManagerStore.init).toHaveBeenCalled();
			});
		});

		describe('addDependencies', () => {
			it('should add poolStore dependencies', () => {
				module.addDependencies(tokenMethod, nftMethod, feeMethod, feeConversionMethod, tokenFactoryMethod, interoperabilityMethod);
				expect(mockPoolStore.addDependencies).toHaveBeenCalledWith(tokenMethod);
			});

			it('should add positionManagerStore dependencies', () => {
				module.addDependencies(tokenMethod, nftMethod, feeMethod, feeConversionMethod, tokenFactoryMethod, interoperabilityMethod);
				expect(mockPositionManagerStore.addDependencies).toHaveBeenCalledWith(tokenMethod, nftMethod);
			});
		});
	});

	describe('verifyTransaction', () => {
		describe('verifyMinimumFee', () => {
			describe.each(['createPool', 'mint', 'burn', 'collect', 'increaseLiquidity', 'decreaseLiquidity', 'exactInput', 'exactInputSingle', 'exactOutput', 'exactOutputSingle', 'treasurify'])(
				'%s',
				command => {
					// eslint-disable-next-line prefer-const
					let transaction = {
						...baseTransaction,
						command,
					};

					beforeEach(async () => {
						await mintNativeFee();
						module._config = defaultConfig;
						transaction.module = module.name;
					});

					it('should pass if fee is higher than config', async () => {
						module._config = { ...defaultConfig, feeConversionEnabled: false };
						verifyContext = createTransactionVerifyContext(new Transaction(transaction));
						await expect((async () => module.verifyTransaction(verifyContext))()).resolves.toHaveProperty('status', VerifyStatus.OK);
					});

					it('should fail if fee is lower than config', async () => {
						module._config = {
							...defaultConfig,
							feeConversionEnabled: false,
							minTransactionFee: {
								...defaultConfig.minTransactionFee,
								[command]: '1000000001',
							},
						};
						verifyContext = createTransactionVerifyContext(new Transaction(transaction));

						const res = await module.verifyTransaction(verifyContext);
						expect(res.status).toBe(VerifyStatus.FAIL);
						expect(res.error).toBeDefined();
						expect(res.error?.message).toBe('Insufficient transaction fee. Minimum required fee is 1000000001.');
					});
				},
			);
		});

		describe('verifySwapByTransfer', () => {
			const transaction = {
				...baseTransaction,
				module: 'token',
				command: 'transfer',
				params: codec.encode(new TransferCommand(undefined as any, undefined as any).schema, {
					tokenID: token0,
					amount: BigInt(10),
					recipientAddress: poolAddress,
					data: '',
				}),
			};

			beforeEach(async () => {
				await mintNativeFee();
			});

			it('should pass if pool exist and token transferred is compatible with pool', async () => {
				await createPool(token0, token1);

				verifyContext = createTransactionVerifyContext(new Transaction(transaction));
				await expect((async () => module.verifyTransaction(verifyContext))()).resolves.toHaveProperty('status', VerifyStatus.OK);
			});

			it('should pass if pool doesnt exist, indicating normal transfer', async () => {
				verifyContext = createTransactionVerifyContext(new Transaction(transaction));
				await expect((async () => module.verifyTransaction(verifyContext))()).resolves.toHaveProperty('status', VerifyStatus.OK);
			});

			it('should fail if pool exist but token transferred is not compatible with pool', async () => {
				await createPool(token0, token1);

				verifyContext = createTransactionVerifyContext(
					new Transaction({
						...transaction,
						params: codec.encode(new TransferCommand(undefined as any, undefined as any).schema, {
							tokenID: Buffer.from('1234', 'utf8'),
							amount: BigInt(10),
							recipientAddress: poolAddress,
							data: '',
						}),
					}),
				);

				const res = await module.verifyTransaction(verifyContext);
				expect(res.status).toBe(VerifyStatus.FAIL);
				expect(res.error).toBeDefined();
				expect(res.error?.message).toBe('transfering incompatible token to pool address');
			});
		});
	});

	describe('beforeCommandExecute', () => {
		describe('verifyMinimumFee', () => {
			describe.each(['createPool', 'mint', 'burn', 'collect', 'increaseLiquidity', 'decreaseLiquidity', 'exactInput', 'exactInputSingle', 'exactOutput', 'exactOutputSingle', 'treasurify'])(
				'%s',
				command => {
					// eslint-disable-next-line prefer-const
					let transaction = {
						...baseTransaction,
						command,
					};

					beforeEach(async () => {
						module._config = defaultConfig;
						transaction.module = module.name;
						await mintNativeFee();
					});

					it('should pass if fee is higher than config', async () => {
						module._config = { ...defaultConfig, feeConversionEnabled: false };
						executeContext = createTransactionExecuteContext(new Transaction(transaction));
						await expect((async () => module.beforeCommandExecute(executeContext))()).resolves.not.toThrow();
					});

					it('should fail if fee is lower than config', async () => {
						module._config = {
							...defaultConfig,
							feeConversionEnabled: false,
							minTransactionFee: {
								...defaultConfig.minTransactionFee,
								[command]: '1000000001',
							},
						};
						executeContext = createTransactionExecuteContext(new Transaction(transaction));
						await expect((async () => module.beforeCommandExecute(executeContext))()).rejects.toThrow('Insufficient transaction fee. Minimum required fee is 1000000001.');
					});
				},
			);
		});

		describe('verifySwapByTransfer', () => {
			const transaction = {
				...baseTransaction,
				module: 'token',
				command: 'transfer',
				params: codec.encode(new TransferCommand(undefined as any, undefined as any).schema, {
					tokenID: token0,
					amount: BigInt(10),
					recipientAddress: poolAddress,
					data: '',
				}),
			};

			beforeEach(async () => {
				await mintNativeFee();
			});

			it('should pass if pool exist and token transferred is compatible with pool', async () => {
				await createPool(token0, token1);

				executeContext = createTransactionExecuteContext(new Transaction(transaction));
				await expect((async () => module.beforeCommandExecute(executeContext))()).resolves.not.toThrow();
			});

			it('should pass if pool doesnt exist, indicating normal transfer', async () => {
				executeContext = createTransactionExecuteContext(new Transaction(transaction));
				await expect((async () => module.beforeCommandExecute(executeContext))()).resolves.not.toThrow();
			});

			it('should fail if pool exist but token transferred is not compatible with pool', async () => {
				await createPool(token0, token1);

				executeContext = createTransactionExecuteContext(
					new Transaction({
						...transaction,
						params: codec.encode(new TransferCommand(undefined as any, undefined as any).schema, {
							tokenID: Buffer.from('1234', 'utf8'),
							amount: BigInt(10),
							recipientAddress: poolAddress,
							data: '',
						}),
					}),
				);
				await expect((async () => module.beforeCommandExecute(executeContext))()).rejects.toThrow('transfering incompatible token to pool address');
			});
		});
	});

	describe('afterCommandExecute', () => {
		describe('executeSwapByTransfer', () => {
			const transaction = {
				...baseTransaction,
				module: 'token',
				command: 'transfer',
				params: codec.encode(new TransferCommand(undefined as any, undefined as any).schema, {
					tokenID: token0,
					amount: BigInt(10),
					recipientAddress: poolAddress,
					data: '',
				}),
			};

			it('should execute a swap operation if pool exist and token transferred is compatible with pool', async () => {
				const pool = await createPool(token0, token1);
				await mintPosition(pool.address, '10000');

				executeContext = createTransactionExecuteContext(new Transaction(transaction));
				await module.afterCommandExecute(executeContext);
				eventResultHaveLength(executeContext.eventQueue, SwapEvent, module.name, 1);
				eventResultContain(executeContext.eventQueue, SwapEvent, module.name, {
					senderAddress: pool.address,
					recipientAddress: executeContext.transaction.senderAddress,
					amount0: '10',
					amount1: '-8',
					sqrtPriceX96Before: '79228162514264337593543950336',
					sqrtPriceX96: '79156921285107740626979668635',
					liquidityBefore: '10000',
					liquidity: '10000',
					tickBefore: '0',
					tick: '-18',
					feeGrowthGlobal0X128Before: '0',
					feeGrowthGlobal0X128: '34028236692093846346337460743176821',
					feeGrowthGlobal1X128Before: '0',
					feeGrowthGlobal1X128: '0',
				});

				expect(mock_token_transfer).toHaveBeenCalledWith(pool.address, executeContext.transaction.senderAddress, token1, BigInt(8));
			});

			it('should not execute a swap operation if pool doesnt exist, indicating normal transfer', async () => {
				executeContext = createTransactionExecuteContext(new Transaction(transaction));
				await module.afterCommandExecute(executeContext);
				eventResultHaveLength(executeContext.eventQueue, SwapEvent, module.name, 0);
			});

			it('should fail if pool exist but token transferred is not compatible with pool', async () => {
				await createPool(token0, token1);
				await mintPosition(poolAddress, '10000');

				executeContext = createTransactionExecuteContext(
					new Transaction({
						...transaction,
						params: codec.encode(new TransferCommand(undefined as any, undefined as any).schema, {
							tokenID: Buffer.from('1234', 'utf8'),
							amount: BigInt(10),
							recipientAddress: poolAddress,
							data: '',
						}),
					}),
				);

				await expect((async () => module.afterCommandExecute(executeContext))()).rejects.toThrow('transfering incompatible token to pool address');
			});
		});
	});
});
