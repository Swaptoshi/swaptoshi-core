/* eslint-disable camelcase */
/* eslint-disable jest/expect-expect */
import { CommandExecuteContext, CommandVerifyContext, VerifyStatus } from 'lisk-sdk';
import { DexModule } from '../../../../../src/app/modules/dex/module';
import { CollectParams } from '../../../../../src/app/modules/dex/types';
import { invalidAddress, invalidNumberString } from '../utils/invalid';
import { Tokens, commandFixture } from '../utils/fixtures';
import { NonfungiblePositionManager } from '../../../../../src/app/modules/dex/stores/factory';
import {
	FeeAmount,
	MaxUint128,
	TICK_SPACINGS,
	getMaxTick,
	getMinTick,
} from '../stores/shared/utilities';
import { poolAddress, senderAddress, senderPublicKey } from '../utils/account';
import { eventResultHaveMinimumLength } from '../../../../utils/events';
import { NFTRegistry } from '../stores/shared/nft/nft_registry';
import { TokenRegistry } from '../stores/shared/token/token_registry';
import { CollectCommand } from '../../../../../src/app/modules/dex/commands/collect_command';
import { mock_token_transfer } from '../stores/shared/token';
import { CollectPositionEvent } from '../../../../../src/app/modules/dex/events/collect_position';
import { collectCommandSchema } from '../../../../../src/app/modules/dex/schema/commands/collect_command';

type CommandParam = CollectParams;
const MODULE_NAME = 'dex';
const COMMAND_NAME = 'collect';
const commandSchema = collectCommandSchema;

const validParam: CommandParam = {
	poolAddress,
	tokenId: '0',
	recipient: senderAddress,
	amount0Max: MaxUint128.toString(),
	amount1Max: MaxUint128.toString(),
};

describe('CollectCommand', () => {
	let module: DexModule;
	let command: CollectCommand;
	let nft: NonfungiblePositionManager;
	let tokens: Tokens;
	let createCommandVerifyContext: (params: CommandParam) => CommandVerifyContext<CommandParam>;
	let createCommandExecuteContext: (params: CommandParam) => CommandExecuteContext<CommandParam>;

	beforeEach(async () => {
		({ module, createCommandExecuteContext, createCommandVerifyContext, tokens, nft } =
			await commandFixture<CommandParam>(COMMAND_NAME, commandSchema, senderPublicKey, validParam));
		command = new CollectCommand(module.stores, module.events);

		await nft.mint({
			token0: tokens[0].address,
			token1: tokens[1].address,
			fee: FeeAmount.MEDIUM,
			tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
			tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
			recipient: senderAddress,
			amount0Desired: '100',
			amount1Desired: '100',
			amount0Min: '0',
			amount1Min: '0',
			deadline: Date.now().toString(),
		});

		await nft.decreaseLiquidity({
			poolAddress,
			tokenId: '0',
			liquidity: '50',
			amount0Min: '0',
			amount1Min: '0',
			deadline: Date.now().toString(),
		});
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

		it('should throw error when user sends transaction with invalid address (poolAddress)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				poolAddress: invalidAddress,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (tokenId)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				tokenId: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid address (recipient)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				recipient: invalidAddress,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (amount0Max)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				amount0Max: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (amount1Max)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				amount1Max: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});
	});

	describe('execute', () => {
		it('should transfer tokens owed from burn', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			expect(mock_token_transfer).toHaveBeenCalledWith(
				poolAddress.toString('hex'),
				senderAddress.toString('hex'),
				'49',
			);
		});

		it('should add command events', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			eventResultHaveMinimumLength(context.eventQueue, CollectPositionEvent, MODULE_NAME, 1);
		});
	});
});
