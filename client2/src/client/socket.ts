class Socket {
    host: string
    conn: WebSocket

    constructor(host: string) {
        this.host = host
    }

    start(): void {
        this.conn = new WebSocket("ws://" + document.location.host + "/ws");
  
        this.conn.onopen = function(evt) {
            console.log("Connected")
        }
    }
}