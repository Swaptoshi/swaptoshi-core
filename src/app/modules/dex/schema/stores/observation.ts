export const observationStoreSchema = {
	$id: '/dex/store/observation',
	type: 'object',
	required: [
		'blockTimestamp',
		'tickCumulative',
		'secondsPerLiquidityCumulativeX128',
		'initialized',
	],
	properties: {
		blockTimestamp: {
			dataType: 'string',
			fieldNumber: 1,
		},
		tickCumulative: {
			dataType: 'string',
			fieldNumber: 2,
		},
		secondsPerLiquidityCumulativeX128: {
			dataType: 'string',
			fieldNumber: 3,
		},
		initialized: {
			dataType: 'boolean',
			fieldNumber: 4,
		},
	},
};
