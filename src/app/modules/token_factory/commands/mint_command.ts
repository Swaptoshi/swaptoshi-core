/* eslint-disable class-methods-use-this */

import {
	BaseCommand,
	CommandVerifyContext,
	CommandExecuteContext,
	VerificationResult,
	VerifyStatus,
	TokenMethod,
} from 'lisk-sdk';
import { MintTokenParams } from '../types';
import { TOKEN_ID_LENGTH } from '../constants';
import { mintTokenCommandSchema } from '../schema/commands/mint_command';
import { FactoryStore } from '../stores/factory';

export class MintCommand extends BaseCommand {
	public addDependencies(tokenMethod: TokenMethod) {
		this._tokenMethod = tokenMethod;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async verify(
		_context: CommandVerifyContext<MintTokenParams>,
	): Promise<VerificationResult> {
		if (_context.params.tokenId.length !== TOKEN_ID_LENGTH) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error(`tokenId length should be exactly ${TOKEN_ID_LENGTH} bytes`),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async execute(_context: CommandExecuteContext<MintTokenParams>): Promise<void> {
		const { senderAddress } = _context.transaction;

		const factoryStore = this.stores.get(FactoryStore);
		const factory = await factoryStore.getOrUndefined(_context, _context.params.tokenId);

		if (!factory)
			throw new Error(
				`factory for tokenId ${_context.params.tokenId.toString('hex')} doesn't exist`,
			);
		if (factory.owner.compare(senderAddress) !== 0)
			throw new Error(`sender is not the factory owner`);

		await this._tokenMethod?.mint(
			_context,
			senderAddress,
			_context.params.tokenId,
			_context.params.amount,
		);
	}

	private _tokenMethod: TokenMethod | undefined;
	public schema = mintTokenCommandSchema;
}
