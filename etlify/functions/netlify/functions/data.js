const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'gs-app-data.json');

function initDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      ideas: [],
      tasks: {},
      scripts: [],
      prompts: [],
      rascunhos: [],
      lastSync: new Date().toISOString()
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

function readData() {
  try {
    initDataFile();
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Erro ao ler dados:', e);
    return null;
  }
}

function saveData(data) {
  try {
    initDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Erro ao salvar dados:', e);
    return false;
  }
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const acao = body.acao || (event.queryStringParameters && event.queryStringParameters.acao);

    // GET - Retorna todos os dados
    if (event.httpMethod === 'GET' && acao === 'getAllData') {
      const data = readData();
      if (!data) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Erro ao ler dados' })
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    // POST - Salva dados
    if (event.httpMethod === 'POST' && acao === 'saveAllData') {
      const newData = body.data;
      if (!newData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Dados não fornecidos' })
        };
      }

      newData.lastSync = new Date().toISOString();
      const success = saveData(newData);

      return {
        statusCode: success ? 200 : 500,
        headers,
        body: JSON.stringify({
          success,
          message: success ? 'Salvo com sucesso' : 'Erro ao salvar',
          data: newData
        })
      };
    }

    // Ação desconhecida
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Ação desconhecida' })
    };

  } catch (error) {
    console.error('Erro:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
