export const treasuryMintEventSchema = {
	$id: '/governance/events/treasury_mint',
	type: 'object',
	required: ['amount'],
	properties: {
		amount: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
	},
};
