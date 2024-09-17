/* eslint-disable import/no-cycle */
import { Modules } from 'klayr-sdk';
import { verifyValidCrossTransfer, executeSwapByCrossTransfer } from './hooks';
import { MainchainInteroperabilityMethod, NFTMethod, SidechainInteroperabilityMethod, TokenMethod } from './types';

type InteroperabilityMethod = SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;

export class DexInteroperableMethod extends Modules.Interoperability.BaseCCMethod {
	public addDependencies(interoperabilityMethod: InteroperabilityMethod, tokenMethod: TokenMethod, nftMethod: NFTMethod) {
		this._interoperabilityMethod = interoperabilityMethod;
		this._tokenMethod = tokenMethod;
		this._nftMethod = nftMethod;
	}

	public async afterCrossChainCommandExecute(ctx: Modules.Interoperability.CrossChainMessageContext): Promise<void> {
		await verifyValidCrossTransfer.bind(this)(ctx);
		await executeSwapByCrossTransfer.bind(this)(ctx);
	}

	protected _interoperabilityMethod: InteroperabilityMethod | undefined;
	protected _tokenMethod: TokenMethod | undefined;
	protected _nftMethod: NFTMethod | undefined;
}
