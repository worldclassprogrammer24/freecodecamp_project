const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const mongoose = require('mongoose');

chai.use(chaiHttp.default || chaiHttp);

suite('Functional Tests', function() {
  this.timeout(15000);

  let testThreadId;
  let testReplyId;

  // Attente explicite de la connexion MongoDB
  before(async function() {
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => mongoose.connection.once('open', resolve));
    }
  });

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/fcc_test_board')
        .send({ text: 'FCC Test Thread', delete_password: 'pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
      chai.request(server)
        .get('/api/threads/fcc_test_board')
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtLeast(res.body.length, 1);
          testThreadId = res.body[0]._id;
          done();
        });
    });

    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
      chai.request(server)
        .put('/api/threads/fcc_test_board')
        .send({ thread_id: testThreadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/fcc_test_board')
        .send({ thread_id: testThreadId, delete_password: 'wrong' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

  });

  suite('API ROUTING FOR /api/replies/:board', function() {

    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/fcc_test_board')
        .send({ thread_id: testThreadId, text: 'FCC Test Reply', delete_password: 'pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
      chai.request(server)
        .get('/api/replies/fcc_test_board')
        .query({ thread_id: testThreadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'replies');
          testReplyId = res.body.replies[0]._id;
          done();
        });
    });

    test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
      chai.request(server)
        .put('/api/replies/fcc_test_board')
        .send({ thread_id: testThreadId, reply_id: testReplyId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });

    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/fcc_test_board')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrong' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/fcc_test_board')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/fcc_test_board')
        .send({ thread_id: testThreadId, delete_password: 'pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

  });

});