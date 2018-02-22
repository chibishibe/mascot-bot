import Behavior from '../behavior.js';

class Shake extends Behavior {
  constructor(settings) {
    settings.name = 'Shake text';
    settings.description = `'cause sometimes Capslock doesn't do it!`;
    super(settings);

    this.commands.push({
      tag: 'shake',
      description: `I'll :sh-s::sh-h::sh-a::sh-k::sh-e::blank::sh-y::sh-o::sh-u::sh-r::blank::sh-t::sh-e::sh-x::sh-t:*!*`
    });
  }

  execute(command, message, channel, data) {
    const parsedMessage = this.parseMessage(message);

    this.bot.postMessage(channel, `${parsedMessage.join(' :sh-h::sh-i: ')} :sh-h::sh-i:`, {
      icon_emoji: ':shake-hoof-beatz:',
      thread_ts: data.thread_ts
    });
  }

  splitString(stringToSplit, seperator) {
    let arrayOfstrings = stringToSplit.split(':blank:');
	console.log('The original sting is:'$parseMessage');
	console.log('The separator is: "':blank:'");
  }
	

    const emojiRegex = /^:.*:$/;

    if (splitMessage.length === 1 && !emojiRegex.test(splitMessage)) {
      splitMessage = splitMessage[0].split('');
    }

    return splitMessage;
  }
}

export default Shake;
