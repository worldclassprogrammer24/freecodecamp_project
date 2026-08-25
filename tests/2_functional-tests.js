const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp.default || chaiHttp);

suite('Functional Tests', function() {
  this.timeout(15000);

  let testThreadId;
  let testReplyId;

  suite('API ROUTING FOR /api/threads/:board', function() {
    this.timeout(15000);

    // 1. POST /api/threads/{board}
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/fcc_testing')
        .send({ text: 'Test Thread', delete_password: 'pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    // 2. GET /api/threads/{board}
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

    // 3. PUT /api/threads/{board}
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

    // 4. DELETE /api/threads/{board} (incorrect password)
    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board}', function(done) {
      chai.request(server)
        .delete('/api/threads/fcc_testing')
        .send({ thread_id: testThreadId, delete_password: 'wrong_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    this.timeout(15000);

    // 5. POST /api/replies/{board}
    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/fcc_testing')
        .send({ thread_id: testThreadId, text: 'Test Reply', delete_password: 'reply_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    // 6. GET /api/replies/{board}
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

    // 7. PUT /api/replies/{board}
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

    // 8. DELETE /api/replies/{board} (incorrect password)
    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/fcc_testing')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrong_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    // 9. DELETE /api/replies/{board} (correct password)
    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board}', function(done) {
      chai.request(server)
        .delete('/api/replies/fcc_testing')
        .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'reply_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    // 10. DELETE /api/threads/{board} (correct password)
    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board}', function(done) {
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