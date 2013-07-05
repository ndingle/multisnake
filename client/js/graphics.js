/**************************************************
 * graphics.js
 *
 * Handles all of the drawing functions for the 
 * canvas.
 *************************************************/
graphics = {
	
	squareSize: 16,
	backColour: "#000000",
	messageOn : false,
	messageTimeout: 5000,
	messageTimeoutFunc: {},
	
	//JS objects
	canvas : document.getElementById("canvas"),
	context: canvas.getContext("2d"),
	
	//jQuery objects
	playerContainer: $(document.getElementById("players")),
	emptyPlayerDiv: $(document.getElementById("player")),
	messageOverlay: $(document.getElementById("messageOverlay")),
	playerContainers: {},

	Clear: function() {
		this.context.fillStyle = this.backColour;
		this.context.fillRect(0,0,canvas.width,canvas.height);
	},
	
	DrawSquare : function(x, y, colour, inset) {
		this.context.fillStyle = colour;
		this.context.fillRect(x * this.squareSize+inset, y * this.squareSize+inset, this.squareSize-inset*2, this.squareSize-inset*2);
	},
	
	DrawPlayer: function(player) {
		//Loop through the body pieces and draw the initial player
		for(var i = 0; i < player.body.length; i++) {
			//Check if this is the player to highlight
			if(player.highlight) {
				if(player.colour != "#ffffff") {
					this.DrawSquare(player.body[i].x, player.body[i].y, "#ffffff",0);
				}
				else {
					this.DrawSquare(player.body[i].x, player.body[i].y, "#00ff00",0);
				}
				this.DrawSquare(player.body[i].x, player.body[i].y, player.colour,2);
			}
			else {
				this.DrawSquare(player.body[i].x, player.body[i].y, player.colour,0);
			}
		}
	},
	
	ErasePlayer: function(player) {
		//Delete the player on screen
		console.dir(player.body);
		for(var i = 0; i < player.body.length; i++) {
			this.DrawSquare(player.body[i].x, player.body[i].y, this.backColour,0);
		}
	},
	
	Resize: function(size) {
		this.canvas.width = this.squareSize * size;
		this.canvas.height = this.squareSize * size;
		this.Clear();
	},
	
	ChangePlayerPicture: function(player) {
		var playerObject = $(document.getElementById("player" + player.name));
		//If the player is alive
		if(player.alive) {
			playerObject.find("#picture").attr("src","img/snake.png");
		}
		else {
			playerObject.find("#picture").attr("src","img/dead.png");
		}
	},
	
	AddPlayer: function (player) {
		//Find the blank player Div, clone and fill with information
		var newPlayer = this.emptyPlayerDiv.clone(true);
		newPlayer.attr('id',newPlayer.attr('id')+player.name);
		newPlayer.removeClass("hidden");
		newPlayer.find('.plName').text(player.name);
		newPlayer.find('.plName').css('color',player.colour);
		newPlayer.find('.plKills').text(player.kills);
		this.playerContainer.append(newPlayer);
		this.UpdatePlayer(player.name,player.time);
	},

	UpdatePlayer: function(player, oldname) {
	
		if(typeof(oldname) != "undefined") {
			var playerObject = $(document.getElementById("player" + oldname));
			playerObject.attr('id',"player" + player.name);
		}
		else{
			var playerObject = $(document.getElementById("player" + player.name));
		}
	
		//Get the new time and calc their live span
		playerObject.find('.plName').text(player.name);
		playerObject.find('.plName').css('color',player.colour);
		playerObject.find('.plKills').text(player.kills);
		playerObject.find('.plScore').text(player.score);
		
		//Check if we should say minutes or seconds or both
		if(player.time > 60) {
			var secs = Math.round(player.time % 60);
			var mins = Math.round(player.time/60);
			playerObject.find('.plTime').text(mins + "m " + secs + "s");
		}
		else{
			playerObject.find('.plTime').text(Math.round(player.time) + "s");
		}
		
	},

	RemovePlayer: function(name) {
		//DELETE THEM
		$(document.getElementById("player" + name)).remove();
	},
	
	Close: function(players) {
		//Close the graphics library
		this.playerContainer.addClass("hidden");
		for(var i = 0; i < players.length; i++) {
			this.RemovePlayer(players[i].name);
		}
	},
	
	MessageTimeout: function() {
		this.messageOn = false;	
		this.messageOverlay.addClass("hidden");
		clearInterval(this.messageTimeoutFunc);
	},
	
	ShowMessage: function(text) {
		clearInterval(this.messageTimeoutFunc);
		this.messageOverlay.text(text);
		this.messageOverlay.removeClass("hidden");
		this.messageOn = true;
		this.messageTimeoutFunc = setInterval(function(){graphics.MessageTimeout()},this.messageTimeout);
	}

}