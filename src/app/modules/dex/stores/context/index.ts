/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	CommandExecuteContext,
	CrossChainMessageContext,
	ImmutableMethodContext,
	MethodContext,
	ModuleEndpointContext,
	TransactionExecuteContext,
	TransactionVerifyContext,
} from 'lisk-sdk';
import { ImmutableSwapContext, MutableSwapContext } from '../../types';

export function commandSwapContext(
	context: CommandExecuteContext<any>,
): MutableSwapContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
	};
}

export function mutableHookSwapContext(
	context: TransactionExecuteContext,
): MutableSwapContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
	};
}

export function immutableHookSwapContext(
	context: TransactionVerifyContext,
): ImmutableSwapContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
	};
}

export function methodSwapContext(
	context: MethodContext,
	senderAddress: Buffer,
	timestamp: number,
): MutableSwapContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
	};
}

export function immutableMethodSwapContext(
	context: ImmutableMethodContext,
	senderAddress: Buffer,
	timestamp: number,
): ImmutableSwapContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
	};
}

export function endpointSwapContext(
	context: ModuleEndpointContext,
): ImmutableSwapContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		timestamp: context.header.timestamp.toString(),
	};
}

export function crossChainMethodSwapContext(
	context: CrossChainMessageContext,
	senderAddress: Buffer,
): MutableSwapContext<MethodContext> {
	return {
		context: context.getMethodContext(),
		senderAddress,
		timestamp: context.header.timestamp.toString(),
	};
}
