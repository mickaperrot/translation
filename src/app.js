'use strict';

//  Google Cloud Speech Playground with node.js and socket.io
//  Created by Vinzenz Aubry for sansho 24.01.17
//  Feel free to improve!
//	Contact: vinzenz@sansho.studio

const express = require('express');
//const environmentVars = require('dotenv').config();

// Google Cloud
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient(); // Creates a client
const translation = require('@google-cloud/media-translation');
const translationClient = new translation.SpeechTranslationServiceClient();
const textToSpeech = require('@google-cloud/text-to-speech');
const TextToSpeechClient = new textToSpeech.TextToSpeechClient();

const app = express();
const port = process.env.PORT || 8080;
const server = require('http').createServer(app);

const io = require('socket.io')(server);

let isFirst;

app.use('/assets', express.static(__dirname + '/public'));
app.use('/session/assets', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

// =========================== ROUTERS ================================ //

app.get('/', function (req, res) {
  res.render('index', {});
});

app.use('/', function (req, res, next) {
  next();
});

// =========================== SOCKET.IO ================================ //

io.on('connection', function (client) {
  console.log('Client Connected to server');
  let recognizeStream = null;

  client.on('join', function () {
    client.emit('messages', 'Socket Connected to Server');
  });

  client.on('messages', function (data) {
    client.emit('broad', data);
  });

  client.on('startGoogleCloudStream', function (data) {
    startRecognitionStream(this, data);
  });

  client.on('endGoogleCloudStream', function () {
    stopRecognitionStream();
  });

  client.on('binaryData', function (data) {
    if (isFirst) {
        isFirst = false;
        recognizeStream.write(initialRequest);
    }
    if (recognizeStream !== null && !recognizeStream.destroyed) {
        const request = {
            audioContent: data.toString('base64'),
        };
        recognizeStream.write(request);
    }
  });

  function startRecognitionStream(client) {
    let currentTranslation = '';

    isFirst = true;

    recognizeStream = translationClient
      .streamingTranslateSpeech()
      .on('error', console.error)
      .on('data', (data) => {
          const {result, speechEventType} = data;
          if (speechEventType === 'END_OF_SINGLE_UTTERANCE') {
              process.stdout.write(`Final translation: ${currentTranslation}\n`);
              client.emit('speechData', data);
              getSpeech(currentTranslation).then( speech => {
                client.emit('tts', speech);
              });
              recognizeStream.destroy();
              //stopRecognitionStream();
              startRecognitionStream(client);
          } else {
              currentTranslation = result.textTranslationResult.translation;
              process.stdout.write(`Partial translation: ${currentTranslation}\n`);
              client.emit('speechData', data);
          }
      });
  }

  function stopRecognitionStream() {
    if (recognizeStream) {
      recognizeStream.end();
    }
    recognizeStream = null;
  }

  async function getSpeech(translation){
    console.log(`Getting speech for: ${translation}`);
    // Construct the request
    const request = {
      input: {text: translation},
      // Select the language and SSML voice gender (optional)
      voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
      // select the type of audio encoding
      audioConfig: {audioEncoding: 'LINEAR16'},
    };
  
    // Performs the text-to-speech request
    const [response] = await TextToSpeechClient.synthesizeSpeech(request);
    return response.audioContent;
  }
});

// =========================== GOOGLE CLOUD SETTINGS ================================ //

// The encoding of the audio file, e.g. 'LINEAR16'
// The sample rate of the audio file in hertz, e.g. 16000
// The BCP-47 language code to use, e.g. 'en-US'
const encoding = 'linear16';
//const sampleRateHertz = 16000;
//const languageCode = 'en-US'; //en-US
const sourceLanguage ='fr-FR';
const targetLanguage = 'en-US';

const config = {
    audioConfig: {
      audioEncoding: encoding,
      sourceLanguageCode: sourceLanguage,
      targetLanguageCode: targetLanguage,
    },
    singleUtterance: true,
  };

const initialRequest = {
    streamingConfig: config,
    audioContent: null,
  };

// =========================== START SERVER ================================ //

server.listen(port, '127.0.0.1', function () {
  console.log('Server started on port:' + port);
});
