'use strict';
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

const ThreadSchema = new mongoose.Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: [ReplySchema]
});

const Thread = mongoose.model('Thread', ThreadSchema);

module.exports = function (app) {

  // --- API THREADS ---
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      try {
        const { board } = req.params;
        const { text, delete_password } = req.body;
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
      } catch (err) {
        res.status(500).send('Erreur lors de la création du thread');
      }
    })

    .get(async (req, res) => {
      try {
        const { board } = req.params;
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .lean();

        const formattedThreads = threads.map(thread => ({
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: (thread.replies || [])
            .slice(-3)
            .map(r => ({
              _id: r._id,
              text: r.text,
              created_on: r.created_on
            })),
          replycount: thread.replies.length
        }));

        res.json(formattedThreads);
      } catch (err) {
        res.status(500).send('Erreur serveur');
      }
    })

    .delete(async (req, res) => {
      try {
        const { thread_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);

        if (!thread || thread.delete_password !== delete_password) {
          return res.send('incorrect password');
        }

        await Thread.findByIdAndDelete(thread_id);
        return res.send('success');
      } catch (err) {
        res.send('incorrect password');
      }
    })

    .put(async (req, res) => {
      try {
        const { thread_id } = req.body;
        await Thread.findByIdAndUpdate(thread_id, { reported: true });
        res.send('reported');
      } catch (err) {
        res.send('reported');
      }
    });


  // --- API REPLIES ---
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      try {
        const { board } = req.params;
        const { thread_id, text, delete_password } = req.body;
        const now = new Date();

        const thread = await Thread.findById(thread_id);
        if (!thread) return res.status(404).send('Thread non trouvé');

        thread.bumped_on = now;
        thread.replies.push({
          text,
          delete_password,
          created_on: now,
          reported: false
        });
        await thread.save();

        res.redirect(`/b/${board}/${thread_id}`);
      } catch (err) {
        res.status(500).send('Erreur lors de l\'ajout de la réponse');
      }
    })

    .get(async (req, res) => {
      try {
        const { thread_id } = req.query;
        const thread = await Thread.findById(thread_id).lean();

        if (!thread) return res.status(404).json({ error: 'Thread non trouvé' });

        const formattedThread = {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: (thread.replies || []).map(r => ({
            _id: r._id,
            text: r.text,
            created_on: r.created_on
          }))
        };

        res.json(formattedThread);
      } catch (err) {
        res.status(500).send('Erreur serveur');
      }
    })

    .delete(async (req, res) => {
      try {
        const { thread_id, reply_id, delete_password } = req.body;
        const thread = await Thread.findById(thread_id);

        if (!thread) return res.send('incorrect password');

        const reply = thread.replies.id(reply_id);
        if (!reply || reply.delete_password !== delete_password) {
          return res.send('incorrect password');
        }

        reply.text = '[deleted]';
        await thread.save();
        return res.send('success');
      } catch (err) {
        res.send('incorrect password');
      }
    })

    .put(async (req, res) => {
      try {
        const { thread_id, reply_id } = req.body;
        const thread = await Thread.findById(thread_id);

        if (thread) {
          const reply = thread.replies.id(reply_id);
          if (reply) {
            reply.reported = true;
            await thread.save();
          }
        }
        res.send('reported');
      } catch (err) {
        res.send('reported');
      }
    });
};