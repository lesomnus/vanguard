import type { Listenable } from './event'
import type { SigChannel } from './signaling'

export type PeerEvents = {
	'offer': (channel: SigChannel) => void;
	'close': () => void;
}

export type Peer = Listenable<PeerEvents> & {
	offer(conn: RTCPeerConnection): Promise<Peer>;
	close(): Promise<void>;

	get closed(): boolean;
	get conn(): RTCPeerConnection;
}

