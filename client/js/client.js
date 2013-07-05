/**************************************************
 * client.js
 *
 * The main javascript for the multi-snake game.
 *************************************************/
//Custom player information
var name = "";
var colour = "";

//Game data
var running = true;
var port = "8125";
var gridSize = 500;
var gameSpeed = 500;
var foodScore = 15;
var killScore = 50;
var players = new Array();
var foodColour = "#ffffff";
var powerUpColour = "#ffff00";

//Webpage elements
var tblPlayers;
var main;

//An array of keys which the user can send
var keys = [	
	[0,38,87],
	[1,40,83],
	[2,37,65],
	[3,39,68]
];

function Main() {
	
	//Update the display of the clients
	for(var i = 0; i < players.length; i++){
		if(players[i].alive) {
			players[i].time += gameSpeed/1000;
			graphics.UpdatePlayer(players[i]);
		}
	}

}

function ConnectToServer(url, n, c) {

	//Attempt to connect	
	//graphics.Init(document.getElementById("canvas"),gridSize,gridSize);
	websocket.Init(OnConnect, OnMessage, OnDisconnect);
	name = n;
	colour = c;
	websocket.Connect(url, port);
	
	//Gather the webpage elements
	tblPlayers = document.getElementById("tblPlayers");
	
	//Start the main loop
	main = setInterval(function(){Main()},gameSpeed);
	
}

function GetPlayerInfo(name) {

	var player = GetPlayerByName(name);
	
	if(typeof(player) !== "undefined") {
		//Return the information in a nice package
		var result = "<p class='tooltipName'>" + player.name + "</p>";
		result += "<p><strong>Score: </strong>" + player.score + " points</p>";
		result += "<p><strong>Length: </strong>" + player.body.length + "</p>";
		result += "<p><strong>Kills: </strong>" + player.kills + "</p>";
		result += "<p><strong>Deaths: </strong>" + player.deaths + "</p>";
		if(player.time > 60) {
			var secs = Math.round(player.time % 60);
			var mins = Math.round(player.time/60);
			result += "<p><strong>Time alive: </strong>" + mins + "m " + secs + "s</p>";
		}
		else{
			result += "<p><strong>Time alive: </strong>" + Math.round(player.time) + "s</p>";
		}
		
		return result;
	}
	
	return "";

}

function GetPlayerByName(name) {

	//Loop through the players
	for(var i = 0; i < players.length; i++) {
		if(name.toUpperCase() == players[i].name.toUpperCase()) {
			return players[i];
		}
	}

}

function AddPlayer(index, data) {
	
	//Add the player into our array (make the information readable)
	players[index] = new Object();
	players[index].alive = true;
	
	//Why reinvent the wheel, just update
	UpdatePlayer(index,data);
	
	//This is some extra adding stuff
	players[index].time = data.t;
	players[index].pause = 0;
	players[index].deaths = 0;
	players[index].score = data.s;
	players[index].highlight = (typeof(data.h) != "undefined");
	
	graphics.AddPlayer(players[index]);
	
}

function UpdatePlayer(index, data) {

	//Add in the new fields from the server
	//Could be a new name, colour, etc
	players[index].name = data.n;
	players[index].colour = data.c;
	players[index].deaths = data.d;
	players[index].body = data.b;
	players[index].kills = data.k;

}

function GrowPlayer(index) {
	//Here we grow the graphical view of a snake by one
	var new_index = players[index].body.length;
	players[index].body[new_index] = new Object();
	players[index].body[new_index].x = players[index].body[new_index-1].x;
	players[index].body[new_index].y = players[index].body[new_index-1].y;
	players[index].score += foodScore;
	players[index].pause += 1;
}

function MovePlayer(index,pos) {

	//Erase the last block
	if(players[index].pause == 0) {
		graphics.DrawSquare(players[index].body[players[index].body.length-1].x,
							players[index].body[players[index].body.length-1].y,
							graphics.backColour,0);
	}
	else{
		players[index].pause -= 1;
	}
	
	//Shuffle through the parts
	for(var i = players[index].body.length-1; i >= 1; --i) {
	
		//I tried object swap but javascript came up with crazy values then (such as -65 etc)
		players[index].body[i].x = players[index].body[i-1].x;
		players[index].body[i].y = players[index].body[i-1].y;
		
	}

	//Change the front pos
	players[index].body[0] = pos;
	graphics.DrawPlayer(players[index]);

}

//Keyboard: Routine for keyup
window.addEventListener("keydown", function(event) {

	//Remember
	for(var i = 0; i < keys.length; i++) {
		if(keys[i].indexOf(event.keyCode) > 0) {
			websocket.SendData("K" + keys[i][0]);
		}
	}

});

//Websocket: Status Callback functions
function OnConnect() {

	//We are connected
	websocket.SendData("N" + name + colour);
	document.getElementById("frm").className = "hidden";

}

function OnMessage(data) {

	var command = data.substring(0,1).toUpperCase();
	data = data.substring(1,data.length);
	
	switch(command) {
		//Full player profile (generally refers to a new player)
		case "N":
			var msg = data.split("~");
			var index = parseInt(msg[0]);
			AddPlayer(index, JSON.parse(msg[1]));
			graphics.DrawPlayer(players[index]);
			break;
			
		//Player move
		case "M":
			var msg = data.split("~");
			MovePlayer(parseInt(msg[0]),JSON.parse(msg[1]));
			break;
			
		//Player disconnection
		case "D":
			var index = parseInt(data);
			console.log("Player " + players[index].name + " is dead.");
			graphics.RemovePlayer(players[index].name);
			graphics.ErasePlayer(players[index]);
			players.splice(index,1);
			break;
			
		//Start message with gridsize
		case "S":
			gridSize = parseInt(data);
			graphics.Resize(gridSize,gridSize);
			graphics.playerContainer.removeClass("hidden");
			break;
			
		//Food has been generated
		case "F":
			var newFood = JSON.parse(data.substring(1,data.length));
			graphics.DrawSquare(newFood.x,newFood.y,foodColour,0);
			break;
			
		//Message from the server
		case "T":
			graphics.ShowMessage(data);
			break;
			
		//Player has killed and we add to their score
		case "K":
			var index = parseInt(data);
			
			//Add score
			players[index].kills += 1;
			players[index].score += killScore;
			
			break;
			
		//Grow a player
		case "G":
			GrowPlayer(parseInt(data));
			break;
			
		//Change the player data
		case "U":
			var msg = data.split("~");
			var index = parseInt(msg[0]);
			var data = JSON.parse(msg[1]);
			var oldname = "";
			if(players[index].name != data.n) {
				oldname = players[index].name;
			}
			UpdatePlayer(index,data);
			if(oldname != "") {
				graphics.UpdatePlayer(players[index],oldname);
			}
			break;
			
		//You've been renamed by the server
		case "R":
			name = data;
			break;
			
		//Power up spawned
		case "P":
			var newPowerUp = JSON.parse(data.substring(1,data.length));
			graphics.DrawSquare(newPowerUp.x,newPowerUp.y,powerUpColour,0);
			break;
			
		//Player has respawned
		case "W":
			var msg = data.split("~");
			var index = parseInt(msg[0]);
			UpdatePlayer(index,JSON.parse(msg[1]));
			players[index].alive = true;
			
			graphics.ChangePlayerPicture(players[index]);
			break;
			
		//Kill a player
		case "Z":
			var index = parseInt(data);
			//Kill player
			players[index].alive = false;
			players[index].deaths += 1;
			
			//Setup the player
			graphics.ErasePlayer(players[index]);
			graphics.ChangePlayerPicture(players[index]);
			break;
			
	}
	
}

function OnDisconnect() {
	
	if(websocket.status == "Timeout") {
		graphics.ShowMessage("Can't find server...");
	}
	else if(!graphics.messageOn) {
		graphics.ShowMessage("Lost connections with the server.");
	}
	
	//Do stuff when we disconnect
	graphics.Close(players);
	players = new Array();
	food = new Object();
	clearInterval(main);
	
	
	//Show the logon form
	$(document.getElementById("frm")).removeClass("hidden");
	$(document.getElementById("frm")).find("#connect").removeAttr("disabled","");
	
}
