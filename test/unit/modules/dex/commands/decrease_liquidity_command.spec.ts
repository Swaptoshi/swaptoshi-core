/* eslint-disable jest/expect-expect */
import { CommandExecuteContext, CommandVerifyContext, VerifyStatus } from 'lisk-sdk';
import { DexModule } from '../../../../../src/app/modules/dex/module';
import { DecreaseLiquidityParams } from '../../../../../src/app/modules/dex/types';
import { invalidAddress, invalidNumberString } from '../utils/invalid';
import { Tokens, commandFixture } from '../utils/fixtures';
import { NonfungiblePositionManager } from '../../../../../src/app/modules/dex/stores/factory';
import { FeeAmount, TICK_SPACINGS, getMaxTick, getMinTick } from '../stores/shared/utilities';
import { poolAddress, senderAddress, senderPublicKey } from '../utils/account';
import { eventResultHaveMinimumLength } from '../../../../utils/events';
import { NFTRegistry } from '../stores/shared/nft/nft_registry';
import { TokenRegistry } from '../stores/shared/token/token_registry';
import { decreaseLiquidityCommandSchema } from '../../../../../src/app/modules/dex/schema/commands/decrease_liquidity_command';
import { DecreaseLiquidityCommand } from '../../../../../src/app/modules/dex/commands/decrease_liquidity_command';
import { DecreaseLiquidityEvent } from '../../../../../src/app/modules/dex/events/decrease_liquidity';

type CommandParam = DecreaseLiquidityParams;
const COMMAND_NAME = 'decreaseLiquidity';
const commandSchema = decreaseLiquidityCommandSchema;

const validParam: CommandParam = {
	poolAddress,
	tokenId: '0',
	liquidity: '25',
	amount0Min: '0',
	amount1Min: '0',
	deadline: Date.now().toString(),
};

describe('DecreaseLiquidityCommand', () => {
	let module: DexModule;
	let command: DecreaseLiquidityCommand;
	let nft: NonfungiblePositionManager;
	let tokens: Tokens;
	let createCommandVerifyContext: (params: CommandParam) => CommandVerifyContext<CommandParam>;
	let createCommandExecuteContext: (params: CommandParam) => CommandExecuteContext<CommandParam>;

	beforeEach(async () => {
		({ module, createCommandExecuteContext, createCommandVerifyContext, tokens, nft } =
			await commandFixture<CommandParam>(COMMAND_NAME, commandSchema, senderPublicKey, validParam));
		command = new DecreaseLiquidityCommand(module.stores, module.events);

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

		it('should throw error when user sends transaction with invalid number string (liquidity)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				liquidity: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (amount0Min)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				amount0Min: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (amount1Min)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				amount1Min: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (deadline)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				deadline: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});
	});

	describe('execute', () => {
		it('should decreases position liquidity', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			const { liquidity } = await nft.getPositions(validParam.tokenId);
			expect(liquidity).toBe('75');
		});

		it('should add command events', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			eventResultHaveMinimumLength(context.eventQueue, DecreaseLiquidityEvent, module.name, 1);
		});
	});
});
