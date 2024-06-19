import { GetPoolAddressFromCollectionIdParams } from '../../../types';
import { verifyCollectionId } from '../base';

export function verifyGetPoolAddressFromCollectionIdParam(params: GetPoolAddressFromCollectionIdParams) {
	verifyCollectionId('collectionId', Buffer.from(params.collectionId, 'hex'));
}
