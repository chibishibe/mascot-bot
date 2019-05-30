import Behavior from '../behavior.js';

const hebrew = require('./hebrew.json');

var hebrew_map = {};
for(var k in hebrew) {
  const v = hebrew[k];
  if(typeof(v) == "string") {
    hebrew_map[v] = k;
  } else {
    hebrew_map[v.sym] = k;
    if(Array.isArray(v.alt)) {
      v.alt.forEach(alt => hebrew_map[v.sym] = alt);
    }
    if(v.sofit) hebrew_map[v.sofit] = k + "-sofit";
  }
}

const ALLOWED_RE = new RegExp("[^ a-zA-Z" + (
  Object.keys(hebrew_map).reduce((a, b) => a + b)
) + "]", "g");

function rvIdxInPlace(arr, i, j) {
  while(i < j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    i++;
    j--;
  }
}

class ShakeText extends Behavior {
  
  constructor(settings) {
    settings.name = 'shake';
    settings.description = `'cause sometimes Capslock doesn't do it!`;
    super(settings);
    
    this.commands.push({
      tag: 'shake',
      description: `I'll shake your text, cause sometimes Capslock doesn't do it!`
    });
  }
  
  execute(command, message, channel, data) {
    const parsedMessage = this.parseMessage(message, channel, data);
      if( parsedMessage == undefined) {
      return
    }
    
    this.bot.postMessage(channel, `${parsedMessage.join('')}`, {
      icon_emoji: ':shakehoof_beatz:',
      thread_ts: data.thread_ts
    });
  }
  
  parseMessage(message, channel, data) {
    let splitMessage = message.replace(/^!shake/gi, '')
      .replace(/\:\w*\:/gi, '')
      .replace(ALLOWED_RE, '')
      .trim()
      .split('');
    if(splitMessage.length > 20) {
      this.bot.postMessage(channel, "Listen, I understand you're upset. But I can't do that! Try to type something smaller okay?~", {
        icon_emoji: ':hoof_beatz:',
        thread_ts: data.thread_ts
      });
      
      return undefined
    }
    
    let lastHebridx = -1;
    for(var i = 0; i < splitMessage.length; i++) {
      if(hebrew_map[splitMessage[i]] != null || splitMessage[i] == ' ') {
        if(lastHebridx == -1) {
          lastHebridx = i;
        }
      } else {
        if(lastHebridx != -1) {
          rvIdxInPlace(splitMessage, lastHebridx, i - 1);
          lastHebridx = -1;
        }
      }
    }
    
    const parsedMessage=splitMessage
      .map(char => {
        if(char == ' ') return ':ws:';
        if(hebrew_map[char] != null) return `:sh-${hebrew_map[char]}:`;
        return `:sh-${char}:`;
      });
    return parsedMessage;
  }
}

export default ShakeText;
