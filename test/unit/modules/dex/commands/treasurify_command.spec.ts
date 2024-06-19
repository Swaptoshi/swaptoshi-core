/* eslint-disable camelcase */
/* eslint-disable jest/expect-expect */
import { CommandExecuteContext, CommandVerifyContext, TokenMethod, VerifyStatus } from 'klayr-sdk';
import { TreasurifyCommand } from '../../../../../src/app/modules/dex/commands/treasurify_command';
import { DexModule } from '../../../../../src/app/modules/dex/module';
import { treasurifyCommandSchema } from '../../../../../src/app/modules/dex/schema';
import { TreasurifyParams } from '../../../../../src/app/modules/dex/types';
import { invalidTokenAddress } from '../utils/invalid';
import { commandFixture } from '../utils/fixtures';
import { poolAddress, senderPublicKey, token2 } from '../utils/account';
import { eventResultHaveLength, eventResultHaveMinimumLength } from '../../../../utils/events';
import { NFTRegistry } from '../stores/shared/nft/nft_registry';
import { TokenRegistry } from '../stores/shared/token/token_registry';
import { mock_token_transfer, mock_token_unlock } from '../stores/shared/token';
import { DEFAULT_TREASURY_ADDRESS, ROUTER_ADDRESS, defaultConfig } from '../../../../../src/app/modules/dex/constants';
import { TreasurifyEvent } from '../../../../../src/app/modules/dex/events/treasurify';
import { PoolStore } from '../../../../../src/app/modules/dex/stores/pool';

type CommandParam = TreasurifyParams;
const COMMAND_NAME = 'treasurify';
const commandSchema = treasurifyCommandSchema;

const validParam: CommandParam = {
	address: poolAddress,
	token: token2,
};

describe('TreasurifyCommand', () => {
	let module: DexModule;
	let command: TreasurifyCommand;
	let tokenMethod: TokenMethod;
	let poolStore: PoolStore;
	let createCommandVerifyContext: (params: CommandParam) => CommandVerifyContext<CommandParam>;
	let createCommandExecuteContext: (params: CommandParam) => CommandExecuteContext<CommandParam>;

	beforeEach(async () => {
		({ module, createCommandExecuteContext, createCommandVerifyContext, tokenMethod, poolStore } = await commandFixture<CommandParam>(COMMAND_NAME, commandSchema, senderPublicKey, validParam));
		command = new TreasurifyCommand(module.stores, module.events);
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
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.OK);
		});

		it('should throw error when user sends transaction with invalid address (address)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				address: invalidTokenAddress,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid token address (token)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				token: invalidTokenAddress,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});
	});

	describe('execute', () => {
		it('should do nothing if treasury is not configured', async () => {
			poolStore.init({
				...defaultConfig,
				feeProtocolPool: '',
			});

			const context = createCommandExecuteContext(validParam);
			await tokenMethod.mint(context, poolAddress, token2, BigInt(10));

			await command.execute(context);

			expect(mock_token_transfer).not.toHaveBeenCalledWith(poolAddress, DEFAULT_TREASURY_ADDRESS, token2, BigInt(10));
		});

		it('should do nothing if pool doesnt have any leftover balance', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);
			eventResultHaveLength(context.eventQueue, TreasurifyEvent, module.name, 0);
		});

		it('should transfer leftover pool balance to treasury account', async () => {
			const context = createCommandExecuteContext(validParam);
			await tokenMethod.mint(context, poolAddress, token2, BigInt(10));

			await command.execute(context);

			expect(mock_token_transfer).toHaveBeenCalledWith(poolAddress, DEFAULT_TREASURY_ADDRESS, token2, BigInt(10));
		});

		it('should transfer leftover router balance to treasury account', async () => {
			const context = createCommandExecuteContext({
				...validParam,
				address: ROUTER_ADDRESS,
			});
			await tokenMethod.mint(context, ROUTER_ADDRESS, token2, BigInt(10));

			await command.execute(context);

			expect(mock_token_transfer).toHaveBeenCalledWith(ROUTER_ADDRESS, DEFAULT_TREASURY_ADDRESS, token2, BigInt(10));
		});

		it('should transfer locked leftover pool balance to treasury account', async () => {
			const context = createCommandExecuteContext(validParam);
			await tokenMethod.mint(context, poolAddress, token2, BigInt(10));
			await tokenMethod.lock(context, poolAddress, module.name, token2, BigInt(10));

			await command.execute(context);

			expect(mock_token_unlock).toHaveBeenCalledWith(poolAddress, module.name, token2, BigInt(10));

			expect(mock_token_transfer).toHaveBeenCalledWith(poolAddress, DEFAULT_TREASURY_ADDRESS, token2, BigInt(10));
		});

		it('should transfer locked leftover router balance to treasury account', async () => {
			const context = createCommandExecuteContext({
				...validParam,
				address: ROUTER_ADDRESS,
			});
			await tokenMethod.mint(context, ROUTER_ADDRESS, token2, BigInt(10));
			await tokenMethod.lock(context, ROUTER_ADDRESS, module.name, token2, BigInt(10));

			await command.execute(context);

			expect(mock_token_unlock).toHaveBeenCalledWith(ROUTER_ADDRESS, module.name, token2, BigInt(10));

			expect(mock_token_transfer).toHaveBeenCalledWith(ROUTER_ADDRESS, DEFAULT_TREASURY_ADDRESS, token2, BigInt(10));
		});

		it('should add command events', async () => {
			const context = createCommandExecuteContext(validParam);
			await tokenMethod.mint(context, poolAddress, token2, BigInt(10));
			await command.execute(context);
			eventResultHaveMinimumLength(context.eventQueue, TreasurifyEvent, module.name, 1);
		});
	});
});
