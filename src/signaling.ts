import { EventEmitter } from 'events'
import { type Listenable, EventSource } from './event'

export type SigMessage
	= { kind: 'abort'; reason: string }
	| { kind: 'sdp'; data: RTCSessionDescription }
	| { kind: 'candidate'; data: RTCIceCandidate }

export type SigChanEvents = {
	[K in SigMessage['kind']]: (message: Extract<SigMessage, { 'kind': K }>) => void
} & {
	'close': () => void;
}

export type SigChannel = Listenable<SigChanEvents> & {
	send(message: SigMessage): void;
	close(): void;

	get closed(): boolean;
}

class IntraSigChan extends EventSource<SigChanEvents> implements SigChannel {
	#remote: EventEmitter
	#is_closed = false

	constructor(local: EventEmitter, remote: EventEmitter) {
		super(local)
		this.#remote = remote
	}

	send(message: SigMessage): void {
		if (this.#is_closed) {
			return
		}

		this.#remote.emit(message.kind, message)
	}

	close(): void {
		this.#is_closed = true
		this.emit('close')
	}

	get closed() {
		return this.#is_closed
	}
}

export function duplex(): [SigChannel, SigChannel] {
	const tx = new EventEmitter()
	const rx = new EventEmitter()

	return [
		new IntraSigChan(tx, rx),
		new IntraSigChan(rx, tx),
	]
}
