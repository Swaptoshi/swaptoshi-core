export const tokenRegisteredEventSchema = {
	$id: '/dex/events/token_registered',
	type: 'object',
	required: ['tokenId', 'symbol', 'decimal'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		symbol: {
			dataType: 'string',
			fieldNumber: 2,
		},
		decimal: {
			dataType: 'uint32',
			fieldNumber: 3,
		},
	},
};
