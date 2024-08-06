export function getBoostMultiplier(currentHeight: number, targetHeight: number, maxBoostDuration: number, boostFactor: number) {
	return 1 + ((targetHeight - currentHeight) / maxBoostDuration) * (boostFactor - 1);
}
