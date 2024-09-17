/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { StateMachine, Modules, Types } from 'klayr-sdk';
import { ImmutableSwapContext, MutableSwapContext } from '../../types';

export function commandSwapContext(context: StateMachine.CommandExecuteContext<any>): MutableSwapContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
	};
}

export function mutableHookSwapContext(context: StateMachine.TransactionExecuteContext): MutableSwapContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
	};
}

export function immutableHookSwapContext(context: StateMachine.TransactionVerifyContext): ImmutableSwapContext<typeof context> {
	return {
		context,
		senderAddress: context.transaction.senderAddress,
		timestamp: context.header.timestamp.toString(),
	};
}

export function methodSwapContext(context: StateMachine.MethodContext, senderAddress: Buffer, timestamp: number): MutableSwapContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
	};
}

export function immutableMethodSwapContext(context: StateMachine.ImmutableMethodContext, senderAddress: Buffer, timestamp: number): ImmutableSwapContext<typeof context> {
	return {
		context,
		senderAddress,
		timestamp: timestamp.toString(),
	};
}

export function endpointSwapContext(context: Types.ModuleEndpointContext): ImmutableSwapContext<typeof context> {
	return {
		context,
		senderAddress: Buffer.alloc(0),
		timestamp: context.header.timestamp.toString(),
	};
}

export function crossChainMethodSwapContext(context: Modules.Interoperability.CrossChainMessageContext, senderAddress: Buffer): MutableSwapContext<StateMachine.MethodContext> {
	return {
		context: context.getMethodContext(),
		senderAddress,
		timestamp: context.header.timestamp.toString(),
	};
}
