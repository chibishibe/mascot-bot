import sqlite3 from 'sqlite3';

let db = new sqlite3.Database('karma.db')
db.run('CREATE TABLE IF NOT EXISTS points (subject UNIQUE, value DEFAULT 0, max DEFAULT 0, min DEFAULT 0);')
db.run('CREATE TABLE IF NOT EXISTS reasons (subject, quality, reason);')

// Stub for referring to a single entry (by subject)
class KarmaEntry {
  constructor(subject) {
    this.subject = subject;
    db.run('INSERT OR IGNORE INTO points (subject) VALUES (?);', subject);
  }

  change(amt, reason) {
    let promises = [];
    if(reason) {
      promises.push(db.run('INSERT INTO reasons VALUES (?, ?, ?);', this.subject, (amt >= 0 ? 'positive' : 'negative'), reason));
    }
    promises.push((new Promise(resolve => db.run('UPDATE points SET value = value + ? WHERE subject = ?;', [amt, this.subject], resolve))).then(() => {
      // This needs to be done *after* the update above:
      db.run('UPDATE points SET min = min(value, min), max = max(value, max) WHERE subject = ?;', this.subject);
    }));
    return Promise.all(promises);
  }

  increment(amt, reason) {
    return this.change(amt, reason);
  }

  decrement(amt, reason) {
    return this.change(-amt, reason);
  }

  save() {
    // No-op
  }

  sample(amt = 5, quality = 'positive') {
    return new Promise((resolve, fail) => {
      let result = [];
      db.each('SELECT reason FROM reasons WHERE subject = ? AND quality = ? ORDER BY random() LIMIT ?', [this.subject, quality, amt], (err, row) => err ? fail(err) : result.push(row), () => resolve(result));
    });
  }

  get entityKind() {
    return this.subject.split('|', 2)[0];
  }

  get entityName() {
    return this.subject.split('|').slice(1).join('|');
  }

  get karma() {
    return new Promise((resolve, fail) => db.get('SELECT value FROM points WHERE subject = ?', [this.subject], (err, row) => err ? fail(err): resolve(row.value)));
  }

  get highest() {
    return new Promise((resolve, fail) => db.get('SELECT max FROM points WHERE subject = ?', [this.subject], (err, row) => err ? fail(err): resolve(row.max)));
  }

  get lowest() {
    return new Promise((resolve, fail) => db.get('SELECT min FROM points WHERE subject = ?', [this.subject], (err, row) => err ? fail(err): resolve(row.min)));
  }
}

// Main interface
class Karma {
  static stripQuotes(name) {
    return name.match(/^["|“|”]/) ? name.slice(1, -1) : name;
  }

  static sanitize(name) {
    // The current model does not need input sanitization, but case folding is
    // a good thing anyway
    return name.toLowerCase();
  }

  static findOrCreate(params) {
    return Promise.resolve(new KarmaEntry(params.entityId));
  }

  static list(ord, amt, kind) {
    return new Promise((resolve, fail) => {
      let result = [];
      let stmt = 'SELECT subject FROM points';
      if(kind) {
        stmt += ' WHERE subject LIKE $kind || "|%"';
      }
      stmt += ` ORDER BY value ${ord == 'asc' ? 'ASC' : 'DESC'} LIMIT $amt`;
      db.each(stmt, {
        $kind: kind,
        $amt: amt
      }, (err, row) => err ? fail(err) : result.push(new KarmaEntry(row.subject)), () => resolve(result));
    });
  }
}

export default Karma;
