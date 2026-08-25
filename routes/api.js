'use strict';
const mongoose = require('mongoose');

// Définition du schéma et du modèle Thread
const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

const threadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: [replySchema]
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = function (app) {
  
  // --- THREADS ---
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      const board = req.params.board;
      const now = new Date();
      
      const newThread = new Thread({
        board,
        text,
        delete_password,
        created_on: now,
        bumped_on: now,
        reported: false,
        replies: []
      });

      await newThread.save();
      res.redirect(`/b/${board}/`);
    })
    
    .get(async (req, res) => {
      const board = req.params.board;
      const threads = await Thread.find({ board })
        .sort({ bumped_on: -1 })
        .limit(10)
        .lean();

      const result = threads.map(thread => {
        delete thread.delete_password;
        delete thread.reported;
        thread.replies = (thread.replies || [])
          .sort((a, b) => b.created_on - a.created_on)
          .slice(0, 3)
          .map(reply => {
            delete reply.delete_password;
            delete reply.reported;
            return reply;
          });
        return thread;
      });

      res.json(result);
    })
    
    .put(async (req, res) => {
      const { thread_id } = req.body;
      await Thread.findByIdAndUpdate(thread_id, { reported: true });
      res.send('reported');
    })
    
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const deleted = await Thread.findOneAndDelete({ _id: thread_id, delete_password });
      if (deleted) {
        res.send('success');
      } else {
        res.send('incorrect password');
      }
    });

  // --- REPLIES ---
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { thread_id, text, delete_password } = req.body;
      const board = req.params.board;
      const now = new Date();

      const newReply = {
        _id: new mongoose.Types.ObjectId(),
        text,
        delete_password,
        created_on: now,
        reported: false
      };

      await Thread.findByIdAndUpdate(thread_id, {
        bumped_on: now,
        $push: { replies: newReply }
      });

      res.redirect(`/b/${board}/${thread_id}`);
    })
    
    .get(async (req, res) => {
      const { thread_id } = req.query;
      const thread = await Thread.findById(thread_id).lean();
      if (!thread) return res.json({});

      delete thread.delete_password;
      delete thread.reported;
      thread.replies = (thread.replies || []).map(reply => {
        delete reply.delete_password;
        delete reply.reported;
        return reply;
      });

      res.json(thread);
    })
    
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      await Thread.findOneAndUpdate(
        { _id: thread_id, 'replies._id': reply_id },
        { $set: { 'replies.$.reported': true } }
      );
      res.send('reported');
    })
    
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const updated = await Thread.findOneAndUpdate(
        { _id: thread_id, 'replies._id': reply_id, 'replies.delete_password': delete_password },
        { $set: { 'replies.$.text': '[deleted]' } }
      );

      if (updated) {
        res.send('success');
      } else {
        res.send('incorrect password');
      }
    });

};