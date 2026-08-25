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

    // 1. Création du thread
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
      chai.request(server)
        .post('/api/threads/fcc_testing')
        .send({ text: 'Test Thread', delete_password: 'pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    // 2. Lecture des 10 derniers threads
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

    // 3. Signalement du thread
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

    // 4. Échec de suppression du thread (mauvais mot de passe)
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

  });

  suite('API ROUTING FOR /api/replies/:board', function() {

    // 5. Création d'une réponse
    test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
      chai.request(server)
        .post('/api/replies/fcc_testing')
        .send({ thread_id: testThreadId, text: 'Test Reply', delete_password: 'reply_pass' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });
    });

    // 6. Lecture d'un thread avec toutes ses réponses
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

    // 7. Signalement de la réponse
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

    // 8. Échec de suppression de la réponse (mauvais mot de passe)
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

    // 9. Suppression réussie de la réponse (bon mot de passe)
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

    // 10. Suppression réussie du thread (bon mot de passe) - EXÉCUTÉ EN DERNIER
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