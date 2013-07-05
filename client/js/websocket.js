/**************************************************
 * websocket.js
 *
 * This file configures the basic settings for the 
 * websocket object.
 *************************************************/
websocket = { 
	
	status: "Not connected",
	lastError: "",
	messageCallback: {}, 
	connectionCallback: {},
	discnnectCallback: {},
	socket: {},
	protocol: "multisnake-protocol",
	
	Init: function(connectionCallback, messageCallback, disconnectCallback) {
		this.connectionCallback = connectionCallback;
		this.messageCallback = messageCallback;
		this.disconnectCallback = disconnectCallback;
	},
	
	Status: function(msg) {
	
		this.status = msg;
		console.log(msg);
		
	},
	
	//Basic text sending function
	SendData: function(text) {
		if(this.status == "Connected") {
			this.socket.send(text);
		}
	},
	
	SocketOpen: function(event) {
		this.Status("Connected");
		this.connectionCallback();
	},
	
	SocketMessage: function(event) {
		this.messageCallback(event.data);
	},
	
	SocketError: function(event) {
		this.Status("Error");
		this.lastError = event;
	},
	
	SocketClose: function(event) {
		if(this.status == "Connecting") {
			this.Status("Timeout");
		}
		else {
			this.Status("Disconnected");
		}
		this.disconnectCallback();
	},
	
	Connect: function(url,port) {
		
		try {
			websocket.Status("Connecting");
			websocket.socket = new WebSocket("ws://" + url + ":" + port, websocket.protocol);
		}
		catch(e) {
			console.log("Error when connecting " + e);
		}
		
		//Add the events
		websocket.bindEvent(websocket.socket, "open", function(event) {
		//websocket.socket.addEventListener("open", function(event) {
			websocket.SocketOpen(event);
		});
		
		websocket.bindEvent(websocket.socket, "message", function(event) {
		//websocket.socket.addEventListener("message", function(event) {
			websocket.SocketMessage(event);
		});
		
		websocket.bindEvent(websocket.socket, "error", function(event) {
		//websocket.socket.addEventListener("error", function(event) {
			websocket.SocketError(event);
		});

		websocket.bindEvent(websocket.socket, "close", function(event) {
		//websocket.socket.addEventListener("close", function(event) {
			websocket.SocketClose(event);
		});
		
	},
	
	bindEvent: function(el, eventName, eventHandler) {
		if (el.addEventListener){
			el.addEventListener(eventName, eventHandler, false); 
		} else if (el.attachEvent){
			el.attachEvent('on'+eventName, eventHandler);
		}
	}
	
}