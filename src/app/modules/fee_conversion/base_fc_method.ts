/* eslint-disable @typescript-eslint/member-ordering */
import { FeeMethod, NamedRegistry, TokenMethod, TransactionVerifyContext } from 'klayr-sdk';
import { FeeConversionVerificationResult } from './types';

/**
 * The `BaseFeeConversionMethod` outlines the implementation required to implement `FeeConversion` modules by providing a common interface, so that each module can implement its own fee conversion logic
 */
export abstract class BaseFeeConversionMethod {
	public stores: NamedRegistry;
	public events: NamedRegistry;
	public tokenMethod!: TokenMethod;
	public feeMethod!: FeeMethod;

	public constructor(stores: NamedRegistry, events: NamedRegistry) {
		this.stores = stores;
		this.events = events;
	}

	public addDependencies(tokenMethod: TokenMethod, feeMethod: FeeMethod) {
		this.tokenMethod = tokenMethod;
		this.feeMethod = feeMethod;
	}

	/**
	 * The method name is the unique identifier for the method.
	 *
	 * The method name is automatically calculated from the class name of the method:
	 * The `FeeConversionMethod` suffix of the class name is removed, and the first character is converted to lowercase.
	 */
	public get name(): string {
		const name = this.constructor.name.replace('FeeConversionMethod', '');
		return name.charAt(0).toLowerCase() + name.substring(1);
	}

	/**
	 * Check whether the fee conversion procedure needs to be carried out or not.
	 * This function must return an object with a `status` property, whose value can be:
	 *
	 * 0, for `FeeConversionVerificationResult.NO_CONVERSION`;
	 * 1, for `FeeConversionVerificationResult.WITH_CONVERSION`;
	 *
	 * Additionally, this function may return the `payload` property object, which contain:
	 *
	 * `tokenId`, token ID to be converted;
	 * `txAmount`, the transaction amount (used for additional balance checking);
	 *
	 * @param context Klayr SDK context with a `getStore` property.
	 */
	// eslint-disable-next-line @typescript-eslint/require-await
	public async verifyFeeConversion(_context: TransactionVerifyContext): Promise<FeeConversionVerificationResult> {
		throw new Error(`verifyFeeConversion for class ${this.constructor.name} is not implemented`);
	}
}
