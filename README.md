# Vanguard

Make extra connections from the existing connection.

## Usage

```ts
import { SigChannel, SigMessage, offer } from 'vanguard'

class MySigChannel implements SigChannel {
	send(message: SigMessage): void {
		// Implement it.
	}

	close(): void {
		// Implement it.
	}

	get closed(): boolean {
		// Implement it.
	}
}

async function connect() {
	// Initial connection with third-party signalling server.
	const conn = new RTCPeerConnection()
	const peer = await offer(conn, new MySigChannel())

	// Need extra connection?
	// Signaling through existing connection!
	const extra_conn = new RTCPeerConnection()
	const extra_peer = await peer.offer(extra_conn)
}
```

## TODO

- [ ] Provide `SigChannel` for PeerJS.
- [ ] Handle renegotiation.
