const https = require('https');

const TRAINING_ENDPOINT = 'https://zaytoun-cvtrain-dev.cognitiveservices.azure.com/';
const TRAINING_KEY = process.env.AZURE_CUSTOM_VISION_TRAINING_KEY || 'your-training-key-here';
const PREDICTION_RESOURCE_ID = '/subscriptions/ed8940be-2bc1-4c77-95a1-64000d0a59b7/resourceGroups/zaytoun-vision-sweden-rg/providers/Microsoft.CognitiveServices/accounts/zaytoun-cvpredict-dev';
const PROJECT_ID = 'c19a9a10-d4cd-444d-ab0a-15b8517a12fe';
const ITERATION_ID = 'ed111f52-f1e2-4e35-ab8e-36c9bb41074f';
const PUBLISH_NAME = 'ZaytounModel';

function apiRequest(method, urlStr, headers) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      method: method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => { reject(err); });
    req.end();
  });
}

async function testVersions() {
  const versions = ['v3.0', 'v3.1', 'v3.2', 'v3.3', 'v3.4-preview'];
  const headers = {
    'Training-Key': TRAINING_KEY,
    'Content-Length': '0'
  };

  for (const ver of versions) {
    const url = `${TRAINING_ENDPOINT}customvision/${ver}/training/projects/${PROJECT_ID}/iterations/${ITERATION_ID}/publish?publishName=${PUBLISH_NAME}&predictionId=${encodeURIComponent(PREDICTION_RESOURCE_ID)}`;
    console.log(`Testing version ${ver}...`);
    console.log(`URL: ${url}`);
    
    try {
      const res = await apiRequest('POST', url, headers);
      console.log(`Status: ${res.status}`);
      console.log(`Response: ${res.data}`);
      console.log('------------------------------------------------------------');
    } catch (err) {
      console.error(`Error: ${err.message}`);
      console.log('------------------------------------------------------------');
    }
  }
}

testVersions();
