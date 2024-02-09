/* eslint-disable no-nested-ternary */
import { getDEXToken, getMainchainToken } from '../../../../../src/app/modules/dex/utils';
import { moduleInitArgs } from './config';

export const fallbackTokenSymbol = (tokenId: Buffer, symbol: string) => {
	const mainchain = getMainchainToken(moduleInitArgs.genesisConfig, moduleInitArgs.moduleConfig);
	const dex = getDEXToken(moduleInitArgs.genesisConfig, moduleInitArgs.moduleConfig);

	return tokenId.compare(mainchain.tokenId) === 0
		? mainchain.symbol
		: tokenId.compare(dex.tokenId) === 0
		? dex.symbol
		: symbol;
};
