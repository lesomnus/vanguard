import type { Listenable } from './event'
import type { SigChannel } from './signaling'

export type PeerEvents = {
	'offer': (channel: SigChannel, label: string) => void;
	'close': () => void;
}

export type Peer = Listenable<PeerEvents> & {
	offer(conn: RTCPeerConnection, label?: string): Promise<Peer>;
	close(): Promise<void>;

	get closed(): boolean;
	get conn(): RTCPeerConnection;
}

