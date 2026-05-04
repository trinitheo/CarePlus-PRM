import https from 'https';
import fs from 'fs';

const fetchFile = (url, name) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      fs.writeFileSync(name, data);
      console.log('Downloaded', name);
    });
  });
};

fetchFile('https://raw.githubusercontent.com/trinitheo/GraphDB/main/mini-apps/TestOrderingMFE/components/forms/LabOrderForm.tsx', 'LabOrderForm.tsx');
fetchFile('https://raw.githubusercontent.com/trinitheo/GraphDB/main/mini-apps/TestOrderingMFE/components/forms/ImagingOrderForm.tsx', 'ImagingOrderForm.tsx');
fetchFile('https://raw.githubusercontent.com/trinitheo/GraphDB/main/mini-apps/TestOrderingMFE/components/forms/SpecialTestOrderForm.tsx', 'SpecialTestOrderForm.tsx');
