export const tokenSymbolStoreSchema = {
	$id: '/dex/store/token_symbol',
	type: 'object',
	required: ['symbol', 'decimal'],
	properties: {
		symbol: {
			dataType: 'string',
			fieldNumber: 1,
		},
		decimal: {
			dataType: 'uint32',
			fieldNumber: 2,
		},
	},
};
