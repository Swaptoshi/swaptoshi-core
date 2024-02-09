/* eslint-disable jest/expect-expect */
import { CommandExecuteContext, CommandVerifyContext, VerifyStatus } from 'lisk-sdk';
import { BurnCommand } from '../../../../../src/app/modules/dex/commands/burn_command';
import { DexModule } from '../../../../../src/app/modules/dex/module';
import { burnCommandSchema } from '../../../../../src/app/modules/dex/schema/commands/burn_command';
import { BurnParams } from '../../../../../src/app/modules/dex/types';
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
import { TokenURIDestroyedEvent } from '../../../../../src/app/modules/dex/events/tokenuri_destroyed';
import { NFTRegistry } from '../stores/shared/nft/nft_registry';
import { TokenRegistry } from '../stores/shared/token/token_registry';

type CommandParam = BurnParams;
const COMMAND_NAME = 'burn';
const commandSchema = burnCommandSchema;

const validParam: CommandParam = {
	poolAddress,
	tokenId: '0',
};

describe('BurnCommand', () => {
	let module: DexModule;
	let command: BurnCommand;
	let nft: NonfungiblePositionManager;
	let tokens: Tokens;
	let createCommandVerifyContext: (params: CommandParam) => CommandVerifyContext<CommandParam>;
	let createCommandExecuteContext: (params: CommandParam) => CommandExecuteContext<CommandParam>;

	beforeEach(async () => {
		({ module, createCommandExecuteContext, createCommandVerifyContext, tokens, nft } =
			await commandFixture<CommandParam>(COMMAND_NAME, commandSchema, senderPublicKey, validParam));
		command = new BurnCommand(module.stores, module.events);

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
			tokenId: validParam.tokenId,
			liquidity: '100',
			amount0Min: '0',
			amount1Min: '0',
			deadline: Date.now().toString(),
		});

		await nft.collect({
			poolAddress,
			tokenId: validParam.tokenId,
			recipient: senderAddress,
			amount0Max: MaxUint128.toString(),
			amount1Max: MaxUint128.toString(),
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
	});

	describe('execute', () => {
		it('should delete the tokenId successfully', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);
			await expect((async () => nft.getPositions(validParam.tokenId))()).rejects.toThrow(
				'NFT doesnt exist',
			);
		});

		it('should add command events', async () => {
			const context = createCommandExecuteContext(validParam);
			await command.execute(context);

			eventResultHaveMinimumLength(context.eventQueue, TokenURIDestroyedEvent, module.name, 1);
		});
	});
});
