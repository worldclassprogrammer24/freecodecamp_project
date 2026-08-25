const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose');

chai.use(chaiHttp.default || chaiHttp);

suite('Functional Tests', function() {
  this.timeout(15000);

  let thread1Id;
  let thread2Id;
  let reply1Id;

  // Attente de la connexion active à MongoDB avant le premier test
  before(async function() {
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => mongoose.connection.once('open', resolve));
    }
  });

  // 1. Creating a new thread
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/fcc_strict_board')
      .send({ text: 'Thread 1', delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // 2. Viewing the 10 most recent threads
  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
      .get('/api/threads/fcc_strict_board')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 1);
        thread1Id = res.body[0]._id;
        done();
      });
  });

  // 3. Deleting a thread with the incorrect password
  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
    chai.request(server)
      .delete('/api/threads/fcc_strict_board')
      .send({ thread_id: thread1Id, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 4. Deleting a thread with the correct password
  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
    chai.request(server)
      .delete('/api/threads/fcc_strict_board')
      .send({ thread_id: thread1Id, delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 5. Reporting a thread
  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    // Création d'un nouveau thread car thread1Id a été supprimé au test précédent
    chai.request(server)
      .post('/api/threads/fcc_strict_board')
      .send({ text: 'Thread 2', delete_password: 'pass' })
      .end(function(err, res) {
        chai.request(server)
          .get('/api/threads/fcc_strict_board')
          .end(function(err, res) {
            thread2Id = res.body[0]._id;
            chai.request(server)
              .put('/api/threads/fcc_strict_board')
              .send({ thread_id: thread2Id })
              .end(function(err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.text, 'reported');
                done();
              });
          });
      });
  });

  // 6. Creating a new reply
  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/replies/fcc_strict_board')
      .send({ thread_id: thread2Id, text: 'Reply 1', delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // 7. Viewing a single thread with all replies
  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get('/api/replies/fcc_strict_board')
      .query({ thread_id: thread2Id })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'replies');
        assert.isArray(res.body.replies);
        reply1Id = res.body.replies[0]._id;
        done();
      });
  });

  // 8. Deleting a reply with the incorrect password
  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
    chai.request(server)
      .delete('/api/replies/fcc_strict_board')
      .send({ thread_id: thread2Id, reply_id: reply1Id, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 9. Deleting a reply with the correct password
  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
    chai.request(server)
      .delete('/api/replies/fcc_strict_board')
      .send({ thread_id: thread2Id, reply_id: reply1Id, delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 10. Reporting a reply
  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    chai.request(server)
      .put('/api/replies/fcc_strict_board')
      .send({ thread_id: thread2Id, reply_id: reply1Id })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

});