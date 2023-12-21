export const getConfigEndpointResponseSchema = {
	$id: '/dex/endpoint/response/get_config',
	type: 'object',
	required: [
		'feeAmountTickSpacing',
		'feeProtocol',
		'feeProtocolPool',
		'feeConversionEnabled',
		'supportAllTokens',
		'minTransactionFee',
	],
	properties: {
		feeAmountTickSpacing: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'array',
				items: {
					dataType: 'string',
				},
			},
		},
		feeProtocol: {
			dataType: 'uint32',
			fieldNumber: 2,
		},
		feeProtocolPool: {
			dataType: 'string',
			fieldNumber: 3,
		},
		feeConversionEnabled: {
			dataType: 'boolean',
			fieldNumber: 4,
		},
		supportAllTokens: {
			dataType: 'boolean',
			fieldNumber: 5,
		},
		minTransactionFee: {
			type: 'object',
			fieldNumber: 6,
			required: [
				'createPool',
				'mint',
				'burn',
				'collect',
				'increaseLiquidity',
				'decreaseLiquidity',
				'exactInput',
				'exactInputSingle',
				'exactOutput',
				'exactOutputSingle',
				'treasurify',
			],
			properties: {
				createPool: {
					dataType: 'string',
					fieldNumber: 1,
				},
				mint: {
					dataType: 'string',
					fieldNumber: 2,
				},
				burn: {
					dataType: 'string',
					fieldNumber: 3,
				},
				collect: {
					dataType: 'string',
					fieldNumber: 4,
				},
				increaseLiquidity: {
					dataType: 'string',
					fieldNumber: 5,
				},
				decreaseLiquidity: {
					dataType: 'string',
					fieldNumber: 6,
				},
				exactInput: {
					dataType: 'string',
					fieldNumber: 7,
				},
				exactInputSingle: {
					dataType: 'string',
					fieldNumber: 8,
				},
				exactOutput: {
					dataType: 'string',
					fieldNumber: 9,
				},
				exactOutputSingle: {
					dataType: 'string',
					fieldNumber: 10,
				},
				treasurify: {
					dataType: 'string',
					fieldNumber: 11,
				},
			},
		},
	},
};

export const getConfigEndpointRequestSchema = {
	$id: '/dex/endpoint/request/get_config',
	type: 'object',
	required: [],
	properties: {},
};
