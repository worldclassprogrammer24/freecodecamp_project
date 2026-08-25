// //SERVEUR PRINCIPAL

'use strict';
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();

// Configuration Helmet
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routing des vues
app.route('/b/:board/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/board.html');
});
app.route('/b/:board/:threadid').get((req, res) => {
  res.sendFile(process.cwd() + '/views/thread.html');
});
app.route('/').get((req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

fccTestingRoutes(app);
apiRoutes(app);

app.use((req, res) => {
  res.status(404).type('text').send('Not Found');
});

const PORT = process.env.PORT || 3000;

// Connexion MongoDB puis démarrage du serveur
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
            console.log('Tests are not valid:');
            console.error(e);
          }
        }, 1500);
      }
    });
  })
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

module.exports = app;

// 'use strict';
// const dns = require('dns');
// dns.setServers(['8.8.8.8', '8.8.4.4']);
// require('dotenv').config();
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const helmet = require('helmet');
// const mongoose = require('mongoose');

// const apiRoutes = require('./routes/api.js');
// const fccTestingRoutes = require('./routes/fcctesting.js');
// const runner = require('./test-runner');

// const app = express();

// // Connexion à MongoDB
// // // Remplacez votre connexion Mongoose existante par ceci :
// // mongoose.connect(process.env.DB)
// //   .then(() => console.log('MongoDB connecté avec succès'))
// //   .catch(err => console.error('Erreur de connexion MongoDB:', err));

// // Connexion MongoDB + Démarrage des tests
// mongoose.connect(process.env.DB)
//   .then(() => {
//     console.log('MongoDB connecté avec succès');
//   })
//   .catch(err => console.error('Erreur de connexion MongoDB:', err));

// const listener = app.listen(process.env.PORT || 3000, () => {
//   console.log('Listening on port ' + listener.address().port);
//   if (process.env.NODE_ENV === 'test') {
//     console.log('Running Tests...');
//     setTimeout(() => {
//       try {
//         runner.run();
//       } catch (e) {
//         console.log('Tests are not valid:');
//         console.error(e);
//       }
//     }, 2000);
//   }
// });


// // Exigences de sécurité Helmet pour le Message Board
// app.use(helmet.frameguard({ action: 'sameorigin' }));
// app.use(helmet.dnsPrefetchControl());
// app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

// app.use('/public', express.static(process.cwd() + '/public'));
// app.use(cors({ origin: '*' }));

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Routing pour les vues du projet
// app.route('/b/:board/').get((req, res) => {
//   res.sendFile(process.cwd() + '/views/board.html');
// });
// app.route('/b/:board/:threadid').get((req, res) => {
//   res.sendFile(process.cwd() + '/views/thread.html');
// });
// app.route('/').get((req, res) => {
//   res.sendFile(process.cwd() + '/views/index.html');
// });

// fccTestingRoutes(app);
// apiRoutes(app);

// app.use((req, res) => {
//   res.status(404).type('text').send('Not Found');
// });

// // const listener = app.listen(process.env.PORT || 3000, () => {
// //   console.log('Listening on port ' + listener.address().port);
// //   if (process.env.NODE_ENV === 'test') {
// //     console.log('Running Tests...');
// //     setTimeout(() => {
// //       try {
// //         runner.run();
// //       } catch (e) {
// //         console.log('Tests are not valid:');
// //         console.error(e);
// //       }
// //     }, 3500);
// //   }
// // });

// module.exports = app;