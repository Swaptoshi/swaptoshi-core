/* eslint-disable camelcase */
/* eslint-disable jest/expect-expect */
import { StateMachine } from 'klayr-sdk';
import { CreatePoolCommand } from '../../../../../src/app/modules/dex/commands/create_pool_command';
import { DexModule } from '../../../../../src/app/modules/dex/module';
import { createPoolCommandSchema } from '../../../../../src/app/modules/dex/schema';
import { CreatePoolParams, MutableSwapContext, TokenMethod } from '../../../../../src/app/modules/dex/types';
import { invalidNumberString, invalidTokenAddress } from '../utils/invalid';
import { commandFixture } from '../utils/fixtures';
import { FeeAmount, encodePriceSqrt } from '../stores/shared/utilities';
import { poolAddress2, senderPublicKey, token0, token1, token2 } from '../utils/account';
import { eventResultHaveMinimumLength } from '../../../../utils/events';
import { NFTRegistry } from '../stores/shared/nft/nft_registry';
import { TokenRegistry } from '../stores/shared/token/token_registry';
import { PoolCreatedEvent } from '../../../../../src/app/modules/dex/events/pool_created';
import { PoolStore } from '../../../../../src/app/modules/dex/stores/pool';
import { commandSwapContext } from '../../../../../src/app/modules/dex/stores/context';
import { mock_token_initializeUserAccount, mock_token_lock, mock_token_transfer } from '../stores/shared/token';
import { DEFAULT_TREASURY_ADDRESS, POSITION_MANAGER_ADDRESS, ROUTER_ADDRESS, defaultConfig } from '../../../../../src/app/modules/dex/constants';
import { PositionManagerStore } from '../../../../../src/app/modules/dex/stores/position_manager';
import { TokenSymbolStore } from '../../../../../src/app/modules/dex/stores/token_symbol';

type CommandParam = CreatePoolParams;
const COMMAND_NAME = 'createPool';
const commandSchema = createPoolCommandSchema;

const validParam: CommandParam = {
	tokenA: token1,
	tokenASymbol: 'TKNA',
	tokenADecimal: 8,
	tokenB: token2,
	tokenBSymbol: 'TKNB',
	tokenBDecimal: 8,
	fee: FeeAmount.MEDIUM,
	sqrtPriceX96: encodePriceSqrt(1, 1).toString(),
};

describe('CreatePoolCommand', () => {
	let module: DexModule;
	let command: CreatePoolCommand;
	let swapContext: MutableSwapContext;
	let poolStore: PoolStore;
	let positionManagerStore: PositionManagerStore;
	let tokenSymbolStore: TokenSymbolStore;
	let tokenMethod: TokenMethod;
	let createCommandVerifyContext: (params: CommandParam) => StateMachine.CommandVerifyContext<CommandParam>;
	let createCommandExecuteContext: (params: CommandParam) => StateMachine.CommandExecuteContext<CommandParam>;

	beforeEach(async () => {
		({ module, createCommandExecuteContext, createCommandVerifyContext, poolStore, tokenMethod, positionManagerStore, tokenSymbolStore } = await commandFixture<CommandParam>(
			COMMAND_NAME,
			commandSchema,
			senderPublicKey,
			validParam,
		));
		command = new CreatePoolCommand(module.stores, module.events);
	});

	afterEach(() => {
		NFTRegistry.reset();
		TokenRegistry.reset();
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe(COMMAND_NAME);
		});

		it('should have valid schema', () => {
			expect(command.schema).toMatchSnapshot();
		});
	});

	describe('verify', () => {
		it('should return status OK when called with valid input', async () => {
			const context = createCommandVerifyContext(validParam);
			await expect(command.verify(context)).resolves.toHaveProperty('status', StateMachine.VerifyStatus.OK);
		});

		it('should throw error when user sends transaction with invalid token address (tokenA)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				tokenA: invalidTokenAddress,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', StateMachine.VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid token address (tokenB)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				tokenB: invalidTokenAddress,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', StateMachine.VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (fee)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				fee: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', StateMachine.VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (sqrtPriceX96)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				sqrtPriceX96: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', StateMachine.VerifyStatus.FAIL);
		});
	});

	describe('execute', () => {
		it('should create pool', async () => {
			const context = createCommandExecuteContext(validParam);
			swapContext = commandSwapContext(context);
			await command.execute(context);

			const pool = await poolStore.getMutablePool(swapContext, token1, token2, FeeAmount.MEDIUM);
			expect(pool.address).toStrictEqual(poolAddress2);
		});

		it('should create position manager', async () => {
			const context = createCommandExecuteContext(validParam);
			swapContext = commandSwapContext(context);
			await command.execute(context);

			const positionManager = await positionManagerStore.getMutablePositionManager(swapContext, poolAddress2);
			expect(positionManager.poolAddress).toStrictEqual(poolAddress2);
		});

		it('should register token symbol and decimals', async () => {
			const context = createCommandExecuteContext(validParam);
			swapContext = commandSwapContext(context);
			await command.execute(context);

			const token1Symbol = await tokenSymbolStore.has(context, tokenSymbolStore.getKey(token1));
			const token2Symbol = await tokenSymbolStore.has(context, tokenSymbolStore.getKey(token2));
			expect(token1Symbol).toBe(true);
			expect(token2Symbol).toBe(true);
		});

		it('should throw an error if created with unsupported tickSpacing', async () => {
			const func = async () => {
				const context = createCommandExecuteContext({
					...validParam,
					fee: '25',
				});
				await command.execute(context);
			};
			await expect(func()).rejects.toThrow('tickSpacing unsupported');
		});

		it('should throw an error if pool already exists', async () => {
			const func = async () => {
				const context = createCommandExecuteContext({
					...validParam,
					tokenA: token0,
					tokenB: token1,
					fee: FeeAmount.MEDIUM,
				});
				await command.execute(context);
			};
			await expect(func()).rejects.toThrow('pool already exists');
		});

		it('should initialize neccessary account', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(poolAddress2, token1);

			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(poolAddress2, token2);

			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(POSITION_MANAGER_ADDRESS, token1);

			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(POSITION_MANAGER_ADDRESS, token2);

			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(ROUTER_ADDRESS, token1);

			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(ROUTER_ADDRESS, token2);
		});

		it('should initialize treasury account if avaialble in config', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(DEFAULT_TREASURY_ADDRESS, token1);

			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(DEFAULT_TREASURY_ADDRESS, token2);
		});

		it('should transfer leftover balance to treasury', async () => {
			const context = createCommandExecuteContext(validParam);

			await tokenMethod.mint(context, poolAddress2, token1, BigInt(10));
			await tokenMethod.mint(context, poolAddress2, token2, BigInt(10));

			await command.execute(context);

			expect(mock_token_transfer).toHaveBeenCalledWith(poolAddress2, DEFAULT_TREASURY_ADDRESS, token1, BigInt(10));

			expect(mock_token_transfer).toHaveBeenCalledWith(poolAddress2, DEFAULT_TREASURY_ADDRESS, token2, BigInt(10));
		});

		it('should lock leftover balance if treasury is not configured', async () => {
			module._config.default = {
				...defaultConfig,
				feeProtocolPool: '',
			};
			poolStore.init(module._config);

			const context = createCommandExecuteContext(validParam);

			await tokenMethod.mint(context, poolAddress2, token1, BigInt(10));
			await tokenMethod.mint(context, poolAddress2, token2, BigInt(10));

			await command.execute(context);

			expect(mock_token_lock).toHaveBeenCalledWith(poolAddress2, module.name, token1, BigInt(10));

			expect(mock_token_lock).toHaveBeenCalledWith(poolAddress2, module.name, token2, BigInt(10));
		});

		it('should add command events', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			eventResultHaveMinimumLength(context.eventQueue, PoolCreatedEvent, module.name, 1);
		});
	});
});
