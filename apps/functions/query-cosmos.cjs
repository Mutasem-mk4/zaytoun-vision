const { CosmosClient } = require('@azure/cosmos');

const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING || 'AccountEndpoint=https://zaytoun-cosmos-dev.documents.azure.com:443/;AccountKey=your-key-here;';
const client = new CosmosClient(connectionString);
const container = client.database('zaytoun-vision').container('analyses');

async function run() {
  console.log('Fetching last 10 analyses from Cosmos DB...');
  const { resources } = await container.items
    .query('SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT 10')
    .fetchAll();

  resources.forEach(r => {
    console.log(`- ID: ${r.id}`);
    console.log(`  Name: ${r.sampleName}`);
    console.log(`  Purity: ${r.purityScore}%`);
    console.log(`  Status: ${r.status}`);
    console.log(`  Timestamp: ${r.timestamp}`);
    console.log(`  Image: ${r.imageUrl ? r.imageUrl.substring(0, 100) + '...' : 'none'}`);
    console.log('------------------------------');
  });
}

run().catch(console.error);
