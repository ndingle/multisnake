/**************************************************
 * commands.js
 *
 * This allows user input to create commands and 
 * allow the server to take control
 * 
 * Based on: http://st-on-it.blogspot.com.au/2011/05/how-to-read-user-input-with-nodejs.html
 *************************************************/
command = {

	commandCallback : {},

	Init: function(commandCallback) {
		this.commandCallback = commandCallback;
	},

	Get: function() {
		var stdin = process.stdin, stdout = process.stdout;

		stdin.resume();

		stdin.once('data', function(data) {
			data = data.toString().trim();
			command.commandCallback(data.trim());
		});
		
	},
	
	StringToArray: function(data) {
	
		//Empty array ready for commands
		var msgs = Array();
	
		//Ensure we have a message
		if(data.length > 0) {
			
			
			var quoteOn = false;
			var start = 0;
			var firstQuoteIndex = 0;
			
			//Loop through and cut up our neat string
			for(var i = 0; i < data.length; i++) {
			
				if(quoteOn) {
					if(data[i] == "\"") {
						msgs.push(data.substring(firstQuoteIndex+1,i));
						start = i+1
						quoteOn = false;
					}
				}
				else if(data[i] == "\"") {
					quoteOn = true;
					firstQuoteIndex = i;
				}
				else if(data[i] == " " && data.substring(start,i).length > 1) {
					msgs.push(data.substring(start,i));
					start = i+1;
				}
			
			}
			
			//Just incase there is something left over
			if(start != data.length) {
				if(quoteOn) {
					msgs.push(data.substring(firstQuoteIndex,data.length));
				}
				else{
					msgs.push(data.substring(start,data.length));
				}
			}
			
		}
		
		//Return our result ay
		return msgs;
	
	}

}
