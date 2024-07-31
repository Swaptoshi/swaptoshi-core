/* eslint-disable @typescript-eslint/member-ordering */
import { BaseMethod, FeeMethod, TokenMethod } from 'klayr-sdk';
import { FeeConversionMethodRegistry } from './registry';
import { BaseFeeConversionMethod } from './base_fc_method';

export class FeeConversionMethod extends BaseMethod {
	private _tokenMethod: TokenMethod | undefined;
	private _feeMethod: FeeMethod | undefined;
	private _handler: FeeConversionMethodRegistry | undefined;

	public init(handler: FeeConversionMethodRegistry) {
		this._handler = handler;
	}

	public addDependencies(tokenMethod: TokenMethod, feeMethod: FeeMethod) {
		this._tokenMethod = tokenMethod;
		this._feeMethod = feeMethod;
	}

	public register(module: string, commands: string[], handler: BaseFeeConversionMethod): void {
		if (!this._handler) throw new Error('FeeConversionMethod is not initialized');
		if (!this._tokenMethod || !this._feeMethod) throw new Error('FeeConversionMethod dependencies is not properly setup');

		handler.addDependencies(this._tokenMethod, this._feeMethod);

		for (const command of [...new Set(commands)]) {
			this._handler.register(`${module}:${command}`, handler);
		}
	}

	public unregister(module: string, commands: string[], handler: BaseFeeConversionMethod): void {
		if (!this._handler) throw new Error('FeeConversionMethod is not initialized');
		if (!this._tokenMethod || !this._feeMethod) throw new Error('FeeConversionMethod dependencies is not properly setup');

		handler.addDependencies(this._tokenMethod, this._feeMethod);

		for (const command of [...new Set(commands)]) {
			this._handler.unregister(`${module}:${command}`, handler);
		}
	}
}
