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
		var str = "<p>Please input the following digits of your PIN:</p>";
		str += "<form>";
		for(var i=0; i<digits.length; i++) {
			str += "<label for='digits_"+i+"'>"+digits[i]+"</label>";
			str += "<input id='digits_"+i+"'></input>";
		}
		str += "<input type='submit' value='login'></input>"
		str += "</form>";
		var $f = $('#digits').html(str);
		$f.find('form').submit(function() {
			try {
			var vals = [];
			var $ff = $(this).find(':text');
			$ff.each(function() {
				vals.push(this.value);
			});
			login_part2(vals);
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
			bankVars.doc = doc;
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
		},
		userInputs: {
			userid: bankVars.userid,
			memorableAnswer: bankVars.memorableAnswer,
			password: ""
		}
	});
	b.go('loginSetup');
}

function login_part2() {
	var endHandler(function() {
		console.log('done');
	});
	var c = new Automatic(endHandler);
}