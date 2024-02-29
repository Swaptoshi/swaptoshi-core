export const airdropCreatedEventSchema = {
	$id: '/tokenFactory/events/airdropCreated',
	type: 'object',
	required: ['tokenId', 'providerAddress'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		providerAddress: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
	},
};
