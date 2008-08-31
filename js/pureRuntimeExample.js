var pure =window.$p = window.pure ={$c:function (context, path) {
    if (!context) {
        context = {};
    }
    if (typeof context == "object") {
        var aPath = path.split(/\./);
        var value = context[aPath[0]];
        if (value == "undefined") {
            value = window[aPath[0]];
        }
        for (var i = 1; i < aPath.length; i++) {
            if (!value) {
                i = aPath.length;
                continue;
            }
            value = value[aPath[i]];
        }
    }
    if (!value && value != 0) {
        value = "\"\"";
    }
    return value;
},$f:[function (context, items, pos) {
    return items[pos].url;
},function (context, items, pos) {
    return pos % 2 == 0 ? "even" : "odd";
},function lineNb(context, items, pos) {
    return pos + 1;
},function (context, items, pos) {
    return row.decorator(context, items, pos);
}],render:function (fName, context, target) {
    if (typeof fName != "string") {
        var HTML = fName;
        fName = this.compiledFunctions.length || 0;
        this.compile(HTML, fName);
    }
    if (this.compiledFunctions[fName]) {
        var str = this.compiledFunctions[fName].compiled(context);
        if (target) {
            target.innerHTML = str;
        }
        if (HTML) {
            delete this.compiledFunctions[fName];
        }
        return str;
    } else {
        this.msg("HTML_does_not_exist", fName);
    }
},compiledFunctions:[]};$p.compiledFunctions['f2']={};$p.compiledFunctions['f2'].compiled=function (context) {
    var output = [];
    output.push("<table class=\"players\"><thead><tr><th class=\"player\">Player</th></tr></thead><tbody>");
    var player = context;
    for (playerIndex in player) {
        output.push("<tr><td class=\"player\">");
        output.push(player[playerIndex]);
        output.push("</td></tr>");
    }
    output.push("</tbody></table>");
    return output.join("");
};$p.compiledFunctions['f3']={};$p.compiledFunctions['f3'].compiled=function (context) {
    var output = [];
    output.push("<ol class=\"teamList\">\t\t\t\t\t");
    var beeboleSite = context;
    for (beeboleSiteIndex in beeboleSite) {
        output.push("<li class=\"player\"><a ");
        output.push("href=\"");
        output.push($p.$f[0](context, beeboleSite, parseInt(beeboleSiteIndex)));
        output.push("\"");
        output.push(">");
        output.push(beeboleSite[beeboleSiteIndex].name);
        output.push("</a></li>");
    }
    output.push("</ol>");
    return output.join("");
};$p.compiledFunctions['f4']={};$p.compiledFunctions['f4'].compiled=function (context) {
    var output = [];
    output.push("<table class=\"players 2\"><thead><tr><th class=\"player\">Player</th></tr></thead><tbody>");
    var player = context;
    for (playerIndex in player) {
        output.push("<tr ");
        output.push("class=\"");
        output.push($p.$f[1](context, player, parseInt(playerIndex)));
        output.push("\"");
        output.push("><td class=\"player\">");
        output.push(player[playerIndex]);
        output.push("</td></tr>");
    }
    output.push("</tbody></table>");
    return output.join("");
};$p.compiledFunctions['f5']={};$p.compiledFunctions['f5'].compiled=function (context) {
    var output = [];
    output.push("<table class=\"scoreBoard\"><tbody>\t\t\t\t        ");
    var teams = $p.$c(context, "list");
    for (teamsIndex in teams) {
        output.push("<tr><td class=\"teamName\">");
        output.push(teams[teamsIndex][0]);
        output.push("</td><td class=\"teamPlace\"><table class=\"teamList\"><thead><tr><th class=\"position\">Position</th><th class=\"player\">Player</th><th class=\"score\">Score</th></tr></thead><tbody>");
        var player = teams[teamsIndex][1];
        for (playerIndex in player) {
            output.push("<tr ");
            output.push("class=\"");
            output.push($p.$f[3](context, player, parseInt(playerIndex)));
            output.push("\"");
            output.push("><td class=\"position\">");
            output.push($p.$f[2](context, player, parseInt(playerIndex)));
            output.push("</td><td class=\"player\">");
            output.push(player[playerIndex][0]);
            output.push("</td><td class=\"score\">");
            output.push(player[playerIndex][1]);
            output.push("</td></tr>");
        }
        output.push("</tbody></table></td></tr>");
    }
    output.push("</tbody></table>");
    return output.join("");
};$p.compiledFunctions['f6']={};$p.compiledFunctions['f6'].compiled=function (context) {
    var output = [];
    output.push("<ul id=\"nav\"> \t\t\t\t\t");
    var menu = context;
    for (menuIndex in menu) {
        output.push("<li><a ");
        output.push(menu[menuIndex].url);
        output.push(">");
        output.push(menu[menuIndex].name);
        output.push("</a><ul class=\"nav1\"> \t\t\t\t\t\t\t");
        var sub1 = menu[menuIndex].subMenu;
        for (sub1Index in sub1) {
            output.push("<li><a ");
            output.push(sub1[sub1Index].url);
            output.push(">");
            output.push(sub1[sub1Index].name);
            output.push("</a><ul class=\"nav2\">\t\t\t\t\t\t\t\t\t");
            var sub2 = sub1[sub1Index].subMenu;
            for (sub2Index in sub2) {
                output.push("<li><a ");
                output.push(sub2[sub2Index].url);
                output.push(">");
                output.push(sub2[sub2Index].name);
                output.push("</a></li>");
            }
            output.push("</ul></li>");
        }
        output.push("</ul></li>");
    }
    output.push("</ul>");
    return output.join("");
};