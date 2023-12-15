import * as sqrtPriceMath from '../../../../../../../src/app/modules/dex/stores/library/core/sqrt_price_math';
import * as swapMath from '../../../../../../../src/app/modules/dex/stores/library/core/swap_math';

import { Int256, Uint, Uint256 } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { encodePriceSqrt } from '../../shared/utilities';

function expandTo18Decimals(n: number): Uint {
	return Uint.from(n).mul(Uint.from(10).pow(18));
}

describe('SwapMath', () => {
	describe('#computeSwapStep', () => {
		it('exact amount in that gets capped at price target in one for zero', () => {
			const price = encodePriceSqrt(1, 1).toString();
			const priceTarget = encodePriceSqrt(101, 100).toString();
			const liquidity = expandTo18Decimals(2).toString();
			const amount = expandTo18Decimals(1).toString();
			const fee = '600';
			const zeroForOne = false;

			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				price,
				priceTarget,
				liquidity,
				amount,
				fee,
			);

			expect(amountIn).toBe('9975124224178055');
			expect(feeAmount).toBe('5988667735148');
			expect(amountOut).toBe('9925619580021728');
			expect(Uint256.from(amountIn).add(feeAmount).lt(amount.toString())).toBe(true);

			const priceAfterWholeInputAmount = sqrtPriceMath.getNextSqrtPriceFromInput(
				price,
				liquidity,
				amount,
				zeroForOne,
			);

			expect(sqrtQ).toBe(priceTarget);
			expect(Uint256.from(sqrtQ).lt(priceAfterWholeInputAmount)).toBe(true);
		});

		it('exact amount out that gets capped at price target in one for zero', () => {
			const price = encodePriceSqrt(1, 1).toString();
			const priceTarget = encodePriceSqrt(101, 100).toString();
			const liquidity = expandTo18Decimals(2).toString();
			const amount = expandTo18Decimals(1).mul(-1).toString();
			const fee = '600';
			const zeroForOne = false;

			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				price,
				priceTarget,
				liquidity,
				amount,
				fee,
			);

			expect(amountIn).toBe('9975124224178055');
			expect(feeAmount).toBe('5988667735148');
			expect(amountOut).toBe('9925619580021728');
			expect(Uint256.from(amountOut).lt(Int256.from(amount).mul(-1))).toBe(true);

			const priceAfterWholeOutputAmount = sqrtPriceMath.getNextSqrtPriceFromOutput(
				price,
				liquidity,
				Int256.from(amount).mul(-1).toString(),
				zeroForOne,
			);

			expect(sqrtQ).toBe(priceTarget);
			expect(Uint256.from(sqrtQ).lt(priceAfterWholeOutputAmount)).toBe(true);
		});

		it('exact amount in that is fully spent in one for zero', () => {
			const price = encodePriceSqrt(1, 1).toString();
			const priceTarget = encodePriceSqrt(1000, 100).toString();
			const liquidity = expandTo18Decimals(2).toString();
			const amount = expandTo18Decimals(1).toString();
			const fee = '600';
			const zeroForOne = false;

			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				price,
				priceTarget,
				liquidity,
				amount,
				fee,
			);

			expect(amountIn).toBe('999400000000000000');
			expect(feeAmount).toBe('600000000000000');
			expect(amountOut).toBe('666399946655997866');
			expect(Uint256.from(amountIn).add(feeAmount).toString()).toBe(amount);

			const priceAfterWholeInputAmountLessFee = sqrtPriceMath.getNextSqrtPriceFromInput(
				price,
				liquidity,
				Uint256.from(amount).sub(feeAmount).toString(),
				zeroForOne,
			);

			expect(Uint256.from(sqrtQ).lt(priceTarget)).toBe(true);
			expect(sqrtQ).toBe(priceAfterWholeInputAmountLessFee);
		});

		it('exact amount out that is fully received in one for zero', () => {
			const price = encodePriceSqrt(1, 1).toString();
			const priceTarget = encodePriceSqrt(10000, 100).toString();
			const liquidity = expandTo18Decimals(2).toString();
			const amount = expandTo18Decimals(1).mul(-1).toString();
			const fee = '600';
			const zeroForOne = false;

			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				price,
				priceTarget,
				liquidity,
				amount,
				fee,
			);

			expect(amountIn).toBe('2000000000000000000');
			expect(feeAmount).toBe('1200720432259356');
			expect(amountOut).toBe(Int256.from(amount).mul(-1).toString());

			const priceAfterWholeOutputAmount = sqrtPriceMath.getNextSqrtPriceFromOutput(
				price,
				liquidity,
				Int256.from(amount).mul(-1).toString(),
				zeroForOne,
			);

			expect(Uint256.from(sqrtQ).lt(priceTarget)).toBe(true);
			expect(sqrtQ).toBe(priceAfterWholeOutputAmount);
		});

		it('amount out is capped at the desired amount out', () => {
			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				Uint.from('417332158212080721273783715441582').toString(),
				Uint.from('1452870262520218020823638996').toString(),
				'159344665391607089467575320103',
				'-1',
				'1',
			);
			expect(amountIn).toBe('1');
			expect(feeAmount).toBe('1');
			expect(amountOut).toBe('1'); // would be 2 if not capped
			expect(sqrtQ).toBe('417332158212080721273783715441581');
		});

		it('target price of 1 uses partial input amount', () => {
			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				Uint.from('2').toString(),
				Uint.from('1').toString(),
				'1',
				'3915081100057732413702495386755767',
				'1',
			);
			expect(amountIn).toBe('39614081257132168796771975168');
			expect(feeAmount).toBe('39614120871253040049813');
			expect(Uint256.from(amountIn).add(feeAmount).lte('3915081100057732413702495386755767')).toBe(
				true,
			);
			expect(amountOut).toBe('0');
			expect(sqrtQ).toBe('1');
		});

		it('entire input amount taken as fee', () => {
			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				'2413',
				'79887613182836312',
				'1985041575832132834610021537970',
				'10',
				'1872',
			);
			expect(amountIn).toBe('0');
			expect(feeAmount).toBe('10');
			expect(amountOut).toBe('0');
			expect(sqrtQ).toBe('2413');
		});

		it('handles intermediate insufficient liquidity in zero for one exact output case', () => {
			const sqrtP = Uint.from('20282409603651670423947251286016').toString();
			const sqrtPTarget = Uint256.from(sqrtP).mul(11).div(10).toString();
			const liquidity = '1024';
			// virtual reserves of one are only 4
			// https://www.wolframalpha.com/input/?i=1024+%2F+%2820282409603651670423947251286016+%2F+2**96%29
			const amountRemaining = '-4';
			const feePips = '3000';
			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				sqrtP,
				sqrtPTarget,
				liquidity,
				amountRemaining,
				feePips,
			);
			expect(amountOut).toBe('0');
			expect(sqrtQ).toBe(sqrtPTarget);
			expect(amountIn).toBe('26215');
			expect(feeAmount).toBe('79');
		});

		it('handles intermediate insufficient liquidity in one for zero exact output case', () => {
			const sqrtP = Uint.from('20282409603651670423947251286016').toString();
			const sqrtPTarget = Uint256.from(sqrtP).mul(9).div(10).toString();
			const liquidity = '1024';
			// virtual reserves of zero are only 262144
			// https://www.wolframalpha.com/input/?i=1024+*+%2820282409603651670423947251286016+%2F+2**96%29
			const amountRemaining = '-263000';
			const feePips = '3000';
			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(
				sqrtP,
				sqrtPTarget,
				liquidity,
				amountRemaining,
				feePips,
			);
			expect(amountOut).toBe('26214');
			expect(sqrtQ).toBe(sqrtPTarget);
			expect(amountIn).toBe('1');
			expect(feeAmount).toBe('1');
		});
	});
});
