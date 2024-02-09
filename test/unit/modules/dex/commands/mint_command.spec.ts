/* eslint-disable jest/expect-expect */
import { CommandExecuteContext, CommandVerifyContext, VerifyStatus } from 'lisk-sdk';
import { MintCommand } from '../../../../../src/app/modules/dex/commands/mint_command';
import { DexModule } from '../../../../../src/app/modules/dex/module';
import { mintCommandSchema } from '../../../../../src/app/modules/dex/schema/commands/mint_command';
import { MintParams } from '../../../../../src/app/modules/dex/types';
import { invalidAddress, invalidNumberString, invalidTokenAddress } from '../utils/invalid';
import { commandFixture } from '../utils/fixtures';
import { NonfungiblePositionManager } from '../../../../../src/app/modules/dex/stores/factory';
import { FeeAmount, TICK_SPACINGS, getMaxTick, getMinTick } from '../stores/shared/utilities';
import {
	senderAddress,
	senderPublicKey,
	token0 as token0ID,
	token1 as token1ID,
} from '../utils/account';
import { eventResultHaveMinimumLength } from '../../../../utils/events';
import { NFTRegistry } from '../stores/shared/nft/nft_registry';
import { TokenRegistry } from '../stores/shared/token/token_registry';
import { TokenURICreatedEvent } from '../../../../../src/app/modules/dex/events/tokenuri_created';

type CommandParam = MintParams;
const COMMAND_NAME = 'mint';
const commandSchema = mintCommandSchema;

const validParam: CommandParam = {
	token0: token0ID,
	token1: token1ID,
	fee: FeeAmount.MEDIUM,
	tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
	tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
	recipient: senderAddress,
	amount0Desired: '15',
	amount1Desired: '15',
	amount0Min: '0',
	amount1Min: '0',
	deadline: Date.now().toString(),
};

describe('MintCommand', () => {
	let module: DexModule;
	let command: MintCommand;
	let nft: NonfungiblePositionManager;
	let createCommandVerifyContext: (params: CommandParam) => CommandVerifyContext<CommandParam>;
	let createCommandExecuteContext: (params: CommandParam) => CommandExecuteContext<CommandParam>;

	beforeEach(async () => {
		({ module, createCommandExecuteContext, createCommandVerifyContext, nft } =
			await commandFixture<CommandParam>(COMMAND_NAME, commandSchema, senderPublicKey, validParam));
		command = new MintCommand(module.stores, module.events);
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

		it('should throw error when user sends transaction with invalid token address (token0)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				token0: invalidTokenAddress,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid token address (token1)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				token1: invalidTokenAddress,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (fee)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				fee: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (tickLower)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				tickLower: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (tickUpper)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				tickUpper: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (amount0Desired)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				amount0Desired: invalidNumberString,
			});
			await expect(command.verify(context)).resolves.toHaveProperty('status', VerifyStatus.FAIL);
		});

		it('should throw error when user sends transaction with invalid number string (amount1Desired)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				amount1Desired: invalidNumberString,
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

		it('should throw error when user sends transaction with invalid address (recipient)', async () => {
			const context = createCommandVerifyContext({
				...validParam,
				recipient: invalidAddress,
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
		it('should creates a token', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			expect(NFTRegistry.balanceOf.get(senderAddress.toString('hex'))).toBe('1');
			const {
				fee,
				token0,
				token1,
				tickLower,
				tickUpper,
				liquidity,
				tokensOwed0,
				tokensOwed1,
				feeGrowthInside0LastX128,
				feeGrowthInside1LastX128,
			} = await nft.getPositions('0');
			expect(token0.toString('hex')).toBe(validParam.token0.toString('hex'));
			expect(token1.toString('hex')).toBe(validParam.token1.toString('hex'));
			expect(fee).toBe(FeeAmount.MEDIUM);
			expect(tickLower).toBe(getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString());
			expect(tickUpper).toBe(getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString());
			expect(liquidity).toBe('15');
			expect(tokensOwed0).toBe('0');
			expect(tokensOwed1).toBe('0');
			expect(feeGrowthInside0LastX128).toBe('0');
			expect(feeGrowthInside1LastX128).toBe('0');
		});

		it('should add command events', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			eventResultHaveMinimumLength(context.eventQueue, TokenURICreatedEvent, module.name, 1);
		});
	});
});
