/************************************************** * files.js * * Basic input and output for file operations.  *mainly for printing text files to the console. *************************************************/var fs = require('fs'); files = {		ReadAll: function(filename) {		try{			return fs.readFileSync(filename).toString()		}		catch(e){			console.log("Error reading file " + filename + "\n" + e);		}	},		Write: function(filename, data) {		try{			console.log("hello");			fs.writeFile(filename,data);			return true;		}		catch(e) {			console.log("Error writing file " + filename + "\n" + e);		}	},		Append: function(filename, data) {		fs.appendFile(filename, data, function(err) {			if(err) {				console.log("Error appending file " + filename + "\n" + e);				return false;			}			return true;		});	},		Delete: function(filename) {		try{			fs.unlink(filename);			return true;		}		catch(e) {			console.log("Error deleting file " + filename + "\n" + e);		}	}	}