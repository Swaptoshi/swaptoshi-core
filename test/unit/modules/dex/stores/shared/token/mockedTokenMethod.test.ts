/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
	MockedTokenMethod,
	mock_token_addDependencies,
	mock_token_burn,
	mock_token_escrowSubstoreExists,
	mock_token_getAvailableBalance,
	mock_token_getEscrowedAmount,
	mock_token_getLockedAmount,
	mock_token_getTokenIDKLY,
	mock_token_getTotalSupply,
	mock_token_init,
	mock_token_initializeEscrowAccount,
	mock_token_initializeToken,
	mock_token_initializeUserAccount,
	mock_token_isNativeToken,
	mock_token_isTokenIDAvailable,
	mock_token_isTokenSupported,
	mock_token_lock,
	mock_token_mint,
	mock_token_payMessageFee,
	mock_token_removeAllTokensSupport,
	mock_token_removeAllTokensSupportFromChainID,
	mock_token_removeSupport,
	mock_token_supportAllTokens,
	mock_token_supportAllTokensFromChainID,
	mock_token_supportTokenID,
	mock_token_transfer,
	mock_token_transferCrossChain,
	mock_token_unlock,
	mock_token_userSubstoreExists,
} from '.';
import { TokenRegistry } from './token_registry';
import { Token } from './token';
import { TokenMethod } from '../../../../../../../src/app/modules/dex/types';

const context = {} as any;
const tokenModule = 'module';
const receivingChainID = Buffer.from('00000001', 'hex');
const escrowChainID = Buffer.from('00000002', 'hex');
const tokenId = Buffer.alloc(4);
const sender = Buffer.alloc(20);
const recipient = Buffer.from('0000000000000000000000000000000000000001', 'hex');

describe('MockedTokenMethod', () => {
	let tokenMethod: TokenMethod;

	beforeEach(() => {
		tokenMethod = new MockedTokenMethod() as unknown as TokenMethod;
		const token = new Token();
		TokenRegistry.createToken(tokenId, token);
	});

	afterEach(() => TokenRegistry.reset());

	describe('init', () => {
		it('should call mock method', () => {
			tokenMethod.init('init' as any);
			expect(mock_token_init).toHaveBeenCalledWith('init');
		});
	});

	describe('addDependencies', () => {
		it('should call mock method', () => {
			tokenMethod.addDependencies('interoperabilityMethod' as any, 'internalMethod' as any);
			expect(mock_token_addDependencies).toHaveBeenCalledWith('interoperabilityMethod', 'internalMethod');
		});
	});

	describe('isNativeToken', () => {
		it('should call mock method', () => {
			tokenMethod.isNativeToken('isNativeToken' as any);
			expect(mock_token_isNativeToken).toHaveBeenCalledWith('isNativeToken');
		});
	});

	describe('getTokenIDKLY', () => {
		it('should call mock method', () => {
			tokenMethod.getTokenIDKLY();
			expect(mock_token_getTokenIDKLY).toHaveBeenCalled();
		});
	});

	describe('userSubstoreExists', () => {
		it('should call mock method', async () => {
			await tokenMethod.userSubstoreExists(context, sender, tokenId);
			expect(mock_token_userSubstoreExists).toHaveBeenCalledWith(sender, tokenId);
		});
	});

	describe('getLockedAmount', () => {
		beforeEach(async () => tokenMethod.lock(context, sender, tokenModule, tokenId, BigInt(10)));

		it('should call mock method', async () => {
			await tokenMethod.getLockedAmount(context, sender, tokenId, tokenModule);
			expect(mock_token_getLockedAmount).toHaveBeenCalledWith(sender, tokenId, tokenModule);
		});

		it('should return correct value', async () => {
			const res = await tokenMethod.getLockedAmount(context, sender, tokenId, tokenModule);
			expect(res.toString()).toBe('10');
		});
	});

	describe('getEscrowedAmount', () => {
		it('should call mock method', async () => {
			await tokenMethod.getEscrowedAmount(context, escrowChainID, tokenId);
			expect(mock_token_getEscrowedAmount).toHaveBeenCalledWith(escrowChainID, tokenId);
		});
	});

	describe('isTokenIDAvailable', () => {
		it('should call mock method', async () => {
			await tokenMethod.isTokenIDAvailable(context, tokenId);
			expect(mock_token_isTokenIDAvailable).toHaveBeenCalledWith(tokenId);
		});
	});

	describe('initializeToken', () => {
		it('should call mock method', async () => {
			await tokenMethod.initializeToken(context, tokenId);
			expect(mock_token_initializeToken).toHaveBeenCalledWith(tokenId);
		});
	});

	describe('mint', () => {
		it('should call mock method', async () => {
			await tokenMethod.mint(context, sender, tokenId, BigInt(10));
			expect(mock_token_mint).toHaveBeenCalledWith(sender, tokenId, BigInt(10));
		});

		it('should mint new token', async () => {
			await tokenMethod.mint(context, sender, tokenId, BigInt(10));
			expect(TokenRegistry.instance.get(tokenId.toString('hex'))?.supply.toString()).toBe('10');
		});
	});

	describe('burn', () => {
		beforeEach(async () => {
			await tokenMethod.mint(context, sender, tokenId, BigInt(10));
		});
		it('should call mock method', async () => {
			await tokenMethod.burn(context, sender, tokenId, BigInt(10));
			expect(mock_token_burn).toHaveBeenCalledWith(sender, tokenId, BigInt(10));
		});

		it('should burn new token', async () => {
			await tokenMethod.burn(context, sender, tokenId, BigInt(10));
			expect(TokenRegistry.instance.get(tokenId.toString('hex'))?.supply.toString()).toBe('0');
		});
	});

	describe('initializeUserAccount', () => {
		it('should call mock method', async () => {
			await tokenMethod.initializeUserAccount(context, sender, tokenId);
			expect(mock_token_initializeUserAccount).toHaveBeenCalledWith(sender, tokenId);
		});
	});

	describe('initializeEscrowAccount', () => {
		it('should call mock method', async () => {
			await tokenMethod.initializeEscrowAccount(context, receivingChainID, tokenId);
			expect(mock_token_initializeEscrowAccount).toHaveBeenCalledWith(receivingChainID, tokenId);
		});
	});

	describe('transferCrossChain', () => {
		it('should call mock method', async () => {
			await tokenMethod.transferCrossChain(context, sender, receivingChainID, recipient, tokenId, BigInt(10), BigInt(0), '');
			expect(mock_token_transferCrossChain).toHaveBeenCalledWith(sender, receivingChainID, recipient, tokenId, BigInt(10), BigInt(0), '');
		});
	});

	describe('lock', () => {
		beforeEach(async () => {
			await tokenMethod.mint(context, sender, tokenId, BigInt(10));
		});

		it('should call mock method', async () => {
			await tokenMethod.lock(context, sender, tokenModule, tokenId, BigInt(10));
			expect(mock_token_lock).toHaveBeenCalledWith(sender, tokenModule, tokenId, BigInt(10));
		});

		it('should lock token', async () => {
			await tokenMethod.lock(context, sender, tokenModule, tokenId, BigInt(10));
			expect((await tokenMethod.getLockedAmount(context, sender, tokenId, tokenModule)).toString()).toBe('10');
		});
	});

	describe('unlock', () => {
		beforeEach(async () => {
			await tokenMethod.mint(context, sender, tokenId, BigInt(10));
			await tokenMethod.lock(context, sender, tokenModule, tokenId, BigInt(10));
		});

		it('should call mock method', async () => {
			await tokenMethod.unlock(context, sender, tokenModule, tokenId, BigInt(10));
			expect(mock_token_unlock).toHaveBeenCalledWith(sender, tokenModule, tokenId, BigInt(10));
		});

		it('should unlock token', async () => {
			await tokenMethod.unlock(context, sender, tokenModule, tokenId, BigInt(10));
			expect((await tokenMethod.getLockedAmount(context, sender, tokenId, tokenModule)).toString()).toBe('0');
		});
	});

	describe('payMessageFee', () => {
		it('should call mock method', async () => {
			await tokenMethod.payMessageFee(context, sender, receivingChainID, BigInt(10));
			expect(mock_token_payMessageFee).toHaveBeenCalledWith(sender, receivingChainID, BigInt(10));
		});
	});

	describe('isTokenSupported', () => {
		it('should call mock method', async () => {
			await tokenMethod.isTokenSupported(context, tokenId);
			expect(mock_token_isTokenSupported).toHaveBeenCalledWith(tokenId);
		});
	});

	describe('supportAllTokens', () => {
		it('should call mock method', async () => {
			await tokenMethod.supportAllTokens(context);
			expect(mock_token_supportAllTokens).toHaveBeenCalled();
		});
	});

	describe('removeAllTokensSupport', () => {
		it('should call mock method', async () => {
			await tokenMethod.removeAllTokensSupport(context);
			expect(mock_token_removeAllTokensSupport).toHaveBeenCalled();
		});
	});

	describe('supportAllTokensFromChainID', () => {
		it('should call mock method', async () => {
			await tokenMethod.supportAllTokensFromChainID(context, receivingChainID);
			expect(mock_token_supportAllTokensFromChainID).toHaveBeenCalledWith(receivingChainID);
		});
	});

	describe('removeAllTokensSupportFromChainID', () => {
		it('should call mock method', async () => {
			await tokenMethod.removeAllTokensSupportFromChainID(context, receivingChainID);
			expect(mock_token_removeAllTokensSupportFromChainID).toHaveBeenCalledWith(receivingChainID);
		});
	});

	describe('supportTokenID', () => {
		it('should call mock method', async () => {
			await tokenMethod.supportTokenID(context, tokenId);
			expect(mock_token_supportTokenID).toHaveBeenCalledWith(tokenId);
		});
	});

	describe('removeSupport', () => {
		it('should call mock method', async () => {
			await tokenMethod.removeSupport(context, tokenId);
			expect(mock_token_removeSupport).toHaveBeenCalledWith(tokenId);
		});
	});

	describe('getTotalSupply', () => {
		beforeEach(async () => {
			await tokenMethod.mint(context, sender, tokenId, BigInt(10));
		});
		it('should call mock method', async () => {
			await tokenMethod.getTotalSupply(context);
			expect(mock_token_getTotalSupply).toHaveBeenCalled();
		});
		it('should return total supply', async () => {
			const res = await tokenMethod.getTotalSupply(context);
			expect(res.totalSupply[0].totalSupply.toString()).toBe('10');
		});
	});

	describe('escrowSubstoreExists', () => {
		it('should call mock method', async () => {
			await tokenMethod.escrowSubstoreExists(context, receivingChainID, tokenId);
			expect(mock_token_escrowSubstoreExists).toHaveBeenCalledWith(receivingChainID, tokenId);
		});
	});

	describe('transfer', () => {
		beforeEach(async () => {
			await tokenMethod.mint(context, sender, tokenId, BigInt(10));
		});
		it('should call mock method', async () => {
			await tokenMethod.transfer(context, sender, recipient, tokenId, BigInt(10));
			expect(mock_token_transfer).toHaveBeenCalledWith(sender, recipient, tokenId, BigInt(10));
		});

		it('should transfer', async () => {
			await tokenMethod.transfer(context, sender, recipient, tokenId, BigInt(10));
			expect((await tokenMethod.getAvailableBalance(context, sender, tokenId)).toString()).toBe('0');
			expect((await tokenMethod.getAvailableBalance(context, recipient, tokenId)).toString()).toBe('10');
		});
	});

	describe('getAvailableBalance', () => {
		beforeEach(async () => {
			await tokenMethod.mint(context, sender, tokenId, BigInt(10));
		});

		it('should call mock method', async () => {
			await tokenMethod.getAvailableBalance(context, sender, tokenId);
			expect(mock_token_getAvailableBalance).toHaveBeenCalledWith(sender, tokenId);
		});

		it('should return correct balance', async () => {
			const res = await tokenMethod.getAvailableBalance(context, sender, tokenId);
			expect(res.toString()).toBe('10');
		});
	});
});
