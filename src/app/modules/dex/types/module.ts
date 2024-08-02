/* eslint-disable import/no-cycle */
import { TokenMethod, FeeMethod, SidechainInteroperabilityMethod, MainchainInteroperabilityMethod } from 'klayr-sdk';
import { FeeConversionMethod } from '../../fee_conversion';
import { GovernanceMethod } from '../../governance';
import { NFTMethod } from '../../nft';

export interface DexModuleDependencies {
	tokenMethod: TokenMethod;
	nftMethod: NFTMethod;
	feeMethod: FeeMethod;
	interoperabilityMethod: SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;
	feeConversionMethod?: FeeConversionMethod;
	governanceMethod?: GovernanceMethod;
}
