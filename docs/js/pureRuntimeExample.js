var pure =window.$p = window.pure ={$outAtt:function (content) {
    var att = content.join("");
    return /\=\"\"/.test(att) ? "" : att;
},$c:function (context, path, nullMode) {
    if (path == "context") {
        return context;
    }
    if (typeof context == "object") {
        var aPath = path.split(/\./);
        var value = context[aPath[0]];
        if (value == "undefined") {
            value = window[aPath[0]];
        }
        for (var i = 1; i < aPath.length; i++) {
            if (!value) {
                break;
            }
            value = value[aPath[i]];
        }
    }
    if (!value && value != 0) {
        value = nullMode ? null : "";
    }
    return value;
},render:function () {
    var fn, tmp, html, context, directives = arguments[2];
    if (typeof arguments[1] === "string") {
        html = arguments[1];
        context = arguments[0];
    } else {
        html = arguments[0];
        context = arguments[1];
    }
    if (typeof html != "string") {
        var mapped = directives ? this.map(directives, html) : html.cloneNode(true);
        fn = this.compiledFunctions.length || 0;
        this.compile(mapped, fn, context, false);
    } else {
        fn = html;
    }
    if (this.compiledFunctions[fn]) {
        return this.compiledFunctions[fn].compiled(context);
    } else {
        this.msg("HTML_does_not_exist", fn);
    }
},compiledFunctions:[], msg:function (msgId, msgParams, where) {
    var msg = this.messages[msgId] || msgId;
    var re = /&/, i, msgDiv;
    if (msg != msgId && msgParams) {
        if (typeof msgParams == "string") {
            msg = msg.replace(re, msgParams);
        } else {
            for (i = 0; i < msgParams.length; i++) {
                msg = msg.replace(re, msgParams[i]);
            }
        }
    }
    var elm = document.getElementById("pureMsg");
    if (elm) {
        elm.innerHTML = [msg, "<br />", elm.innerHTML].join("");
    } else {
        alert(msg);
    }
}};$p.compiledFunctions['f4']={};$p.compiledFunctions['f4'].compiled=function (context) {
    var output = [];
    output.push("<table class=\"players 2\"><thead><tr><th class=\"player\">Player</th></tr></thead><tbody>");
    var player = context;
    if (player) {
        for (var playerIndex = 0; playerIndex < player.length; playerIndex++) {
            output.push("<tr ");
            output.push($p.$outAtt(["class=\"", this.$f0({context: context, items: player, pos: parseInt(playerIndex), item: player[parseInt(playerIndex)]}), "\""]));
            output.push("><td class=\"player\">");
            output.push(player[playerIndex]);
            output.push("</td></tr>");
        }
    }
    output.push("</tbody></table>");
    return output.join("");
};$p.compiledFunctions['f4'].$f0=function (arg) {
    return (arg.pos % 2 == 0) ? "even" : "odd";
};$p.compiledFunctions['f5']={};$p.compiledFunctions['f5'].compiled=function (context) {
    var output = [];
    output.push("<table class=\"scoreBoard\"><tbody>\t\t\t\t        ");
    var teams = $p.$c(context, "list");
    if (teams) {
        for (var teamsIndex = 0; teamsIndex < teams.length; teamsIndex++) {
            output.push("<tr><td class=\"teamName\">");
            output.push(teams[teamsIndex][0]);
            output.push("</td><td class=\"teamPlace\"><table class=\"teamList\"><thead><tr><th class=\"position\">Position</th><th class=\"player\">Player</th><th class=\"score\">Score</th></tr></thead><tbody>");
            var player = teams[teamsIndex][1];
            if (player) {
                for (var playerIndex = 0; playerIndex < player.length; playerIndex++) {
                    output.push("<tr ");
                    output.push($p.$outAtt(["class=\"", this.$f1({context: context, items: player, pos: parseInt(playerIndex), item: player[parseInt(playerIndex)]}), "\""]));
                    output.push("><td class=\"position\">");
                    output.push(this.$f0({context: context, items: player, pos: parseInt(playerIndex), item: player[parseInt(playerIndex)]}));
                    output.push("</td><td class=\"player\">");
                    output.push(player[playerIndex][0]);
                    output.push("</td><td class=\"score\">");
                    output.push(player[playerIndex][1]);
                    output.push("</td></tr>");
                }
            }
            output.push("</tbody></table></td></tr>");
        }
    }
    output.push("</tbody></table>");
    return output.join("");
};$p.compiledFunctions['f5'].$f1=function (context, items, pos) {
    return row.decorator(context, items, pos);
};$p.compiledFunctions['f5'].$f0=function lineNb(context, items, pos) {
    return pos + 1;
};$p.compiledFunctions['f6']={};$p.compiledFunctions['f6'].compiled=function (context) {
    var output = [];
    output.push("<ul id=\"nav\"> \t\t\t\t\t");
    var menu = context;
    if (menu) {
        for (var menuIndex = 0; menuIndex < menu.length; menuIndex++) {
            output.push("<li><a ");
            output.push($p.$outAtt(["href=\"", menu[menuIndex].url, "\""]));
            output.push(">");
            output.push(menu[menuIndex].name);
            output.push("</a><ul class=\"nav1\"> \t\t\t\t\t\t\t");
            var sub1 = menu[menuIndex].subMenu;
            if (sub1) {
                for (var sub1Index = 0; sub1Index < sub1.length; sub1Index++) {
                    output.push("<li><a ");
                    output.push($p.$outAtt(["href=\"", sub1[sub1Index].url, "\""]));
                    output.push(">");
                    output.push(sub1[sub1Index].name);
                    output.push("</a><ul class=\"nav2\">\t\t\t\t\t\t\t\t\t");
                    var sub2 = sub1[sub1Index].subMenu;
                    if (sub2) {
                        for (var sub2Index = 0; sub2Index < sub2.length; sub2Index++) {
                            output.push("<li><a ");
                            output.push($p.$outAtt(["href=\"", sub2[sub2Index].url, "\""]));
                            output.push(">");
                            output.push(sub2[sub2Index].name);
                            output.push("</a></li>");
                        }
                    }
                    output.push("</ul></li>");
                }
            }
            output.push("</ul></li>");
        }
    }
    output.push("</ul>");
    return output.join("");
};