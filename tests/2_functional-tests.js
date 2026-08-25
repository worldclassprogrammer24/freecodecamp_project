const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose');

chai.use(chaiHttp.default || chaiHttp);

suite('Functional Tests', function() {
  this.timeout(20000);

  before(function(done) {
    if (mongoose.connection.readyState === 1) {
      done();
    } else {
      mongoose.connection.once('open', () => done());
    }
  });

  let testThreadId;
  let testReplyId;

  suite('API ROUTING FOR /api/threads/:board', function() {
    this.timeout(20000);

    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/fcc_testing')
        .send({ text: 'Test Thread', delete_password: 'pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get('/api/threads/fcc_testing')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtLeast(res.body.length, 1);
          assert.property(res.body[0], '_id');
          testThreadId = res.body[0]._id;
          done();
        });
    });

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
      chai.request(server)
        .delete('/api/threads/fcc_testing')
        .send({ thread_id: testThreadId, delete_password: 'wrong_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put('/api/threads/fcc_testing')
        .send({ thread_id: testThreadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    this.timeout(20000);

    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/fcc_testing')
        .send({ thread_id: testThreadId, text: 'Test Reply', delete_password: 'reply_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
      chai.request(server)
        .get('/api/replies/fcc_testing')
        .query({ thread_id: testThreadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          assert.isAtLeast(res.body.replies.length, 1);
          testReplyId = res.body.replies[0]._id;
          done();
        });
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      chai.request(server)
        .put('/api/replies/fcc_testing')
        .send({ thread_id: testThreadId, reply_id: testReplyId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
      chai.request(server)
        .delete('/api/replies/fcc_testing')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrong_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
      chai.request(server)
        .delete('/api/replies/fcc_testing')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'reply_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
      chai.request(server)
        .delete('/api/threads/fcc_testing')
        .send({ thread_id: testThreadId, delete_password: 'pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

  });

});