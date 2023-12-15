export const observeEndpointResponseSchema = {
	$id: '/dex/endpoint/response/observe',
	type: 'object',
	required: ['tickCumulatives', 'secondsPerLiquidityCumulativeX128s'],
	properties: {
		tickCumulatives: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'string',
			},
		},
		secondsPerLiquidityCumulativeX128s: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'string',
			},
		},
	},
};

export const observeEndpointRequestSchema = {
	$id: '/dex/endpoint/request/observe',
	type: 'object',
	required: ['poolAddress', 'secondsAgos'],
	properties: {
		poolAddress: {
			dataType: 'string',
			fieldNumber: 1,
		},
		secondsAgos: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'string',
			},
		},
	},
};
