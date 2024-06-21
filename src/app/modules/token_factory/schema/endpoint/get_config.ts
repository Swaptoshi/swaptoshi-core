export const getConfigEndpointResponseSchema = {
	$id: '/tokenFactory/endpoint/response/getConfig',
	type: 'object',
	required: ['skippedTokenID', 'icoLeftOverAddress', 'icoFeeConversionEnabled', 'minTransactionFee', 'baseFee'],
	properties: {
		skippedTokenID: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'uint32',
			},
		},
		icoLeftOverAddress: {
			dataType: 'string',
			fieldNumber: 2,
		},
		icoFeeConversionEnabled: {
			dataType: 'boolean',
			fieldNumber: 3,
		},
		minTransactionFee: {
			type: 'object',
			fieldNumber: 4,
			properties: {
				factoryTransferOwnership: {
					dataType: 'string',
					fieldNumber: 1,
				},
				tokenCreate: {
					dataType: 'string',
					fieldNumber: 2,
				},
				tokenMint: {
					dataType: 'string',
					fieldNumber: 3,
				},
				tokenBurn: {
					dataType: 'string',
					fieldNumber: 4,
				},
				icoCreate: {
					dataType: 'string',
					fieldNumber: 5,
				},
				icoChangePrice: {
					dataType: 'string',
					fieldNumber: 6,
				},
				icoTreasurify: {
					dataType: 'string',
					fieldNumber: 7,
				},
				icoDeposit: {
					dataType: 'string',
					fieldNumber: 8,
				},
				icoWithdraw: {
					dataType: 'string',
					fieldNumber: 9,
				},
				icoExactInput: {
					dataType: 'string',
					fieldNumber: 10,
				},
				icoExactInputSingle: {
					dataType: 'string',
					fieldNumber: 11,
				},
				icoExactOutput: {
					dataType: 'string',
					fieldNumber: 12,
				},
				icoExactOutputSingle: {
					dataType: 'string',
					fieldNumber: 13,
				},
				airdropCreate: {
					dataType: 'string',
					fieldNumber: 14,
				},
				airdropEditRecipients: {
					dataType: 'string',
					fieldNumber: 15,
				},
				airdropDistribute: {
					dataType: 'string',
					fieldNumber: 16,
				},
			},
		},
		baseFee: {
			type: 'object',
			fieldNumber: 5,
			properties: {
				factoryTransferOwnership: {
					dataType: 'string',
					fieldNumber: 1,
				},
				tokenCreate: {
					dataType: 'string',
					fieldNumber: 2,
				},
				tokenMint: {
					dataType: 'string',
					fieldNumber: 3,
				},
				tokenBurn: {
					dataType: 'string',
					fieldNumber: 4,
				},
				icoCreate: {
					dataType: 'string',
					fieldNumber: 5,
				},
				icoChangePrice: {
					dataType: 'string',
					fieldNumber: 6,
				},
				icoTreasurify: {
					dataType: 'string',
					fieldNumber: 7,
				},
				icoDeposit: {
					dataType: 'string',
					fieldNumber: 8,
				},
				icoWithdraw: {
					dataType: 'string',
					fieldNumber: 9,
				},
				icoExactInput: {
					dataType: 'string',
					fieldNumber: 10,
				},
				icoExactInputSingle: {
					dataType: 'string',
					fieldNumber: 11,
				},
				icoExactOutput: {
					dataType: 'string',
					fieldNumber: 12,
				},
				icoExactOutputSingle: {
					dataType: 'string',
					fieldNumber: 13,
				},
				airdropCreate: {
					dataType: 'string',
					fieldNumber: 14,
				},
				airdropEditRecipients: {
					dataType: 'string',
					fieldNumber: 15,
				},
				airdropDistribute: {
					dataType: 'string',
					fieldNumber: 16,
				},
			},
		},
	},
};

export const getConfigEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/getConfig',
	type: 'object',
	required: [],
	properties: {},
};
