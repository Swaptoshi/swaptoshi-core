const CHAIN_ID_LENGTH = 4;
const LOCAL_ID_LENGTH = 4;
const MAX_DATA_LENGTH = 64;
const TOKEN_ID_LENGTH = CHAIN_ID_LENGTH + LOCAL_ID_LENGTH;

export const tokenTransferParamsSchema = {
	/** The unique identifier of the schema. */
	$id: '/lisk/transferParams',
	/** Schema title */
	title: 'Transfer transaction params',
	type: 'object',
	/** The required parameters for the command. */
	required: ['tokenID', 'amount', 'recipientAddress', 'data'],
	/** A list describing the available parameters for the command. */
	properties: {
		/**
		 * ID of the tokens being transferred.
		 * `minLength` and `maxLength` are {@link TOKEN_ID_LENGTH}.
		 */
		tokenID: {
			dataType: 'bytes',
			fieldNumber: 1,
			minLength: TOKEN_ID_LENGTH,
			maxLength: TOKEN_ID_LENGTH,
		},
		/** Amount of tokens to be transferred in Beddows. */
		amount: {
			dataType: 'uint64',
			fieldNumber: 2,
		},
		/** Address of the recipient. */
		recipientAddress: {
			dataType: 'bytes',
			fieldNumber: 3,
			format: 'klayr32',
		},
		/** Optional field for data / messages.
		 *
		 * `maxLength` is {@link MAX_DATA_LENGTH}.
		 * */
		data: {
			dataType: 'string',
			fieldNumber: 4,
			minLength: 0,
			maxLength: MAX_DATA_LENGTH,
		},
	},
};

export const crossChainTokenTransferMessageParams = {
	/** The unique identifier of the schema. */
	$id: '/lisk/ccTransferMessageParams',
	type: 'object',
	/** The required parameters for the command. */
	required: ['tokenID', 'amount', 'senderAddress', 'recipientAddress', 'data'],
	/** A list describing the available parameters for the CCM. */
	properties: {
		/**
		 * ID of the tokens being transferred.
		 * `minLength` and `maxLength` are {@link TOKEN_ID_LENGTH}.
		 */
		tokenID: {
			dataType: 'bytes',
			fieldNumber: 1,
			minLength: TOKEN_ID_LENGTH,
			maxLength: TOKEN_ID_LENGTH,
		},
		/** Amount of tokens to be transferred in Beddows. */
		amount: {
			dataType: 'uint64',
			fieldNumber: 2,
		},
		/** Address of the sender. */
		senderAddress: {
			dataType: 'bytes',
			fieldNumber: 3,
			format: 'klayr32',
		},
		/** Address of the recipient. */
		recipientAddress: {
			dataType: 'bytes',
			fieldNumber: 4,
			format: 'klayr32',
		},
		/** Optional field for data / messages.
		 *
		 * `minLength is `0`.
		 * `maxLength` is {@link MAX_DATA_LENGTH}.
		 */
		data: {
			dataType: 'string',
			fieldNumber: 5,
			minLength: 0,
			maxLength: MAX_DATA_LENGTH,
		},
	},
};
