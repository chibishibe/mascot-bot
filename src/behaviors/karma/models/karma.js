import mongoose from 'mongoose';
import _ from 'lodash';

const QUALITY = ['positive', 'negative'];

const Karma = new mongoose.Schema({
  entityId: {
    type: String,
    unique: true,
    required: true
  },
  karma: {
    type: Number,
    default: 0
  },
  lowest: {
    type: Number,
    default: 0
  },
  highest: {
    type: Number,
    default: 0
  },
  reasons: [{
    reason: String,
    quality: {
      type: String,
      enum: QUALITY
    }
  }]
});

Karma.static('findOrCreate', function findOrCreate(params) {
  return new Promise((resolve) => {
    this.findOne(params).then((karma) => {
      if (karma) {
        resolve(karma);
      }
      else {
        const newKarma = new this(params);
        newKarma.save();

        resolve(newKarma);
      }
    });
  });
});

Karma.method('increment', function increment(total = 1, reason) {
  this.karma += total;

  if (this.karma > this.highest) {
    this.highest = this.karma;
  }

  if (reason) {
    const karmaReason = {
      owner: this._id,
      quality: 'positive',
      reason
    };

    this.reasons.push(karmaReason);
  }
  return this;
});


Karma.method('decrement', function decrement(total = 1, reason) {
  this.karma -= total;

  if (this.karma < this.lowest) {
    this.lowest = this.karma;
  }

  if (reason) {
    const karmaReason = {
      owner: this._id,
      quality: 'negative',
      reason
    };

    this.reasons.push(karmaReason);
  }
  return this;
});

Karma.method('sample', function sample(total = 5, type = 'positive') {
  return _.chain(this.reasons).filter({
    quality: type
  }).sampleSize(total).value();
});

export default mongoose.model('karma', Karma);