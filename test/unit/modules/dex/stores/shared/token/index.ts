/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable import/no-extraneous-dependencies */
import { InternalMethod } from 'klayr-framework/dist-node/modules/token/internal_method';
import { SupplyStoreData } from 'klayr-framework/dist-node/modules/token/stores/supply';
import { InteroperabilityMethod } from 'klayr-framework/dist-node/modules/token/types';
import { StateMachine } from 'klayr-sdk';
import { TokenRegistry } from './token_registry';
import { TokenMethod } from '../../../../../../../src/app/modules/dex/types';

export const mock_token_init = jest.fn();
export const mock_token_addDependencies = jest.fn();
export const mock_token_isNativeToken = jest.fn();
export const mock_token_getTokenIDKLY = jest.fn();
export const mock_token_userSubstoreExists = jest.fn();
export const mock_token_getLockedAmount = jest.fn();
export const mock_token_getEscrowedAmount = jest.fn();
export const mock_token_isTokenIDAvailable = jest.fn();
export const mock_token_initializeToken = jest.fn();
export const mock_token_mint = jest.fn();
export const mock_token_burn = jest.fn();
export const mock_token_initializeUserAccount = jest.fn();
export const mock_token_initializeEscrowAccount = jest.fn();
export const mock_token_transferCrossChain = jest.fn();
export const mock_token_lock = jest.fn();
export const mock_token_unlock = jest.fn();
export const mock_token_payMessageFee = jest.fn();
export const mock_token_isTokenSupported = jest.fn();
export const mock_token_supportAllTokens = jest.fn();
export const mock_token_removeAllTokensSupport = jest.fn();
export const mock_token_supportAllTokensFromChainID = jest.fn();
export const mock_token_removeAllTokensSupportFromChainID = jest.fn();
export const mock_token_supportTokenID = jest.fn();
export const mock_token_removeSupport = jest.fn();
export const mock_token_getTotalSupply = jest.fn();
export const mock_token_escrowSubstoreExists = jest.fn();
export const mock_token_transfer = jest.fn();
export const mock_token_getAvailableBalance = jest.fn();

export class MockedTokenMethod implements Omit<TokenMethod, ''> {
	public init(_config: unknown): void {
		mock_token_init(_config);
	}
	public addDependencies(_interoperabilityMethod: InteroperabilityMethod, _internalMethod: InternalMethod): void {
		mock_token_addDependencies(_interoperabilityMethod, _internalMethod);
	}
	public isNativeToken(_tokenID: Buffer): boolean {
		mock_token_isNativeToken(_tokenID);
		return true;
	}
	public getTokenIDKLY(): Buffer {
		mock_token_getTokenIDKLY();
		return Buffer.from('0000000000000000', 'hex');
	}
	public async userSubstoreExists(_methodContext: StateMachine.ImmutableMethodContext, _address: Buffer, _tokenID: Buffer): Promise<boolean> {
		mock_token_userSubstoreExists(_address, _tokenID);
		return true;
	}
	public async getLockedAmount(_methodContext: StateMachine.ImmutableMethodContext, _address: Buffer, _tokenID: Buffer, _module: string): Promise<bigint> {
		mock_token_getLockedAmount(_address, _tokenID, _module);
		const token = TokenRegistry.instance.get(_tokenID.toString('hex'));
		if (token) {
			return token.locked.get(_address.toString('hex') + _module) ?? BigInt(0);
		}
		return BigInt(0);
	}
	public async getEscrowedAmount(_methodContext: StateMachine.ImmutableMethodContext, _escrowChainID: Buffer, _tokenID: Buffer): Promise<bigint> {
		mock_token_getEscrowedAmount(_escrowChainID, _tokenID);
		return BigInt(0);
	}
	public async isTokenIDAvailable(_methodContext: StateMachine.ImmutableMethodContext, _tokenID: Buffer): Promise<boolean> {
		mock_token_isTokenIDAvailable(_tokenID);
		return true;
	}
	public async initializeToken(_methodContext: StateMachine.MethodContext, _tokenID: Buffer): Promise<void> {
		mock_token_initializeToken(_tokenID);
	}
	public async mint(_methodContext: StateMachine.MethodContext, _address: Buffer, _tokenID: Buffer, _amount: bigint): Promise<void> {
		mock_token_mint(_address, _tokenID, _amount);
		const token = TokenRegistry.instance.get(_tokenID.toString('hex'));
		if (token) {
			token.supply += _amount;
			token.balance.set(_address.toString('hex'), (token.balance.get(_address.toString('hex')) ?? BigInt(0)) + _amount);
		}
	}
	public async burn(_methodContext: StateMachine.MethodContext, _address: Buffer, _tokenID: Buffer, _amount: bigint): Promise<void> {
		mock_token_burn(_address, _tokenID, _amount);
		const token = TokenRegistry.instance.get(_tokenID.toString('hex'));
		if (token) {
			token.supply -= _amount;
			token.balance.set(_address.toString('hex'), token.balance.get(_address.toString('hex')) ?? BigInt(0) - _amount);
		}
	}
	public async initializeUserAccount(_methodContext: StateMachine.MethodContext, _address: Buffer, _tokenID: Buffer): Promise<void> {
		mock_token_initializeUserAccount(_address, _tokenID);
	}
	public async initializeEscrowAccount(_methodContext: StateMachine.MethodContext, _chainID: Buffer, _tokenID: Buffer): Promise<void> {
		mock_token_initializeEscrowAccount(_chainID, _tokenID);
	}
	public async transferCrossChain(
		_methodContext: StateMachine.MethodContext,
		_senderAddress: Buffer,
		_receivingChainID: Buffer,
		_recipientAddress: Buffer,
		_tokenID: Buffer,
		_amount: bigint,
		_messageFee: bigint,
		_data: string,
	): Promise<void> {
		mock_token_transferCrossChain(_senderAddress, _receivingChainID, _recipientAddress, _tokenID, _amount, _messageFee, _data);
	}
	public async lock(_methodContext: StateMachine.MethodContext, _address: Buffer, _module: string, _tokenID: Buffer, _amount: bigint): Promise<void> {
		mock_token_lock(_address, _module, _tokenID, _amount);
		const token = TokenRegistry.instance.get(_tokenID.toString('hex'));
		if (token) {
			token.locked.set(_address.toString('hex') + _module, (token.locked.get(_address.toString('hex') + _module) ?? BigInt(0)) + _amount);
			token.balance.set(_address.toString('hex'), (token.balance.get(_address.toString('hex')) ?? BigInt(0)) - _amount);
		}
	}
	public async unlock(_methodContext: StateMachine.MethodContext, _address: Buffer, _module: string, _tokenID: Buffer, _amount: bigint): Promise<void> {
		mock_token_unlock(_address, _module, _tokenID, _amount);
		const token = TokenRegistry.instance.get(_tokenID.toString('hex'));
		if (token) {
			token.locked.set(_address.toString('hex') + _module, (token.locked.get(_address.toString('hex') + _module) ?? BigInt(0)) - _amount);
			token.balance.set(_address.toString('hex'), (token.balance.get(_address.toString('hex')) ?? BigInt(0)) + _amount);
		}
	}
	public async payMessageFee(_methodContext: StateMachine.MethodContext, _payFromAddress: Buffer, _receivingChainID: Buffer, _fee: bigint): Promise<void> {
		mock_token_payMessageFee(_payFromAddress, _receivingChainID, _fee);
	}
	public async isTokenSupported(_methodContext: StateMachine.ImmutableMethodContext, _tokenID: Buffer): Promise<boolean> {
		mock_token_isTokenSupported(_tokenID);
		return true;
	}
	public async supportAllTokens(_methodContext: StateMachine.MethodContext): Promise<void> {
		mock_token_supportAllTokens(_methodContext);
	}
	public async removeAllTokensSupport(_methodContext: StateMachine.MethodContext): Promise<void> {
		mock_token_removeAllTokensSupport(_methodContext);
	}
	public async supportAllTokensFromChainID(_methodContext: StateMachine.MethodContext, _chainID: Buffer): Promise<void> {
		mock_token_supportAllTokensFromChainID(_chainID);
	}
	public async removeAllTokensSupportFromChainID(_methodContext: StateMachine.MethodContext, _chainID: Buffer): Promise<void> {
		mock_token_removeAllTokensSupportFromChainID(_chainID);
	}
	public async supportTokenID(_methodContext: StateMachine.MethodContext, _tokenID: Buffer): Promise<void> {
		mock_token_supportTokenID(_tokenID);
	}
	public async removeSupport(_methodContext: StateMachine.MethodContext, _tokenID: Buffer): Promise<void> {
		mock_token_removeSupport(_tokenID);
	}
	public async getTotalSupply(_context: StateMachine.MethodContext): Promise<{ totalSupply: (SupplyStoreData & { tokenID: Buffer })[] }> {
		mock_token_getTotalSupply();
		const totalSupply: (SupplyStoreData & { tokenID: Buffer })[] = [];
		for (const token of TokenRegistry.instance.keys()) {
			totalSupply.push({
				tokenID: Buffer.from(token, 'hex'),
				totalSupply: TokenRegistry.instance.get(token)!.supply,
			});
		}
		return { totalSupply };
	}
	public async escrowSubstoreExists(_methodContext: StateMachine.MethodContext, _chainID: Buffer, _tokenID: Buffer): Promise<boolean> {
		mock_token_escrowSubstoreExists(_chainID, _tokenID);
		return true;
	}

	public async transfer(_methodContext: StateMachine.MethodContext, _senderAddress: Buffer, _recipientAddress: Buffer, _tokenID: Buffer, _amount: bigint): Promise<void> {
		mock_token_transfer(_senderAddress, _recipientAddress, _tokenID, _amount);
		mock_token_transfer(_senderAddress.toString('hex'), _recipientAddress.toString('hex'), _amount.toString());
		const token = TokenRegistry.instance.get(_tokenID.toString('hex'));
		if (token) {
			if ((token.balance.get(_senderAddress.toString('hex')) ?? BigInt(0)) < _amount) {
				throw new Error(`insufficient funds: ${(token.balance.get(_senderAddress.toString('hex')) ?? BigInt(0)) - _amount}`);
			}
			token.balance.set(_senderAddress.toString('hex'), (token.balance.get(_senderAddress.toString('hex')) ?? BigInt(0)) - _amount);
			token.balance.set(_recipientAddress.toString('hex'), (token.balance.get(_recipientAddress.toString('hex')) ?? BigInt(0)) + _amount);
		}
	}

	public async getAvailableBalance(_methodContext: StateMachine.ImmutableMethodContext, _address: Buffer, _tokenID: Buffer): Promise<bigint> {
		mock_token_getAvailableBalance(_address, _tokenID);
		const token = TokenRegistry.instance.get(_tokenID.toString('hex'));
		if (token) {
			return token.balance.get(_address.toString('hex')) ?? BigInt(0);
		}
		return BigInt(0);
	}
}
