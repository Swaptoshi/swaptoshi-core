import { GenesisConfig, getMainchainID } from 'lisk-sdk';
import { DexModuleConfig } from '../types';

export const getMainchainTokenId = (chainId: Buffer) =>
	Buffer.concat([getMainchainID(chainId), Buffer.alloc(4, 0)]);

export const getDexTokenId = (chainId: Buffer) => Buffer.concat([chainId, Buffer.alloc(4, 0)]);

export const getMainchainToken = (genesisConfig: GenesisConfig, dexConfig: DexModuleConfig) => {
	const tokenId = getMainchainTokenId(Buffer.from(genesisConfig.chainID, 'hex'));
	const { symbol, decimal } = dexConfig.nftPositionMetadata.mainchain;

	return {
		tokenId,
		symbol: symbol.toUpperCase(),
		decimal,
	};
};

export const getDEXToken = (genesisConfig: GenesisConfig, dexConfig: DexModuleConfig) => {
	const tokenId = getDexTokenId(Buffer.from(genesisConfig.chainID, 'hex'));
	const { symbol, decimal } = dexConfig.nftPositionMetadata.dex;

	return {
		tokenId,
		symbol: symbol.toUpperCase(),
		decimal,
	};
};
