export class NFT {
	public owner: Buffer = Buffer.alloc(0);
	public attributesArray: { module: string; attributes: Buffer }[] = [];
}
