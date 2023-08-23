import { IJSONRPCData, JSONRPCRequestData, getNotifications } from "@open-rpc/client-js/src/Request";
import { Transport } from "@open-rpc/client-js/build/transports/Transport";

/**
 * Temporary file until this is merged into @open-rpc/client-js
 * See: https://github.com/FurqanSoftware/codemirror-languageserver/issues/20
 */

export class PostMessageWorkerTransport extends Transport {
	public postMessageID: string;

	constructor(readonly worker: Worker) {
		super();
		this.postMessageID = `post-message-transport-${Math.random()}`;
	}

	private messageHandler = (ev: MessageEvent) => {
		this.transportRequestManager.resolveResponse(JSON.stringify(ev.data));
	};

	connect() {
		return new Promise<void>(async (resolve, _reject) => {
			this.worker.addEventListener("message", this.messageHandler);
			resolve();
		});
	}

	public close(): void {
		this.worker.terminate();
	}

	public async sendData(data: JSONRPCRequestData, _timeout: number | null = 5000): Promise<any> {
		const prom = this.transportRequestManager.addRequest(data, null);
		const notifications = getNotifications(data);
		if (this.worker) {
			this.worker.postMessage((data as IJSONRPCData).request);
			this.transportRequestManager.settlePendingRequest(notifications);
		}
		return prom;
	}
}