const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const PCA = require('pca-js');

// Create an Express app
const app = express();
const port = 3000; // You can use any port you prefer

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

app.get('/', async (req, res) => {
   

    const columnsToInclude = ['gpslat', 'gpslon', 'gpslatrepon', 'gpslonrepon'];
    const results = [];

   
    await fs.createReadStream('data.csv')
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
            const relevantData = {};
            for (const key in row) {
                if (columnsToInclude.includes(key)) {
                    relevantData[key] = parseFloat(row[key]) || 0; // Convert to numeric values
                }
            }
            results.push(relevantData);
        })
        .on('end', async () => {
            const numericData = results.map((row) => Object.values(row));
            const pcaResult = await PCA.getEigenVectors(numericData);

            // Choose the number of principal components you want to keep
            const k = 2;

             // Select the top-k eigenvectors from the PCA result
            const topKEigenvectors = [];
            for (i = 0; i < k; i++) {
                topKEigenvectors.push(pcaResult[i]["vector"])
            }

            //reducing the dimensionality of the data by doing matric multiplication between the initial data and the vectors selected 
            const reducedData = numericData.map((row) => {
              const transformedRow = new Array(k).fill(0);
              for (let i = 0; i < k; i++) {
                for (let j = 0; j < row.length; j++) {
                  transformedRow[i] += row[j] * topKEigenvectors[i][j];
                }
              }
              return transformedRow;
            });
            res.send(reducedData);
        })



});
