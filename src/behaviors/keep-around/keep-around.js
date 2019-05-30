import Behavior from '../behavior.js';

class KeepAround extends Behavior {
  constructor(settings) {
    settings.name = "keeparound";
    settings.description = "Nothing to see here, move on.";
    super(settings);
  }
  
  initialize(bot) {
    bot.on('message', this.onMessage.bind(this));
  }
  
  onMessage(messageData) {
    if(!(messageData.type && messageData.subtype && messageData.type == "message" && messageData.subtype == "channel_leave")) return;
    
    console.log(`${messageData.user} left channel ${messageData.channel}`);
    
    if(this.settings.userId && messageData.user != this.settings.userId) return;
    if(this.settings.channelId && messageData.channel != this.settings.channelId) return;
    
    this.bot._api("channels.invite", {
      channel: messageData.channel,
      users: messageData.user,
    }).then(() => console.log(`Reinvited ${messageData.user} to ${messageData.channel}.`),
            (e) => console.log(`Error occurred while inviting ${messageData.user} to ${messageData.channel}: ${JSON.stringify(e)}`));
  }
}

export default KeepAround;
