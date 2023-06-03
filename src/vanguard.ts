import { EventSource, TypedEventEmitter } from './event'
import type { SigMessage, SigChanEvents, SigChannel } from './signaling'
import type { PeerEvents, Peer } from './peer'

type Muxed = {
	port: number;
}

type CtrlMessage
	= { kind: 'closing' }
	| { kind: 'close-ack' }
	| { kind: 'connect' } & Muxed
	| { kind: 'accept' } & Muxed
	| { kind: 'reject' } & Muxed
	| { kind: 'signal' } & Muxed & { message: SigMessage }

type CtrlChanEvents
	= { [K in CtrlMessage['kind']]: (message: Omit<Extract<CtrlMessage, { 'kind': K }>, 'kind'>) => void }
	& { 'close': () => void }

class CtrlChan extends EventSource<CtrlChanEvents> {
	#chan: RTCDataChannel
	#queue: string[] = []

	constructor(chan: RTCDataChannel) {
		super()
		this.#chan = chan
		chan.addEventListener('open', () => {
			this.flush()
		})
		chan.addEventListener('close', () => this.emit('close'))
		chan.addEventListener('message', ({ data }: MessageEvent) => {
			if (typeof data !== 'string') {
				return
			}

			// TODO: validate
			const { kind, ...message } = JSON.parse(data)
			this.emit(kind, message)
		})
	}

	send(message: CtrlMessage): void {
		if (this.#chan.readyState === 'connecting') {
			this.#queue.push(JSON.stringify(message))
			return
		}

		this.flush()
		this.#chan.send(JSON.stringify(message))
	}

	close(): void {
		this.#chan.close()
	}

	get closed(): boolean {
		return this.#chan.readyState === 'closed'
	}

	flush(): void {
		for (const message of this.#queue) {
			this.#chan.send(message)
		}

		this.#queue.length = 0
	}
}

class VanguardChan extends TypedEventEmitter<SigChanEvents> implements SigChannel {
	#ctrl: CtrlChan
	#port: number
	#is_closed = false

	constructor(ctrl: CtrlChan, port: number) {
		super()
		this.#ctrl = ctrl
		this.#port = port
	}

	send(message: SigMessage): void {
		this.#ctrl.send({ kind: 'signal', port: this.#port, message })
	}

	close(): void {
		if (this.#is_closed) {
			return
		}

		this.#is_closed = true
	}

	get closed(): boolean {
		return this.#is_closed
	}
}

class SignalingServer extends EventSource<Pick<PeerEvents, 'offer'>> {
	#ctrl: CtrlChan
	#channels = new Map<number, VanguardChan>()

	constructor(ctrl: CtrlChan) {
		super()
		this.#ctrl = ctrl

		ctrl.on('connect', ({ port }) => {
			if (this.#channels.has(port)) {
				ctrl.send({ kind: 'reject', port })
				return
			}

			ctrl.send({ kind: 'accept', port })

			const channel = new VanguardChan(this.#ctrl, port)
			channel.once('close', () => {
				this.#channels.delete(port)
			})

			this.#channels.set(port, channel)
			this.emit('offer', channel)
		})
		ctrl.on('signal', ({ port, message }) => {
			const channel = this.#channels.get(port)
			if (channel === undefined) {
				return
			}

			// TODO: I think it is safe, but how to conform?
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			channel.emit(message.kind, message)
		})
	}

	async offer(conn: RTCPeerConnection): Promise<Peer> {
		return offer(conn, await this.createChannel())
	}

	async createChannel(): Promise<SigChannel> {
		while (!this.#ctrl.closed) {
			const port = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
			if (this.#channels.has(port)) {
				continue
			}

			const channel = new VanguardChan(this.#ctrl, port)
			this.#channels.set(port, channel)

			this.#ctrl.send({ kind: 'connect', port })
			try {
				await new Promise<void>((resolve, reject) => {
					const ctrl = this.#ctrl
					ctrl.on('accept', function h(response) {
						if (response.port !== port) {
							return
						}

						ctrl.off('accept', h)
						resolve()
					})
					ctrl.on('reject', function h(response) {
						if (response.port !== port) {
							return
						}

						ctrl.off('reject', h)
						reject()
					})
				})
			} catch {
				this.#channels.delete(port)
				continue
			}

			channel.once('close', () => {
				this.#channels.delete(port)
			})

			return channel
		}

		throw new Error('control channel closed')
	}
}

class Vanguard extends EventSource<PeerEvents> implements Peer {
	#conn: RTCPeerConnection
	#ctrl: CtrlChan
	#server: SignalingServer

	constructor(conn: RTCPeerConnection, ctrl: RTCDataChannel) {
		super()
		this.#conn = conn
		this.#ctrl = new CtrlChan(ctrl)
		this.#server = new SignalingServer(this.#ctrl)

		this.#ctrl.once('closing', () => {
			this.#ctrl.send({ kind: 'close-ack' })

			this.#conn.close()
			this.emit('close')
		})

		this.#server.on('offer', channel => {
			if (!this.emit('offer', channel)) {
				// Reject will cause endless offer from remote peer since the current implementation
				// keeps trying to offer until it is accepted.
				console.warn('offer ignored')
				window.setTimeout(() => {
					channel.close()
				}, 3000)
			}
		})
	}

	async offer(conn: RTCPeerConnection): Promise<Peer> {
		return this.#server.offer(conn)
	}

	get conn(): RTCPeerConnection {
		return this.#conn
	}

	async close(): Promise<void> {
		if (this.closed) {
			return
		}

		this.#ctrl.send({ kind: 'closing' })
		await new Promise<void>(resolve => {
			window.setTimeout(() => {
				resolve()
			}, 5000) // ACK loss?
			this.once('close', () => {
				resolve()
			}) // Closed by another close or remote closing event.
			this.#ctrl.once('close', () => {
				resolve()
			}) // Underlying data channel is closed; abnormal.
			this.#ctrl.once('close-ack', () => {
				resolve()
			}) // Perfect close.
		})

		this.#conn.close()
		this.emit('close')
	}

	get closed(): boolean {
		return this.#conn.connectionState === 'closed' || this.#ctrl.closed
	}
}

const CtrlChanLabel = '_vanguard'
const CtrlChanId = 0

function createCtrlChannel(conn: RTCPeerConnection): RTCDataChannel {
	return conn.createDataChannel(CtrlChanLabel, {
		id: CtrlChanId,
		negotiated: true,
		ordered: true,
	})
}

function toError(error: unknown): Error {
	if (error instanceof Error) {
		return error
	}

	return new Error(String(error))
}

async function exchange(conn: RTCPeerConnection, sig: SigChannel): Promise<void> {
	return new Promise((resolve, reject) => {
		const abort = (error: Error) => {
			sig.send({ kind: 'abort', reason: error.message })
			reject(error)
			sig.close()
		}

		const handle_icecandidate = ({ candidate }: RTCPeerConnectionIceEvent) => {
			if (candidate === null) {
				return
			}

			sig.send({ kind: 'candidate', data: candidate })
		}

		const handle_connectionstatechange = () => {
			switch (conn.connectionState) {
				case 'closed': {
					abort(new Error('peer connection closed'))
					break
				}

				case 'failed': {
					abort(new Error('connection state failed'))
					break
				}

				case 'connected': {
					resolve()
					sig.close()
					break
				}

				default: {
					break
				}
			}
		}

		conn.addEventListener('icecandidate', handle_icecandidate)
		conn.addEventListener('connectionstatechange', handle_connectionstatechange)

		sig.once('close', () => {
			conn.removeEventListener('icecandidate', handle_icecandidate)
			conn.removeEventListener('connectionstatechange', handle_connectionstatechange)

			if (conn.connectionState !== 'connected') {
				reject(new Error('unexpected channel close'))
			}
		})
		sig.once('abort', ({ reason }) => {
			abort(new Error(reason))
		})
		sig.on('candidate', ({ data }) => {
			conn.addIceCandidate(data).catch(error => {
				// Warn
			})
		})
		sig.once('sdp', ({ data }) => {
			conn.setRemoteDescription(data).catch(error => {
				abort(toError(error))
			})
		})
	})
}

export async function dial(conn: RTCPeerConnection, sig: SigChannel, local: () => Promise<RTCSessionDescriptionInit>): Promise<Peer> {
	const chan_ctrl = createCtrlChannel(conn)
	const until_done = exchange(conn, sig)

	try {
		await conn.setLocalDescription(await local())
		const sdp = conn.localDescription
		if (sdp === null) {
			throw new Error('unexpected null value for local description')
		}

		sig.send({ kind: 'sdp', data: sdp })
	} catch (error: unknown) {
		sig.close()
		throw toError(error)
	}

	await until_done

	return new Vanguard(conn, chan_ctrl)
}

export async function offer(conn: RTCPeerConnection, sig: SigChannel): Promise<Peer> {
	return dial(conn, sig, async () => conn.createOffer())
}

export async function answer(conn: RTCPeerConnection, sig: SigChannel): Promise<Peer> {
	return dial(conn, sig, async () => new Promise((resolve, reject) => {
		sig.once('sdp', () => {
			conn.createAnswer().then(resolve).catch(reject)
		})
	}))
}
