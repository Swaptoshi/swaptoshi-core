export function getBoostMultiplier(currentHeight: number, targetHeight: number, maxBoostDuration: number, boostFactor: number) {
	return 1 + Math.max(0, (targetHeight - currentHeight) / maxBoostDuration) * (boostFactor / 100 - 1);
}
