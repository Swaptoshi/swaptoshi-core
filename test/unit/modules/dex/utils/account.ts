import { cryptography } from 'klayr-sdk';
import { PoolAddress } from '../../../../../src/app/modules/dex/stores/library/periphery';
import { FeeAmount } from '../stores/shared/utilities';

export const senderPrivateKey = Buffer.from('96238e3e3e4e1c31321b4ad2cd88dcd3a6e14fc11a82c11f6c3e63272a1768ff330606ae444531582beaad5891c5733ce16ea19768be5a8a45ae10fea99f2032', 'hex');
export const senderPublicKey = cryptography.ed.getPublicKeyFromPrivateKey(senderPrivateKey);
export const senderAddress = cryptography.address.getAddressFromPublicKey(senderPublicKey);

export const token0 = Buffer.from('0000000000000001', 'hex');
export const token1 = Buffer.from('0000000000000002', 'hex');
export const token2 = Buffer.from('0000000000000003', 'hex');
export const token3 = Buffer.from('0000000000000004', 'hex');

export const token0Symbol = 'TKNA';
export const token1Symbol = 'TKNB';
export const token2Symbol = 'TKNC';
export const token3Symbol = 'TKND';

export const poolAddress = PoolAddress.computeAddress(PoolAddress.getPoolKey(token0, token1, FeeAmount.MEDIUM));

export const poolAddress2 = PoolAddress.computeAddress(PoolAddress.getPoolKey(token1, token2, FeeAmount.MEDIUM));
