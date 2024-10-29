export const dryRunTransactionEndpointResponseSchema = {
	$id: '/feeConversion/endpoint/response/dry_run_transaction',
	type: 'object',
	required: ['status', 'data', 'errorMessage'],
	properties: {
		status: {
			fieldNumber: 1,
			dataType: 'string',
		},
		data: {
			fieldNumber: 2,
			type: 'object',
			required: ['moduleCommand', 'path', 'token', 'amount'],
			properties: {
				moduleCommand: {
					fieldNumber: 1,
					dataType: 'string',
				},
				path: {
					fieldNumber: 2,
					dataType: 'string',
				},
				token: {
					fieldNumber: 3,
					dataType: 'string',
				},
				amount: {
					fieldNumber: 4,
					dataType: 'string',
				},
			},
		},
		errorMessage: {
			fieldNumber: 3,
			dataType: 'string',
		},
	},
};

export const dryRunTransactionEndpointRequestSchema = {
	$id: '/feeConversion/endpoint/request/dry_run_transaction',
	type: 'object',
	required: ['transaction'],
	properties: {
		transaction: {
			fieldNumber: 1,
			format: 'hex',
			dataType: 'string',
		},
	},
};
