/**************************************************
 * webwebsocket.js
 *
 * Created to handle the setup and events thoughout
 * the server's lifetime.
 *************************************************/
  
var WebSocketServer = require('websocket').server;
var http = require('http');

websocket = {

	connectCallback: {}, messageCallback: {}, disconnectCallback: {},
	clients: new Array(),
	port: 8125,
	protocol: "multisnake-protocol",

	Init: function(connectCallback, messageCallback, disconnectCallback) {
		this.connectCallback = connectCallback;
		this.messageCallback = messageCallback;
		this.disconnectCallback = disconnectCallback;
	},
	
	OriginIsAllowed: function(origin) {
		// put logic here to detect whether the specified origin is allowed.
		return true;
	},

	FindClientByConnection: function(connection) {
		for(var i = 0; i < this.clients.length; i++) {
			if(this.clients[i] == connection) return i;
		}
	},
	
	FindClientByIndex: function(index) {
		return this.clients[index];
	},

	DisconnectClientByIndex: function(index) {
		this.clients[index].close();
	},
	
	DisconnectClient: function(connection) {
		var index = this.FindClientByConnection(connection);
		if(index >= 0) this.clients[index].close();
	},
	
	SendObject: function(index,text,object) {
		this.clients[index].send(text + "~" + JSON.stringify(object));
	},
	
	SendObjectToAll: function(text,object,exclude) {
		for(var i = 0; i < this.clients.length; i++) {
			if(i != exclude) {
				this.clients[i].send(text + "~" + JSON.stringify(object));
			}
		}
	},
	
	SendData: function(index,text) {
		this.clients[index].send(text);
	},
	
	SendDataToAll: function(text, exclude) {
		for(var i = 0; i < this.clients.length; i++) {
			if(i != exclude) {
				this.clients[i].send(text);
			}
		}
	}

}

//Create the server object 
var server = http.createServer(function(request, response) {
	response.writeHead(404);
	response.end();
});

server.listen(websocket.port, function() {});

wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

wsServer.on('request', function(request) {

	console.log("New connection accepted...");
	
	if (!websocket.OriginIsAllowed(request.origin)) {
		// Make sure we only accept requests from an allowed origin
		request.reject();
		console.log("Connection from origin " + request.origin + " rejected.");
		return;
	}
	
	//Accept the new connection 
	var connection = request.accept(websocket.protocol, request.origin);
	
	//Add the connection in
	websocket.clients.push(connection);
	websocket.connectCallback(websocket.FindClientByConnection(connection));
	
	connection.on('message', function(message) {
		var index = websocket.FindClientByConnection(connection);
		websocket.messageCallback(index, message.utf8Data);
	});
	
	connection.on('close', function(reasonCode, description) {
		var index = websocket.FindClientByConnection(connection);
		websocket.clients.splice(index,1);
		websocket.disconnectCallback(index);
	});
		
})

