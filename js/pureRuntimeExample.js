var pure =window.$p = window.pure = {$c:function (context, path) 
{
  if (!context)
    context = { };
  if (typeof context == "object")
    {
      var aPath = path.split(/\./);
      var value = context[aPath[0]];
      if (value == "undefined")
        value = window[aPath[0]];
      for (var i = 1; i < aPath.length; ++i)
        {
          if (!value)
            {
              i = aPath.length;
              continue;
            }
          value = value[aPath[i]];
        }
    }
  if (!value && value != 0)
    value = "\"\"";
  return value;
},render:function (fName, context, target) 
{
  if (typeof fName != "string")
    {
      var HTML = fName;
      fName = this.compiledFunctions.length || 0;
      this.compile(HTML, fName);
    }
  if (this.compiledFunctions[fName])
    {
      var str = this.compiledFunctions[fName].compiled(context);
      if (target)
        target.innerHTML = str;
      if (HTML)
        delete this.compiledFunctions[fName];
      return str;
    }
  else
    {
      pure.msg("HTML_does_not_exist", fName);
    }
},compiledFunctions:[]};$p.compiledFunctions['beeboleSites']={};$p.compiledFunctions['beeboleSites'].compiled=function (context) 
{
  var output = [];
  output.push("<ol class=\"teamList\">\t\t\t\t\t");
  var beeboleSite = context;
  for (beeboleSiteIndex in beeboleSite)
    {
      output.push("<li class=\"player\"><a ");
      output.push("href=");
      output.push("\"");
      output.push(beeboleSite[beeboleSiteIndex]["url"]);
      output.push("\"");
      output.push(">");
      output.push(beeboleSite[beeboleSiteIndex]["name"]);
      output.push("</a></li>");
    }
  output.push("</ol>");
  return output.join("");
};$p.compiledFunctions['playersFct']={};$p.compiledFunctions['playersFct'].compiled=function (context) 
{
  var output = [];
  output.push("<table class=\"players\"><thead><tr><th class=\"player\">Player</th></tr></thead><tbody>");
  var player = context;
  for (playerIndex in player)
    {
      output.push("<tr><td class=\"player\">");
      output.push(player[playerIndex]);
      output.push("</td></tr>");
    }
  output.push("</tbody></table>");
  return output.join("");
};$p.compiledFunctions['playersFct2']={};$p.compiledFunctions['playersFct2'].compiled=function (context) 
{
  var output = [];
  output.push("<table class=\"players 2\"><thead><tr><th class=\"player\">Player</th></tr></thead><tbody>");
  var player = context;
  for (playerIndex in player)
    {
      output.push("<tr ");
      output.push("class=");
      output.push("\"");
      output.push(function (context, items, pos)
      {
        return pos % 2 == 0 ? "even" : "odd";
      }(context, player, parseInt(playerIndex)));
      output.push("\"");
      output.push("><td class=\"player\">");
      output.push(player[playerIndex]);
      output.push("</td></tr>");
    }
  output.push("</tbody></table>");
  return output.join("");
};$p.compiledFunctions['scoreBoardFct']={};$p.compiledFunctions['scoreBoardFct'].compiled=function (context) 
{
  var output = [];
  output.push("<table class=\"scoreBoard\"><tbody>\t\t\t\t        ");
  var teams = pure.$c(context, "list");
  for (teamsIndex in teams)
    {
      output.push("<tr><td class=\"teamName\">");
      output.push(teams[teamsIndex][0]);
      output.push("</td><td class=\"teamPlace\"><table class=\"teamList\"><thead><tr><th class=\"player\">Player</th><th class=\"score\">Score</th></tr></thead><tbody>");
      var player = teams[teamsIndex][1];
      for (playerIndex in player)
        {
          output.push("<tr ");
          output.push("class=");
          output.push("\"");
          output.push(function (context, items, pos)
          {
            return (items.length + pos) % 2 == 0 ? "even" : "odd";
          }(context, player, parseInt(playerIndex)));
          output.push("\"");
          output.push("><td class=\"player\">");
          output.push(player[playerIndex][0]);
          output.push("</td><td class=\"score\">");
          output.push(player[playerIndex][1]);
          output.push("</td></tr>");
        }
      output.push("</tbody></table></td></tr>");
    }
  output.push("</tbody></table>");
  return output.join("");
};