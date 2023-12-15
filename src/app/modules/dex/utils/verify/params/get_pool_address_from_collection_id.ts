import { GetPoolAddressFromCollectionIdParams } from '../../../types/params/get_pool_address_from_collection_id';
import { verifyCollectionId } from '../base';

export function verifyGetPoolAddressFromCollectionIdParam(
	params: GetPoolAddressFromCollectionIdParams,
) {
	verifyCollectionId('collectionId', Buffer.from(params.collectionId, 'hex'));
}
