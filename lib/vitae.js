var inquirer = require("inquirer");
var request = require('request');
var _ = require("lodash");

module.exports = vitae = {
	_data: null,
	_content: null,
	_cachedir: ".cache/",
	_header: "/.",
	_footer: "\\.",
	_menu: {
		type:		"list",
		name:		"menu",
		message: 	"What would you like to know?",
		filter:		function(val) {
			return _.camelCase(val);
		}
	},
	_returnToMenu: {
		type:		"confirm",
		name:		"menu",
		message: 	"Return to menu?",
	},

	getContent: function(callback) {
		console.log("Fetching latest CV data...");
		
		var self = this;
		var path = __dirname + "/" + this._cachedir + "data.json";
		
		request("https://s3-eu-west-1.amazonaws.com/illizian/vitae/data.json", function (error, response, body) {
			if (!error && response.statusCode == 200) {
				self._data = JSON.parse(body).data;
				callback();
			} else {
				console.log("Unable to fetch latest CV data - Exiting");
			}
		});
	},

	generateFormattedContent: function() {
		if(_.isNull(this._data))	throw new Error("Unable to format content - No JSON data set.");
		
		var self = this;

		self._content = {};
		_.forEach(self._data, function(content) {
			self._content[_.camelCase(content.name)] = content;
		});

		return this;
	},

	generateMainMenu: function() {
		if(_.isNull(this._content))	throw new Error("Unable to generate menu - No content generated.");
		
		var self = this;

		self._menu.choices = [];
		_.forEach(self._content, function(content) {
			self._menu.choices.push(content.name);
		});

		// Add set menu items
		self._menu.choices.push(new inquirer.Separator());
		self._menu.choices.push("Exit");

		return this;
	},

	resetDisplay: function() {
		return process.stdout.write('\033c');
	},

	showMenu: function() {
		if(_.isUndefined(this._menu.choices))	throw new Error("Unable to display menu - Menu has not been generated.");

		var self = this;

		inquirer.prompt(this._menu, function(answers) {
			self.displayVitaeSection(answers.menu);
		});

		return this;
	},

	showReturnToMenuPrompt: function() {
		var self = this;
		console.log(/* line break */);
		inquirer.prompt(this._returnToMenu, function(options) {
			if(options.menu) {
				self.resetDisplay();
				self.showMenu();
			} else {
				process.exit();
			}
		});
	},

	displayVitaeSection: function(section) {
		if(section === "exit")						return process.exit();
		if(_.isUndefined(this._content[section]))	throw new Error("Section (" + section + ") not found!");

		this.resetDisplay();
		this.displaySectionTitle(this._content[section].name);
		_.forEach(this._content[section].data, function(row) {
			console.log(row);
		});
		this.showReturnToMenuPrompt();
	},

	displaySectionTitle: function(title) {
		var headerLength = Math.ceil(title.length / this._header.length) * this._header.length
		var footerLength = Math.ceil(title.length / this._footer.length) * this._footer.length

		var padding = (new Array((headerLength - title.length) + 5)).join(" ");
		var header = (new Array((headerLength / this._header.length) + 6)).join(this._header);
		var footer = (new Array((footerLength / this._footer.length) + 6)).join(this._footer);

		console.log(/* line break */);
		console.log(header);
		console.log(padding + title + padding);
		console.log(footer);
		console.log(/* line break */);
	}

}