/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	BlockExecuteContext,
	CommandExecuteContext,
	CrossChainMessageContext,
	ImmutableMethodContext,
	MethodContext,
	ModuleEndpointContext,
	TransactionExecuteContext,
	TransactionVerifyContext,
} from 'lisk-sdk';
import { ImmutableFactoryContext, MutableFactoryContext } from '../../types';

export function commandFactoryContext(
	context: CommandExecuteContext<any>,
): MutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function mutableTransactionHookFactoryContext(
	context: TransactionExecuteContext,
): MutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function mutableBlockHookFactoryContext(
	context: BlockExecuteContext,
): MutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function immutableTransactionHookFactoryContext(
	context: TransactionVerifyContext,
): ImmutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function methodFactoryContext(
	context: MethodContext,
	senderAddress: Buffer,
	timestamp: number,
	height: number,
): MutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
		height,
	};
}

export function immutableMethodFactoryContext(
	context: ImmutableMethodContext,
	senderAddress: Buffer,
	timestamp: number,
	height: number,
): ImmutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
		height,
	};
}

export function endpointFactoryContext(
	context: ModuleEndpointContext,
): ImmutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function crossChainMethodFactoryContext(
	context: CrossChainMessageContext,
	senderAddress: Buffer,
): MutableFactoryContext<MethodContext> {
	return {
		context: context.getMethodContext(),
		senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}
