/**************************************************
 * start.js
 *
 * This file takes the initial setup for snake's
 * server. Allocates the javascripts, variables
 * and more.
 *************************************************/

//Include the required files
require("./websocket.js");
require("./files.js");
require("./game.js");
websocket.Init(OnConnect,OnMessage,OnDisconnect);

//Setup the command system
require("./command.js");
command.Init(OnCommand);
command.Get();

//Server has started, give them the heads up
console.log("Snake server started");

var main = setInterval(function(){Main()},game.gameSpeed);

function SelfCollision(index) {
	//Check if the player has collided with themselves
	if(game.players[index].HitSelf()) {
		//Player has killed themselves
		console.log("Player ran into themselves " + index + " (" + game.players[index].name + ").");
		KillPlayer(index,"You killed yourself!");
		return true;
	}
	return false;
}

function FoodCollision(index) {
	//Check for food collision
	if(game.food.alive) {
		if(game.food.x == game.players[index].body[0].x && 
		   game.food.y == game.players[index].body[0].y) {	
			//Stop, grow and send the messages
			game.food.alive = false;
			game.players[index].Grow();
			websocket.SendDataToAll("G" + index,-1);
			return true;
		}
	}
	return false;
}

function PowerUpCollision(index) {
	//Check for powerUp collision
	if(game.powerUp.alive) {
		if(game.powerUp.x == game.players[index].body[0].x && 
		   game.powerUp.y == game.players[index].body[0].y) {	
			//Speed up!
			game.powerUp.alive = false;
			game.players[index].PowerUp();
			return true;
		}
	}
	return false;
}

function OthersCollision(index) {

	var headbutt = game.CheckCollisionWithOtherPlayersHead(index);
	if(headbutt >= 0) {
		//They head butted
		console.log("Players " + index + " (" + game.players[index].name + ") and " + headbutt + " (" + game.players[headbutt].name + ") head butted");
		var message1 = "You and " + game.players[index].name + " killed each other.";
		var message2 = "You and " + game.players[headbutt].name + " killed each other."
		KillPlayer(headbutt,message1);
		KillPlayer(index,message2);
		return true;
	}
	else {
		var bodyhit = game.CheckCollisionWithOtherPlayersBody(index);
		if(bodyhit >= 0) {
			//Catpure the player and tell them the bad news
			console.log("Player " + index + " (" + game.players[index].name + ") was killed by " + bodyhit + " (" + game.players[bodyhit].name + ").");
			AddPlayerKill(bodyhit,index);
			KillPlayer(index,game.players[bodyhit].name + " killed you.");
			return true;
		}
	
	}
	
	return false;

}

function Main() {

	//Loop through thr players
	for(var i = 0; i < game.players.length; i++ ) {

		if(game.players[i].alive) {
	
			if(game.players[i].NextFrame()) {
			
				//Send a move message
				websocket.SendObjectToAll("M" + i,game.players[i].Move(),-1);
				
				//Check if they hit themselves
				if(SelfCollision(i)) {
					continue;
				}
				
				//Check collision with others
				OthersCollision(i);
				FoodCollision(i);
				PowerUpCollision(i);
				
			}
			
			//If the player needs updating, send the data onward
			if(game.players[i].updateRequired){ 
				UpdatePlayerState(i);
				game.players[i].updateRequired = false;
			}
		
		}
		else {
		
			//Player respawns
			game.players[i].framesDead += 1;
			if(game.players[i].framesDead >= game.respawnTime){
				game.SetupPlayer(i);
				game.players[i].framesDead = 0;
				websocket.SendObjectToAll("W" + i, game.players[i].GetInfo(),-1);
				game.players[i].alive = true;
			}
			
		}
		
	}
	
	//Check the food
	if(!game.food.alive && game.players.length > 1) {
		if(game.food.NextFrame()) {
			console.log("New food spawned x=" + game.food.x + ", y=" + game.food.y);
			websocket.SendObjectToAll("F",game.food.GetInfo(),-1);
		}
	}
	
	//Check the power up
	if(!game.powerUp.alive && game.players.length > 1) {
		if(game.powerUp.NextFrame()) {
			console.log("New power up spawned x=" + game.powerUp.x + ", y=" + game.powerUp.y);
			websocket.SendObjectToAll("P",game.powerUp.GetInfo(),-1);
		}
	}
	
}

function InitPlayer(index) {

	//Check if the player is still connected
	if(game.players[index]) {
	
		//Send the gridsize to the client
		websocket.SendData(index,"S" + game.gridSize);
		
		//Send everyone the new player
		websocket.SendObjectToAll("N" + index, game.players[index].GetInfo(),index);
		
		//Send the highlight message as well
		websocket.SendObject(index, "N" + index,game.players[index].GetInfo(true));
		
		//Send the player the currently connected players
		for(var i = 0; i < game.players.length; i++){
			if( i != index) {
				websocket.SendObject(index,"N" + i, game.players[i].GetInfo());
			}
		}

		//Check if either of the objects are alive
		if(game.food.alive) websocket.SendObject(index,"F",game.food.GetInfo());
		if(game.powerUp.alive) websocket.SendObject(index,"P",game.powerUp.GetInfo());
	
	}
}

function AddPlayerKill(index,otherIndex) {
	//Player has killed lets add and tell his family
	game.players[index].IncreaseKills();
	websocket.SendDataToAll("K" + index, -1);
}

function KillPlayer(index,message,boot) {

	//Kill the player with a nice message (I guess)
	if(!game.players[index].invincible) {
		game.players[index].alive = false;
		game.players[index].deaths += 1;
		websocket.SendDataToAll("Z" + index, -1);
		websocket.SendData(index,"T"  + message);
	}

}

function UpdatePlayerState(index) {
	//A player has updated, send the new info
	websocket.SendObjectToAll("U" + index,game.players[index].GetInfo(),-1);
}

function IsColourTooBlack(colour) {
	
	//http://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
	
	var c = colour.substring(1);      // strip #
	var rgb = parseInt(c, 16);   // convert rrggbb to decimal
	var r = (rgb >> 16) & 0xff;  // extract red
	var g = (rgb >>  8) & 0xff;  // extract green
	var b = (rgb >>  0) & 0xff;  // extract blue

	var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

	if (luma < 20) {
		colour = "#ffffff";
	}
	
	return colour;
}

//Connection responses
function OnConnect(index) {
	
}

function OnMessage(index, data) {

	//Few Quick error checks
	if(typeof(data) == "undefined")
		return;
	if(data.length == 0) 
		return;
	
	var command = data.substring(0,1).toUpperCase();
	var data = data.substring(1,data.length);
	
	try{
	
		switch(command) {

			//New player data - name and colour
			case "N":
			
				//Check the max players
				if(game.players.length >= game.maxPlayers) {
					console.log("Server full, kicking player.");
					websocket.SendData(index,"TThe server is full.");
					websocket.DisconnectClientByIndex(index);
					return;
				}
			
				//Check if we have enough data characters
				if(data.length < 7){
					websocket.DisconnectClientByIndex(index);
					return;
				}
					
				//Strip the information
				var name = data.substring(0,data.length-7).trim();
				var colour = data.substring(data.length-7,data.length);

				//Check if banned
				if(game.IsPlayerBanned(websocket.FindClientByIndex(index).remoteAddress)){
					console.log(name + " is in the banned list, booting them.");
					websocket.SendData(index,"TYour IP is banned on this server.");
					websocket.DisconnectClientByIndex(index);
					return;
				}
				
				//Check if the name is ok or taken
				if(!game.IsNameOK(name)){
					console.log(name + " has a bad name, booting them.");
					websocket.SendData(index,"TNo stupid, empty or long names thanks. Try again.");
					websocket.DisconnectClientByIndex(index);
					return;
				}
				else{	
					//Check if the name exists (important for the client to know)
					if(game.FindPlayerByName(name,index) >= 0) {
						console.log(name + " already exists, booting.");
						websocket.SendData(index,"TName already exists.");
						websocket.DisconnectClientByIndex(index);
						return;
					}
					
					//First check if their colour is too dark
					colour = IsColourTooBlack(colour);
					
					//Add another player
					game.AddPlayer(name, colour);
					InitPlayer(index);
					console.log("Player " + index + " is known as " + game.players[index].name);
					
				}
				break;

			//Keyboard press incoming
			case "K":
				
				//Check that we have enough data
				var key = parseInt(data);
				if(key >= 0 && key <= 3) {
					game.players[index].new_dir = game.dirs[key];
				}
				break;
				
		}
		
	}
	catch(e) {
		console.log("Error on client message - " + e);
	}
	
}

function OnDisconnect(index) {

	//Remove the player and message everyone else
	if(game.players[index]) {
		console.log("Player " + index + " (" + game.players[index].name + ") disconnected");
		game.RemovePlayer(index);
		websocket.SendDataToAll("D" + index,-1);
	}
	
}

function CommandKick(name,msg) {

	var index = game.FindPlayerByName(name);
	//Check our result
	if(index == -1) {
		console.log("Player not found - " + name);
	}
	else {
	
		//Tell everyone the good news
		websocket.SendDataToAll("Z" + index, -1);
		websocket.SendData(index,"T" + "You were kicked by the server. " + ((typeof(msg) === "undefined") ? "" : msg));
		
		var index = game.FindPlayerByName(name);
		if(index >= 0) {
			websocket.DisconnectClientByIndex(index);
		}
		else{
			console.log("Unable to find player - " + name);
		}
	}

}

function OnCommand(data) {
	
	try {
	
		//Parse the data slowly
		var msgs = command.StringToArray(data);
		
		if(msgs.length > 0) {
		
			switch(msgs[0].toUpperCase()) {
		
				//Someone needs help
				case "HELP":
					if(typeof(msgs[1]) != "undefined"){
						console.log(files.ReadAll("./commands/" + msgs[1] + ".txt"));
					}
					else{
						console.log(files.ReadAll("./commands/commands.txt"));
					}
					break;
		
				//Kick a player
				case "KICK":
				case "BOOT":
				
					if(msgs.length >= 2){
						CommandKick(msgs[1],msgs[2]);
					}
					else {
						console.log("Invalid syntax");
					}
					break;	
					
				case "GRIDSIZE":
				
					if(msgs.length >= 2) {
						var size = parseInt(msgs[1]);
						if(size >= 1) {
							var movePlayers = false;
							if(game.gridSize > size) {
								movePlayers = true;
							}
							game.gridSize = size;
							websocket.SendDataToAll("S" + game.gridSize,-1);
							websocket.SendDataToAll("TGrid size has changed.",-1);
							//TODO: Move players and food in random positions when shrinking
							if(movePlayers) {
								//Check if any players are in a bad position?
								for(var i = 0; i < game.players.length; i++) {
									for(var j = 0; j < game.players[i].body.length; j++) {
										//Do we have a bad coord
										if(game.players[i].body[j].x >= game.gridSize || 
										   game.players[i].body[j].y >= game.gridSize) {
										    //Loop until we have them in a good position
											var count = 0;
											do{
												game.players[i].RandomiseCoordinates();
												//25 is the limit dude (this incase there are too many players for a small grid
												count++;
												if(count > 25) break;
											}while(game.players[i].body[j].x >= game.gridSize || 
											   game.players[i].body[j].y >= game.gridSize);
											//Make them invincible
											game.players[i].MakeInvincible();
										}
									}
								}
							}
						}
						else{
							console.log("Invalid size - " + size);
						}
					}
					else {
						console.log("Invalid syntax");
					}
					
					break;
				
				case "BAN":
					//ban player list 
					//Syntax ban <name> [save|remove [force]]
					if(msgs.length >= 2) {
						if(msgs[1].toUpperCase() == "PLAYER" && msgs[2].toUpperCase() == "LIST"){
							console.log(game.GetBannedPlayer());
						}
						else if(msgs[1].toUpperCase() == "DELETE" && msgs[2].toUpperCase() == "LIST") {
							files.Delete("banned.txt");
							console.log("Banned list removed");
						}
						else if(msgs[1].toUpperCase() == "CLEAR" && msgs[2].toUpperCase() == "LIST") {
							game.ClearBannedPlayers();
							console.log("Cleared this session's banned list");
						}
						else if(msgs[1].toUpperCase() == "REMOVE" && isNaN(msgs[2]) == false) {
							if(game.UnbanPlayer(parseInt(msgs[2]))) {
								console.log("Player removed from banned list");
							}
							else {
								console.log("Unable to remove banned player - check the index value");
							}
						}
						else {
							var index = game.FindPlayerByName(msgs[1]);
							if(index >= 0){
								//Add the user to the banned list
								if(game.BanPlayer(websocket.FindClientByIndex(index).remoteAddress,((typeof(msgs[2]) !== "undefined") ? ((msgs[2].toUpperCase() === "SAVE") ? true : null) : null))) {
									CommandKick(msgs[1],"Your IP has been banned.");
									console.log("Player " + msgs[1] + " has been banned.");
								}
								else {
									console.log("Player " + msgs[1] + " already exists in banned list.");
								}
							}
							else{
								console.log("Player not found - " + msgs[1]);
							}
						}
					}
					else{
						console.log("Invalid syntax");
					}
					
					break;
					
				case "RENAME":
			
					if(msgs.length >= 3) {
						var result = game.RenamePlayer(msgs[1],msgs[2]);
						if(result == 0) {
							console.log("Player " + msgs[1] + " renamed to " + msgs[2]);
						}
						else if(result == -1){
							console.log("Unable to find player - " + msgs[1]);
						}
						else if(result == -2) {
							console.log("Player's name already exists - " + msgs[2]);
						}
						
					}
					else{
						console.log("Invalid syntax");
					}
					
					break;
					
				case "INVINCIBLETIME":
				
					if(msgs.length == 1) {
						console.log("Invincible Time is " + game.invincibleTime);
					}
					else {
						var num = parseInt(msgs[1]);
						if(num > 0){
							game.invincibleTime = num;
							console.log("Invincible Time set to " + game.invincibleTime);
						}
						else {
							console.log("Invalid number.");
						}
					}
					break;
					
				case "GAMESPEED":
				
					if(msgs.length == 1) {
						console.log("Gamespeed is " + game.gameSpeed);
					}
					else {
						var num = parseInt(msgs[1]);
						if(num > 0){
							game.gameSpeed = num;
							clearInterval(main);
							main = setInterval(function(){Main()},game.gameSpeed);
							console.log("Gamespeed set to " + game.gameSpeed);
						}
						else {
							console.log("Invalid number.");
						}
					}
					break; 
					
				case "MAXPLAYERS":
				
					if(msgs.length == 1) {
						console.log("Max Players is " + game.maxPlayers);
					}
					else {
						var num = parseInt(msgs[1]);
						if(num > 0){
							game.maxPlayers = num;
							console.log("Max Players set to " + game.maxPlayers);
						}
						else {
							console.log("Invalid number.");
						}
					}
					break;
					
				case "PLAYERS":
				
					console.log(game.GetPlayers());
					break;
					
				case "RECOLOUR":
					
					if(msgs.length >= 3) {
						if(game.RecolourPlayer(msgs[1],msgs[2])) {
							console.log("Player " + msgs[1] + " has been recoloured to " + msgs[2]);
						}
						else {
							console.log("Unable to find player - " + msgs[1]);
						}
					}
					
					break;	
					
				default:
					console.log("Unknown command. Type list for a list of commands, help <command> for help on one command.");
					break;
					
				case "MESSAGE":
					//Syntax: message <message> <name>
					var index = -2;
					
					if(msgs.length >= 3) {
						index = game.FindPlayerByName(msgs[2]);
						if(index == -1) {
							console.log("Unable to find player - " + msgs[2]);
							return;
						}
						websocket.SendData(index,"T" + msgs[1]);
					}
					
					//Sending message
					if(index == -2) {
						websocket.SendDataToAll("T" + msgs[1],-1);
					}
				
					break;
					
				case "SHUTDOWN":
					//Syntax Shutdown <time> <message>
					//Check the time
					if(msgs.length >= 2){
						var time = parseInt(msgs[1]);
						if(time > 0) {
							setInterval(function(){Shutdown()},time);
						}
						else if(time == 0) {
							Shutdown();
						}
					}
					else {
						console.log("Invalid syntax");
					}
					
					//Check for a message
					if(msgs.length >= 3) {
						//Send the message to everyone
						websocket.SendDataToAll("T" + msgs[2],-1);
					}
				
					break;
					
				case "GET":
					if(msgs.length >= 2) {
						if(game[msgs[1]] !== "undefined") {
							console.log("Property " + msgs[1] + " is set to " + game[msgs[1]]);
						}
					}
					break;
			}
		
		}
		
	}
	catch(e) {
		console.log("Error processing a command - " + e);
	}
	
	command.Get();
	
}

function Shutdown() {
	process.exit();
}