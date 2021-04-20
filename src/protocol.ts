import {Socket} from "dgram";

let dgram = require('dgram');

export default class U9UDPProtocol {
    private readonly callCommand: Buffer;
    private readonly unlockCommand: Buffer;

    constructor() {
        this.callCommand = Buffer.from("0654d6f84c00000000000000000000003032c6da3230b6b03034b5a5d4aa303332c6da3230b6b034b5a5d4aa33b2e337b7bf000000000000000000000000000003000000010000004001f000", "hex")
        this.unlockCommand = Buffer.from("0e4a009c4c00000000000000040000003032c6da3230b6b03034b5a5d4aa303332c6da3230b6b034b5a5d4aa33b2e337b7bf000000000000000000000000000003000000010000004001f000", "hex")
    }

    public listen() {

    }
    public unlock(ip: string, callback: () => void) {
        let client = dgram.createSocket('udp4');
        client.connect(7800, ip, () => {
            client.send(this.callCommand, (err) => {
                setTimeout(() => {
                    client.send(this.unlockCommand, (err) => {
                        callback();
                        client.close();
                    });
                }, 300);
            });
        });
    }
}


