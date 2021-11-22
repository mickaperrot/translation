# Google Cloud Live Speech Translation

Live translate Speech using Google Cloud APIs.

How this works:
1. Record live speech from your microphone.
1. The speech is sent to the [Google Cloud Media Translation API](https://cloud.google.com/media-translation).
1. Once the text translation is received from the Media Translation API, it is then sent to the [Google Cloud Text-to-Speech API](https://cloud.google.com/text-to-speech)
  
## Installation
### Enable the APIs
From [Cloud Shell](https://cloud.google.com/shell), enable the Media Translation and the Text-to-Speech APIs:
```
gcloud services enable mediatranslation.googleapis.com texttospeech.googleapis.com
```
### Clone the git repository
Clone this git repository:
```
git clone https://github.com/mickaperrot/translation.git && cd translation/src
```
### Deploy to App Engine
Deploy the application to App Engine and select the closest region when prompted and validated configuration:
```
gcloud app deploy
```
### Connect to the app
Capture the endpoint URL from the previous command (```https://PROJECT_ID.REGION_ID.r.appspot.com```) and use your favorite browser to access the sample app!
