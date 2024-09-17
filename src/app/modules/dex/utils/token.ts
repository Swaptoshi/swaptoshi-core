/* eslint-disable import/no-cycle */
import { Types } from 'klayr-sdk';
import { DexModuleConfig } from '../types';
import { CHAIN_ID_LENGTH } from '../constants';

export const getMainchainID = (chainID: Buffer): Buffer => {
	const networkID = chainID.subarray(0, 1);
	return Buffer.concat([networkID, Buffer.alloc(CHAIN_ID_LENGTH - 1, 0)]);
};

export const getMainchainTokenId = (chainId: Buffer) => Buffer.concat([getMainchainID(chainId), Buffer.alloc(4, 0)]);

export const getDexTokenId = (chainId: Buffer) => Buffer.concat([chainId, Buffer.alloc(4, 0)]);

export const getMainchainToken = (genesisConfig: Types.GenesisConfig, dexConfig: DexModuleConfig) => {
	const tokenId = getMainchainTokenId(Buffer.from(genesisConfig.chainID, 'hex'));
	const { symbol, decimal } = dexConfig.nftPositionMetadata.mainchain;

	return {
		tokenId,
		symbol: symbol.toUpperCase(),
		decimal,
	};
};

export const getDEXToken = (genesisConfig: Types.GenesisConfig, dexConfig: DexModuleConfig) => {
	const tokenId = getDexTokenId(Buffer.from(genesisConfig.chainID, 'hex'));
	const { symbol, decimal } = dexConfig.nftPositionMetadata.dex;

	return {
		tokenId,
		symbol: symbol.toUpperCase(),
		decimal,
	};
};
