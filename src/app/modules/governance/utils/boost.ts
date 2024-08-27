export function getBoostMultiplier(currentHeight: number, targetHeight: number, maxBoostDuration: number, boostFactor: number) {
	return 1 + Math.max(0, (targetHeight - currentHeight) / maxBoostDuration) * Math.max(0, boostFactor / 100 - 1);
}
