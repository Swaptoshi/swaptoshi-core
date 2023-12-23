/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
	TokenMethod,
	FeeMethod,
} from 'lisk-sdk';
import { CreateTokenParams, TokenFactoryModuleConfig } from '../types';
import { createTokenCommandSchema } from '../schema/commands/create_command';
import { NextAvailableTokenIdStore } from '../stores/next_available_token_id';
import { FactoryStore } from '../stores/factory';
import { CreateTokenFactoryEvent } from '../events/create_token_factory';

export class CreateCommand extends BaseCommand {
	public init(config: TokenFactoryModuleConfig) {
		this._config = config;
	}

	public addDependencies(tokenMethod: TokenMethod, feeMethod: FeeMethod) {
		this._tokenMethod = tokenMethod;
		this._feeMethod = feeMethod;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<CreateTokenParams>,
	): Promise<VerificationResult> {
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<CreateTokenParams>): Promise<void> {
		const { senderAddress } = _context.transaction;

		const nextIdStore = this.stores.get(NextAvailableTokenIdStore);
		const factoryStore = this.stores.get(FactoryStore);
		const nextId = await nextIdStore.getOrDefault(_context);

		const tokenIdBuf = Buffer.allocUnsafe(4);
		tokenIdBuf.writeUIntBE(Number(nextId.nextTokenId), 0, 4);
		const tokenId = Buffer.concat([_context.chainID, tokenIdBuf]);

		this._feeMethod?.payFee(_context, BigInt(this._config!.createFee));

		await this._tokenMethod?.initializeToken(_context, tokenId);
		await this._tokenMethod?.mint(_context, senderAddress, tokenId, _context.params.amount);

		await nextIdStore.increment(_context);
		await factoryStore.register(_context, tokenId, senderAddress);

		const events = this.events.get(CreateTokenFactoryEvent);
		events.add(
			_context,
			{
				ownerAddress: senderAddress,
				tokenId,
				amount: _context.params.amount,
			},
			[senderAddress],
		);
	}

	private _tokenMethod: TokenMethod | undefined;
	private _feeMethod: FeeMethod | undefined;
	private _config: TokenFactoryModuleConfig | undefined;

	public schema = createTokenCommandSchema;
}
