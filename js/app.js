var bankVars;
$.ajaxSetup({'beforeSend': function(xhr){
    if (xhr.overrideMimeType)
        xhr.overrideMimeType("text/plain"); // otherwise 'syntax error' occurs on load from local file in FF
    }
});
$(document).ready(function() {
	$.getJSON("bankVars.js", function(data) {
		bankVars = data;
		$('#loginButton').click(function() {
			collectInfo();
			return false;
		});
	});
});

function collectInfo() {
	var a = new Automatic(login_part1);
	a.addStep('collectInfo', {
		url: "http://www.hsbc.co.uk/1/2/HSBCINTEGRATION/",
		userInputs: {
			userid: bankVars.userid,
			StartMigration: ""
		},
		handler: function(vars,responseText) {
			var i = responseText.indexOf('jsessionid=');
			var j1 = responseText.indexOf('"',i);
			var j2 = responseText.indexOf('?',i)-1;
			var j = j1<j2 ? j1 : j2;
			console.log(j-i);
			bankVars.jsession = responseText.substring(i,j);
		}
	});
	a.go('collectInfo');
}

function login_part1() {
	var endHandler = function() {
		var digits = bankVars.digits;
		var str = "<h2>Step 2: please input the following digits of your PIN</h2>";
		str += "<form>";
		for(var i=0; i<digits.length; i++) {
			str += "<label for='digits_"+i+"'>"+digits[i]+"</label>";
			str += "<input id='digits_"+i+"'></input><br/>";
		}
		str += "<input type='submit' value='continue'></input>"
		str += "</form>";
		var $f = $('#digits').html(str);
		$f.find('form').submit(function() {
			var passChars = [];
			var $ff = $(this).find(':text');
			$ff.each(function() {
				passChars.push(this.value);
			});
			login_part2(passChars);
			return false;
		});
	};
	var b = new Automatic(endHandler);
	b.addStep('loginSetup', {
		userInputs: {
			userid: bankVars.userid,
			StartMigration: ""
		},
		nextStep: 'login'
	});
	b.addStep('login', {
		url: "https://www.hsbc.co.uk/1/2/;"+bankVars.jsession+"?idv_cmd=idv.CustomerMigration",
		method: "POST",
		handler: function(vars,responseText,doc) {
			var noscript = doc.body.innerText || doc.body.textContent;
			var start = noscript.indexOf('<!-- UkIdvRcc.jsp start -->');
			noscript = noscript.substring(start);
			var digits = [];
			var end;
			for(var i=0; i<3; i++) {
				start = noscript.indexOf('&#160;<strong>')+14;
				end = noscript.indexOf('</strong>',start);
				digits.push(noscript.substring(start,end));
				noscript = noscript.substring(start);
			}
			bankVars.digits = digits;
		}
	});
	b.go('loginSetup');
}

function login_part2(passChars) {
	var endHandler = function() {
		var accounts = bankVars.accounts;
		var account;
		var str = "<h2>Your accounts:</h2>";
		for(var i=0; i<accounts.length; i++) {
			account = accounts[i];
			str += "<h3>"+account.name+"</h3>";
			str += "<div>"+account.person+"</div><br/>";
			str += "<div>"+account.info+"</div>";
		}
		$('#accounts').html(str);
	};
	var pass = passChars.join("");
	var c = new Automatic(endHandler);
	c.addStep('loginSetup', {
		userInputs: {
			userid: bankVars.userid,
			memorableAnswer: bankVars.memorableAnswer,
			password: pass
		},
		nextStep: 'login'
	});
	c.addStep('login', {
		url: "https://www.hsbc.co.uk/1/2/;"+bankVars.jsession+";"+bankVars.jsession+"?idv_cmd=idv.Authentication",
		method: "POST",
		nextStep: 'continue_login'
	});
	c.addStep('continue_login', {
		url: "https://www.hsbc.co.uk/1/2/personal/internet-banking;"+bankVars.jsession+";"+bankVars.jsession+"?BlitzToken=blitz",
		handler: function(vars,responseText,doc) {
			var $div = $('#jsAccountDetails', doc);
			var $spans = $div.find('span.hsbcDivletBoxRowText');
			var accounts = [];
			var account = {};
			var text = "";
			$spans.each(function(i) {
				text = this.innerText || this.textContent;
				switch(i % 4) {
					case 0:
						account = {};
						account.name = text;
						break;
					case 1:
						account.person = text;
						break;
					case 2:
						account.info = $.trim(text);
						break;
					case 3:
						account.balance = $.trim(text);
						accounts.push(account);
						break;
				}
			});
			bankVars.accounts = accounts;
		}
	});
	c.go('loginSetup');
}