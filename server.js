'use strict';
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// Configuration des en-têtes de sécurité Helmet
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routing des vues HTML
app.route('/b/:board/').get((req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'board.html'));
});

app.route('/b/:board/:threadid').get((req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'thread.html'));
});

app.route('/').get((req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Enregistrement des routes d'API
fccTestingRoutes(app);
apiRoutes(app);

app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

const PORT = process.env.PORT || 3000;

// Connexion MongoDB et démarrage du serveur
mongoose.connect(process.env.DB)
  .then(() => {
    console.log('MongoDB connecté avec succès');
    app.listen(PORT, () => {
      console.log('Listening on port ' + PORT);
      if (process.env.NODE_ENV === 'test') {
        console.log('Running Tests...');
        setTimeout(() => {
          try {
            runner.run();
          } catch (e) {
            console.log('Tests are not valid:', e);
          }
        }, 500); // 2 secondes pour laisser le temps à la base de s'initialiser
      }
    });
  })
  .catch(err => console.error('Erreur MongoDB:', err));
module.exports = app;