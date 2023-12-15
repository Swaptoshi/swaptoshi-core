import { BaseEndpoint, ModuleEndpointContext, testing } from 'lisk-sdk';
import { DexModule } from '../../../../src/app/modules/dex/module';
import { DexEndpoint } from '../../../../src/app/modules/dex/endpoint';
import { PrefixedStateReadWriter } from '../../../../node_modules/lisk-framework/dist-node/state_machine/prefixed_state_read_writer';
import {
	GetMetadataParams,
	GetPoolParams,
	GetPositionParams,
	GetTokenURIParams,
	ObserveParams,
	QuoteExactInputParams,
	QuoteExactInputSingleParams,
	QuoteExactOutputParams,
	QuoteExactOutputSingleParams,
} from '../../../../src/app/modules/dex/types';
import { Tokens, endpointFixture } from './utils/fixtures';
import { encodePath } from './stores/shared/path';
import { FeeAmount } from './stores/shared/utilities';
import { SwaptoshiPool } from '../../../../src/app/modules/dex/stores/factory';
import { serializer } from '../../../../src/app/modules/dex/utils';

describe('DexEndpoint', () => {
	let context: ModuleEndpointContext;
	let module: DexModule;
	let endpoint: DexEndpoint;
	let stateStore: PrefixedStateReadWriter;
	let tokens: Tokens;
	let pool: SwaptoshiPool;

	beforeEach(async () => {
		({ module, stateStore, tokens, pool } = await endpointFixture());
		endpoint = module.endpoint;
	});

	it('should inherit from BaseEndpoint', () => {
		expect(DexEndpoint.prototype).toBeInstanceOf(BaseEndpoint);
	});

	describe('constructor', () => {
		it('should be of the correct type', () => {
			expect(endpoint).toBeInstanceOf(DexEndpoint);
		});
		it("should expose 'quoteExactInput'", () => {
			expect(typeof endpoint.quoteExactInput).toBe('function');
		});
		it("should expose 'quoteExactInputSingle'", () => {
			expect(typeof endpoint.quoteExactInputSingle).toBe('function');
		});
		it("should expose 'quoteExactOutput'", () => {
			expect(typeof endpoint.quoteExactOutput).toBe('function');
		});
		it("should expose 'quoteExactOutputSingle'", () => {
			expect(typeof endpoint.quoteExactOutputSingle).toBe('function');
		});
		it("should expose 'getPool'", () => {
			expect(typeof endpoint.getPool).toBe('function');
		});
		it("should expose 'getPosition'", () => {
			expect(typeof endpoint.getPosition).toBe('function');
		});
		it("should expose 'getTokenURI'", () => {
			expect(typeof endpoint.getTokenURI).toBe('function');
		});
		it("should expose 'getMetadata'", () => {
			expect(typeof endpoint.getMetadata).toBe('function');
		});
		it("should expose 'observe'", () => {
			expect(typeof endpoint.observe).toBe('function');
		});
	});

	describe('quoteExactInput', () => {
		it('should quote exact input', async () => {
			const param: QuoteExactInputParams = {
				amountIn: '10000',
				path: encodePath([tokens[2].address, tokens[1].address], [FeeAmount.MEDIUM]).toString(
					'hex',
				),
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } =
				await endpoint.quoteExactInput(context);

			expect(sqrtPriceX96AfterList).toHaveLength(1);
			expect(sqrtPriceX96AfterList[0]).toBe('80018067294531553039351583520');
			expect(initializedTicksCrossedList[0]).toBe('0');
			expect(amountOut).toBe('9871');
		});

		it('should throw an error if param.path is not a string', async () => {
			const func = async () => {
				const param: QuoteExactInputParams = { amountIn: '10000', path: 0 as any };
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactInput(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.amountIn is not a numberstring', async () => {
			const func = async () => {
				const param: QuoteExactInputParams = { amountIn: 'notANumber', path: '00000000' };
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactInput(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('quoteExactInputSingle', () => {
		it('should quote exact input single', async () => {
			const param: QuoteExactInputSingleParams = {
				amountIn: '10000',
				tokenIn: tokens[2].address.toString('hex'),
				tokenOut: tokens[1].address.toString('hex'),
				fee: FeeAmount.MEDIUM,
				sqrtPriceLimitX96: '0',
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const { amountOut, sqrtPriceX96After, initializedTicksCrossed } =
				await endpoint.quoteExactInputSingle(context);

			expect(sqrtPriceX96After).toBe('80018067294531553039351583520');
			expect(initializedTicksCrossed).toBe('0');
			expect(amountOut).toBe('9871');
		});

		it('should throw an error if param.tokenIn is not a valid token', async () => {
			const func = async () => {
				const param: QuoteExactInputSingleParams = {
					amountIn: '10000',
					tokenIn: 0 as any,
					tokenOut: tokens[1].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactInputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.tokenOut is not a valid token', async () => {
			const func = async () => {
				const param: QuoteExactInputSingleParams = {
					amountIn: '10000',
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: 0 as any,
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactInputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.amountIn is not a valid number string', async () => {
			const func = async () => {
				const param: QuoteExactInputSingleParams = {
					amountIn: 'notANumber',
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: tokens[1].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactInputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.fee is not a valid number string', async () => {
			const func = async () => {
				const param: QuoteExactInputSingleParams = {
					amountIn: '10000',
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: tokens[1].address.toString('hex'),
					fee: 0 as any,
					sqrtPriceLimitX96: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactInputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.sqrtPriceLimitX96 is not a valid number string', async () => {
			const func = async () => {
				const param: QuoteExactInputSingleParams = {
					amountIn: '10000',
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: tokens[1].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96: 0 as any,
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactInputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('quoteExactOutput', () => {
		it('should quote exact output', async () => {
			const param: QuoteExactOutputParams = {
				amountOut: '9871',
				path: encodePath([tokens[1].address, tokens[2].address], [FeeAmount.MEDIUM]).toString(
					'hex',
				),
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } =
				await endpoint.quoteExactOutput(context);

			expect(sqrtPriceX96AfterList).toHaveLength(1);
			expect(sqrtPriceX96AfterList[0]).toBe('80018020393569259756601362385');
			expect(initializedTicksCrossedList[0]).toBe('0');
			expect(amountIn).toBe('10000');
		});

		it('should throw an error if param.path is not a string', async () => {
			const func = async () => {
				const param: QuoteExactOutputParams = { amountOut: '9871', path: 0 as any };
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactOutput(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.amountOut is not a numberstring', async () => {
			const func = async () => {
				const param: QuoteExactOutputParams = { amountOut: 'notANumber', path: '00000000' };
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactOutput(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('quoteExactOutputSingle', () => {
		it('should quote exact output single', async () => {
			const param: QuoteExactOutputSingleParams = {
				amount: '9871',
				tokenIn: tokens[2].address.toString('hex'),
				tokenOut: tokens[1].address.toString('hex'),
				fee: FeeAmount.MEDIUM,
				sqrtPriceLimitX96: '0',
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const { amountIn, sqrtPriceX96After, initializedTicksCrossed } =
				await endpoint.quoteExactOutputSingle(context);

			expect(sqrtPriceX96After).toBe('80018020393569259756601362385');
			expect(initializedTicksCrossed).toBe('0');
			expect(amountIn).toBe('10000');
		});

		it('should throw an error if param.tokenIn is not a valid token', async () => {
			const func = async () => {
				const param: QuoteExactOutputSingleParams = {
					amount: '9871',
					tokenIn: 0 as any,
					tokenOut: tokens[1].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactOutputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.tokenOut is not a valid token', async () => {
			const func = async () => {
				const param: QuoteExactOutputSingleParams = {
					amount: '9871',
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: 0 as any,
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactOutputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.amount is not a valid number string', async () => {
			const func = async () => {
				const param: QuoteExactOutputSingleParams = {
					amount: 'notANumber',
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: tokens[1].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactOutputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.fee is not a valid number string', async () => {
			const func = async () => {
				const param: QuoteExactOutputSingleParams = {
					amount: '9871',
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: tokens[1].address.toString('hex'),
					fee: 0 as any,
					sqrtPriceLimitX96: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactOutputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.sqrtPriceLimitX96 is not a valid number string', async () => {
			const func = async () => {
				const param: QuoteExactOutputSingleParams = {
					amount: '9871',
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: tokens[1].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96: 0 as any,
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.quoteExactOutputSingle(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('getPool', () => {
		it('should get pool json', async () => {
			const param: GetPoolParams = {
				tokenA: tokens[1].address.toString('hex'),
				tokenB: tokens[2].address.toString('hex'),
				fee: FeeAmount.MEDIUM,
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const res = await endpoint.getPool(context);

			expect(res).toStrictEqual(
				serializer({
					...pool.toJSON(),
					address: pool.address,
					collectionId: pool.collectionId,
					lisk32: pool.lisk32,
				}),
			);
		});

		it('should throw an error if param.tokenA is not a token address', async () => {
			const func = async () => {
				const param: GetPoolParams = {
					tokenA: 0 as any,
					tokenB: tokens[2].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getPool(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.tokenB is not a token address', async () => {
			const func = async () => {
				const param: GetPoolParams = {
					tokenA: tokens[1].address.toString('hex'),
					tokenB: 0 as any,
					fee: FeeAmount.MEDIUM,
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getPool(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.fee is not a number string', async () => {
			const func = async () => {
				const param: GetPoolParams = {
					tokenA: tokens[1].address.toString('hex'),
					tokenB: tokens[2].address.toString('hex'),
					fee: 0 as any,
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getPool(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('getPosition', () => {
		it('should get position', async () => {
			const param: GetPositionParams = {
				poolAddress: pool.address.toString('hex'),
				tokenId: '0',
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const res = await endpoint.getPosition(context);

			expect(res).toStrictEqual({
				token0: '0000000000000003',
				token1: '0000000000000002',
				fee: '3000',
				tickLower: '-887220',
				tickUpper: '887220',
				liquidity: '1000000',
				feeGrowthInside0LastX128: '0',
				feeGrowthInside1LastX128: '0',
				tokensOwed0: '0',
				tokensOwed1: '0',
				value: {
					principal0: '999999',
					principal1: '999999',
					fees0: '0',
					fees1: '0',
				},
			});
		});

		it('should throw an error if param.poolAddress is not a address', async () => {
			const func = async () => {
				const param: GetPositionParams = {
					poolAddress: 0 as any,
					tokenId: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getPosition(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.tokenId is not a number string', async () => {
			const func = async () => {
				const param: GetPositionParams = {
					poolAddress: pool.address.toString('hex'),
					tokenId: 'notANumber',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getPosition(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('getTokenURI', () => {
		it('should get token uri', async () => {
			const param: GetTokenURIParams = {
				poolAddress: pool.address.toString('hex'),
				tokenId: '0',
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const res = await endpoint.getTokenURI(context);

			expect(res).toStrictEqual({
				tokenURI: 'ipfs://bafkreihvzu6qrsfxpzsetiwtovwnkpckzodquip26c3heaxqkp5jmxl4de',
			});
		});

		it('should throw an error if param.poolAddress is not a address', async () => {
			const func = async () => {
				const param: GetTokenURIParams = {
					poolAddress: 0 as any,
					tokenId: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getTokenURI(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.tokenId is not a number string', async () => {
			const func = async () => {
				const param: GetTokenURIParams = {
					poolAddress: pool.address.toString('hex'),
					tokenId: 'notANumber',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getTokenURI(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('getMetadata', () => {
		it('should get token metadata', async () => {
			const param: GetMetadataParams = {
				poolAddress: pool.address.toString('hex'),
				tokenId: '0',
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const res = await endpoint.getMetadata(context);

			expect(res).toMatchSnapshot();
		});

		it('should throw an error if param.poolAddress is not a address', async () => {
			const func = async () => {
				const param: GetMetadataParams = {
					poolAddress: 0 as any,
					tokenId: '0',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getMetadata(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.tokenId is not a number string', async () => {
			const func = async () => {
				const param: GetMetadataParams = {
					poolAddress: pool.address.toString('hex'),
					tokenId: 'notANumber',
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.getMetadata(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});

	describe('observe', () => {
		it('should observe correctly', async () => {
			const param: ObserveParams = {
				poolAddress: pool.address.toString('hex'),
				secondsAgos: ['0'],
			};
			context = testing.createTransientModuleEndpointContext({ stateStore, params: param as any });
			const res = await endpoint.observe(context);

			expect(res.tickCumulatives).toStrictEqual(['0']);
		});

		it('should throw an error if param.poolAddress is not a address', async () => {
			const func = async () => {
				const param: ObserveParams = {
					poolAddress: 0 as any,
					secondsAgos: ['0'],
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.observe(context);
			};
			await expect(func()).rejects.toThrow();
		});

		it('should throw an error if param.secondsAgos items is not a number string', async () => {
			const func = async () => {
				const param: ObserveParams = {
					poolAddress: pool.address.toString('hex'),
					secondsAgos: ['notANumber'],
				};
				context = testing.createTransientModuleEndpointContext({
					stateStore,
					params: param as any,
				});
				await endpoint.observe(context);
			};
			await expect(func()).rejects.toThrow();
		});
	});
});
