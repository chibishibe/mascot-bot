import Behavior from '../behavior.js';

var readline = require('readline');

const MENTION_RE = /<@(U\d+)>/gi, SPECIAL_MENTION_RE = /<!(\w+)>/gi;

const INPUT_MENTION_RE = /@(\w+)/g;

class ConsoleTalk extends Behavior {
  
  constructor(settings) {
    settings.name = 'consoletalk';
    settings.description = `I'm a real mascot now, Aren't I?`;
    super(settings);
  }
  
  initialize(bot) {
    //bot.on('message', this.onMessage.bind(this));
    
    this.rli = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.rli.on('line', this.onLine.bind(this));
  }
  
  onMessage(messageData) {
    if(!messageData.text) {
      return;
    }
    
    this.bot.getChannelById(messageData.channel)
      .then(chanObj => this.writeMessage(chanObj, messageData),
            err => this.bot.getGroupById(messageData.channel)
              .then(chanObj => this.writeMessage(chanObj, messageData),
                    err => this.writeMessage(undefined, messageData))
       ).catch(e => console.log(`onMessage: ${e}`));
  }
  
  writeMessage(chanObj, messageData) {
    this.bot.getUserById(messageData.user)
      .then(userObj => this.writeMessageUser(chanObj, userObj, messageData),
            err => this.writeMessageUser(chanObj, undefined, messageData)
       ).catch(e => console.log(`writeMessage: ${e}`));
  }
  
  writeMessageUser(chanObj, userObj, messageData) {
    if(!chanObj) chanObj = {name: "<???>"};
    if(!userObj) userObj = {name: "<???>"};
    
    this.bot.getUsers().then(users => {
      var msg = messageData.text.replace(MENTION_RE, (_, uid) => {
        var u = users.members.find(u => u.id == uid);
        if(u)
          return `@${u.name}`;
        else
          return `@${uid}`;
      }).replace(SPECIAL_MENTION_RE, (_, nm) => `@${nm}`).trim();
        
      console.log(`#${chanObj.name}: ${userObj.name}: ${msg}`);
    }).catch(e => console.log(`writeMessageUser: ${e}`));
  }
  
  onLine(line) {
    line = line.trim();
    console.log(`onLine: ${line}`);
    if(line[0] != '#') {
      console.log("Please type the channel name, a space, and then the message.");
      return;
    }
    
    var spidx = line.indexOf(' ');
    var chan = line.substr(1, spidx - 1), msg = line.substr(spidx + 1);
    console.log(`onLine: parts: [${chan},${msg}]`);
    
    this.bot.getChannel(chan)
      .then(chanObj => this.readMessage(chanObj, msg),
            err => this.bot.getGroup(chan)
              .then(chanObj => this.readMessage(chanObj, msg),
                    err => console.log(`Could not find channel/group ${chan}`)
               )
       );
    
  }
  
  readMessage(chanObj, msg) {
    this.bot.getUsers().then(users => {
      msg = msg.replace(INPUT_MENTION_RE, (_, name) => {
        var res = (name => {
          var lowerName = name.toLowerCase();
          if(lowerName == "channel") return "<!channel>";
          if(lowerName == "everyone") return "<!everyone>";
          if(lowerName == "here") return "<!here>";
          var u = users.members.find(u => u.profile.display_name == name);
          if(u)
            return `<@${u.id}|${name}>`;
          else
            return `@${name}`;
        })(name);
        console.log(`readMessage: resolve "${name}" to "${res}"`);
        return res;
      });
    
      console.log(`readMessage: going to post to ${chanObj} (${chanObj.id}): ${msg}`);
      this.bot.postMessage(chanObj.id, msg, {
        icon_emoji: ':hoof_beatz:',
      });
    }).catch(e => console.log(`readMessage: ${e}`));
  }
}

export default ConsoleTalk;
