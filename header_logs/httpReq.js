Array.prototype.contains = function(item) {
	return this.indexOf(item) != -1;
};

function httpReq(type, url, callback, params, headers, data, contentType, username, password, allowCache) {
	var x = null;
	try {
		x = new XMLHttpRequest;
	} catch (ex) {
		try {
			x = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (ex2) { }
	}
	if (!x) {
		return "Can't create XMLHttpRequest object";
	}
	x.onreadystatechange = function () {
		try {
			var status = x.status;
		} catch (ex) {
			status = false;
		}
		if (x.readyState == 4 && callback && (status !== undefined)) {
			if ([0, 200, 201, 204, 207].contains(status)) {
				callback(true, params, x.responseText, url, x);
			} else {
				callback(false, params, null, url, x);
			}
			x.onreadystatechange = function () {};
			x = null;
		}
	};
	if (window.Components && window.netscape && window.netscape.security && document.location.protocol.indexOf("http") == -1) {
		window.netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	} try {
		if (!allowCache) {
			url = url + (url.indexOf("?") < 0 ? "?" : "&") + "nocache=" + Math.random();
		}
		x.open(type, url, true, username, password);
		if (data) {
			x.setRequestHeader("Content-Type", contentType || "application/x-www-form-urlencoded");
		}
		if (x.overrideMimeType) {
			x.setRequestHeader("Connection", "close");
		}
		if (headers) {
			for (var n in headers) {
				x.setRequestHeader(n, headers[n]);
			}
		}
		x.setRequestHeader("X-Requested-With", "TiddlyWiki " + formatVersion());
		x.send(data);
	} catch (ex) {
		return exceptionText(ex);
	}
	return x;
}