/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modules, StateMachine, Types } from 'klayr-sdk';
import { ImmutableFactoryContext, MutableFactoryContext } from '../../types';

export function commandFactoryContext(context: StateMachine.CommandExecuteContext<any>): MutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function mutableTransactionHookFactoryContext(context: StateMachine.TransactionExecuteContext): MutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function mutableBlockHookFactoryContext(context: StateMachine.BlockExecuteContext): MutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function immutableTransactionHookFactoryContext(context: StateMachine.TransactionVerifyContext): ImmutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function methodFactoryContext(context: StateMachine.MethodContext, senderAddress: Buffer, timestamp: number, height: number): MutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
		height,
	};
}

export function immutableMethodFactoryContext(context: StateMachine.ImmutableMethodContext, senderAddress: Buffer, timestamp: number, height: number): ImmutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
		height,
	};
}

export function endpointFactoryContext(context: Types.ModuleEndpointContext): ImmutableFactoryContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}

export function crossChainMethodFactoryContext(context: Modules.Interoperability.CrossChainMessageContext, senderAddress: Buffer): MutableFactoryContext<StateMachine.MethodContext> {
	return {
		context: context.getMethodContext(),
		senderAddress,
		timestamp: context.header.timestamp.toString(),
		height: context.header.height,
	};
}
