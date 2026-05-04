import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/trinitheo/GraphDB/main/mini-apps/TestOrderingMFE/components/NewOrderModal.tsx';
https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('temp_github.tsx', data);
    console.log('Downloaded');
  });
});
