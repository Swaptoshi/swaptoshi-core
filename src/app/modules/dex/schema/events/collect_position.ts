export const collectPositionEventSchema = {
	$id: '/dex/events/collect_position',
	type: 'object',
	required: ['tokenId', 'recipientAddress', 'amount0Collect', 'amount1Collect'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		recipientAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		amount0Collect: {
			dataType: 'string',
			fieldNumber: 3,
		},
		amount1Collect: {
			dataType: 'string',
			fieldNumber: 4,
		},
	},
};
