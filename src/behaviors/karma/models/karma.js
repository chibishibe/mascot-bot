import sqlite3 from 'sqlite3';

let db = new sqlite3.Database('karma.db');
// Welcome to callback hell.
db.run('CREATE TABLE IF NOT EXISTS points (kind, subject, value DEFAULT 0, max DEFAULT 0, min DEFAULT 0);', [], () => {
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS points_subjects ON points(kind, subject);', [], () => {
    db.run('CREATE TABLE IF NOT EXISTS reasons (kind, subject, quality, reason);', [], () => {
      db.run('CREATE INDEX IF NOT EXISTS reasons_subjects ON reasons(kind, subject);');
    });
  });
});

// Stub for referring to a single entry (by subject)
class KarmaEntry {
  constructor(kind, subject) {
    this.kind = kind;
    this.subject = subject;
    db.run('INSERT OR IGNORE INTO points (kind, subject) VALUES (?, ?);', [kind, subject]);
  }

  change(amt, reason) {
    let promises = [];
    if(reason) {
      promises.push(db.run('INSERT INTO reasons VALUES (?, ?, ?, ?);',
        [this.kind, this.subject, (amt >= 0 ? 'positive' : 'negative'), reason]
      ));
    }
    promises.push(
      (new Promise(resolve =>
        db.run('UPDATE points SET value = value + ? WHERE kind = ? AND subject = ?;',
          [amt, this.kind, this.subject],
          resolve
        )
      )).then(() => {
      // This needs to be done *after* the update above:
      db.run('UPDATE points SET min = min(value, min), max = max(value, max) WHERE kind = ? AND subject = ?;',
        [this.kind, this.subject]
      );
    }));
    return Promise.all(promises);
  }

  increment(amt, reason) {
    return this.change(amt, reason);
  }

  decrement(amt, reason) {
    return this.change(-amt, reason);
  }

  sample(amt = 5, quality = 'positive') {
    return new Promise((resolve, fail) => {
      let result = [];
      db.each('SELECT reason FROM reasons WHERE kind = ? AND subject = ? AND quality = ? ORDER BY random() LIMIT ?',
        [this.kind, this.subject, quality, amt],
        (err, row) => err ? fail(err) : result.push(row),
        () => resolve(result)
      );
    });
  }

  get entityKind() {
    return this.kind;
  }

  get entityName() {
    return this.subject;
  }

  get karma() {
    return new Promise((resolve, fail) =>
      db.get('SELECT value FROM points WHERE kind = ? AND subject = ?',
        [this.kind, this.subject],
        (err, row) => err ? fail(err): resolve(row.value)
      )
    );
  }

  get highest() {
    return new Promise((resolve, fail) =>
      db.get('SELECT max FROM points WHERE kind = ? AND subject = ?',
        [this.kind, this.subject],
        (err, row) => err ? fail(err): resolve(row.max)
      )
    );
  }

  get lowest() {
    return new Promise((resolve, fail) =>
      db.get('SELECT min FROM points WHERE kind = ? AND subject = ?',
        [this.kind, this.subject],
        (err, row) => err ? fail(err): resolve(row.min)
      )
    );
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
    return Promise.resolve(new KarmaEntry(params.entityKind, params.entityName));
  }

  static list(ord, amt, kind) {
    return new Promise((resolve, fail) => {
      let result = [];
      let stmt = 'SELECT kind, subject FROM points';
      if(kind) {
        stmt += ' WHERE kind = $kind';
      }
      stmt += ` ORDER BY value ${ord == 'asc' ? 'ASC' : 'DESC'} LIMIT $amt`;
      db.each(stmt, {
        $kind: kind,
        $amt: amt
      }, (err, row) => err ? fail(err) : result.push(new KarmaEntry(row.kind, row.subject)), () => resolve(result));
    });
  }
}

export default Karma;
